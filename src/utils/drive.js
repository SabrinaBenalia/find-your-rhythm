import { getSettings } from './storage';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const FOLDER_NAME = 'Find Your Rhythm';

let tokenClient = null;
let gapiReady = false;
let gisReady = false;
let initApiKey = null;
let initClientId = null;

function creds() {
  const s = getSettings();
  return { clientId: s.googleClientId || '', apiKey: s.googleApiKey || '' };
}

export function hasCredentials() {
  const { clientId, apiKey } = creds();
  return !!(clientId && apiKey);
}

export function isConnected() {
  try { return window.gapi?.client?.getToken() != null; }
  catch { return false; }
}

async function ensureGapi() {
  const { apiKey } = creds();
  if (gapiReady && initApiKey === apiKey) return;

  await new Promise((resolve, reject) => {
    if (window.gapi) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://apis.google.com/js/api.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  await new Promise(r => window.gapi.load('client', r));
  await window.gapi.client.init({ apiKey, discoveryDocs: [DISCOVERY_DOC] });
  gapiReady = true;
  initApiKey = apiKey;
}

async function ensureGis() {
  const { clientId } = creds();
  if (gisReady && initClientId === clientId) return;

  await new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: '',
  });
  gisReady = true;
  initClientId = clientId;
}

export async function initGoogleAPIs() {
  const { clientId, apiKey } = creds();
if (!clientId || !apiKey) throw new Error('Add your Google Client ID and API Key in Settings → Google Drive.');
  await Promise.all([ensureGapi(), ensureGis()]);
}

function getToken(forceConsent = false) {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) reject(new Error(resp.error));
      else resolve(resp);
    };
    const existing = window.gapi.client.getToken();
    tokenClient.requestAccessToken({ prompt: (existing && !forceConsent) ? '' : 'consent' });
  });
}

export async function connectDrive() {
  await initGoogleAPIs();
  await getToken(true);
}

// ── Folder management ─────────────────────────────────────────────────────────

let cachedFolderId = null;

async function getOrCreateFolder() {
  if (cachedFolderId) return cachedFolderId;

  const resp = await window.gapi.client.drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (resp.result.files?.length > 0) {
    cachedFolderId = resp.result.files[0].id;
    return cachedFolderId;
  }

  const create = await window.gapi.client.drive.files.create({
    resource: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
  });
  cachedFolderId = create.result.id;
  return cachedFolderId;
}

// ── File upsert (update if exists, create if not) ────────────────────────────

async function upsertFile(name, content, mimeType, folderId) {
  const boundary = '-------314159265358979323846';
  const delim = `\r\n--${boundary}\r\n`;
  const close = `\r\n--${boundary}--`;
  const headers = { 'Content-Type': `multipart/related; boundary="${boundary}"` };

  const makeBody = (meta) =>
    delim + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(meta) +
    delim + `Content-Type: ${mimeType}\r\n\r\n` + content + close;

  const existing = await window.gapi.client.drive.files.list({
    q: `name='${name}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });

  if (existing.result.files?.length > 0) {
    const fileId = existing.result.files[0].id;
    await window.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: { uploadType: 'multipart' },
      headers,
      body: makeBody({ name, mimeType }),
    });
  } else {
    await window.gapi.client.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers,
      body: makeBody({ name, mimeType, parents: [folderId] }),
    });
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function backupToGoogleDrive(jsonStr, csvStr) {
  await initGoogleAPIs();
  await getToken();
  const folderId = await getOrCreateFolder();
  await upsertFile('data.json', jsonStr, 'application/json', folderId);
  await upsertFile('data.csv', csvStr, 'text/csv', folderId);
  await upsertFile('settings.json', JSON.stringify(getSettings()), 'application/json', folderId);
}

// Silent auto-backup — called after every entry save, fails quietly.
// Never overwrites Drive with fewer entries than what's already there,
// so a reinstall can't clobber a fuller backup.
export async function autoBackup(jsonStr, csvStr) {
  if (!isConnected() || !hasCredentials()) return;
  try {
    const folderId = await getOrCreateFolder();

    // Check how many entries the Drive backup has before overwriting
    const existing = await window.gapi.client.drive.files.list({
      q: `name='data.json' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });
    if (existing.result.files?.length > 0) {
      const fileId = existing.result.files[0].id;
      const resp = await window.gapi.client.drive.files.get({ fileId, alt: 'media' });
      try {
        const driveEntries = Object.keys(JSON.parse(resp.body));
        const localEntries = Object.keys(JSON.parse(jsonStr));
        if (driveEntries.length > localEntries.length) return; // Drive has more data — don't overwrite
      } catch { /* if we can't parse, proceed with overwrite */ }
    }

    await upsertFile('data.json', jsonStr, 'application/json', folderId);
    await upsertFile('data.csv', csvStr, 'text/csv', folderId);
    await upsertFile('settings.json', JSON.stringify(getSettings()), 'application/json', folderId);
  } catch { /* silent */ }
}

export async function restoreSettingsFromDrive() {
  const folderId = await getOrCreateFolder();
  const resp = await window.gapi.client.drive.files.list({
    q: `name='settings.json' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });
  if (!resp.result.files?.length) return null;
  const file = await window.gapi.client.drive.files.get({ fileId: resp.result.files[0].id, alt: 'media' });
  return file.body;
}

export async function listBackups() {
  await initGoogleAPIs();
  await getToken();
  const folderId = await getOrCreateFolder();
  const resp = await window.gapi.client.drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,modifiedTime)',
    orderBy: 'modifiedTime desc',
  });
  return resp.result.files || [];
}

export async function restoreFromGoogleDrive(fileId) {
  await initGoogleAPIs();
  await getToken();
  const resp = await window.gapi.client.drive.files.get({ fileId, alt: 'media' });
  return resp.body;
}
