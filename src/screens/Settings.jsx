import { useState, useRef } from 'react';
import { getSettings, saveSettings, importEntries, exportJSON, exportCSV } from '../utils/storage';
import { SEED_ENTRIES } from '../utils/seed';
import { generateInsights } from '../utils/cycle';
import { getAllEntries } from '../utils/storage';
import { backupToGoogleDrive, listBackups, restoreFromGoogleDrive, connectDrive, hasCredentials, isConnected } from '../utils/drive';
import { Download, Upload, CloudUpload, RefreshCw, Lightbulb, X, Plus, Check } from 'lucide-react';

const TAG_CATEGORIES = [
  { key: 'symptoms',   label: 'Symptoms' },
  { key: 'herbs',      label: 'Herbs & Supplements' },
  { key: 'activities', label: 'Activities' },
];

export default function Settings() {
  const [settings, setSettings] = useState(getSettings);
  const [saved, setSaved] = useState(false);
  const [driveStatus, setDriveStatus] = useState('');
  const [backups, setBackups] = useState([]);
  const [insights, setInsights] = useState(null);
  const [activeTagKey, setActiveTagKey] = useState(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const tagInputRefs = useRef({});

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function downloadJSON() {
    const json = exportJSON();
    downloadFile(json, 'find-your-rhythm.json', 'application/json');
  }

  function downloadCSV() {
    const csv = exportCSV();
    downloadFile(csv, 'find-your-rhythm.csv', 'text/csv');
  }

  function downloadFile(content, name, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        importEntries(data);
        setDriveStatus('✓ Data restored from file.');
        setTimeout(() => setDriveStatus(''), 3000);
      } catch {
        setDriveStatus('⚠ Invalid JSON file.');
        setTimeout(() => setDriveStatus(''), 3000);
      }
    };
    reader.readAsText(file);
  }

  async function handleDriveBackup() {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setDriveStatus('⚠ Google Drive not configured. See README for setup.');
      return;
    }
    setDriveStatus('Connecting to Google Drive…');
    try {
      await backupToGoogleDrive(exportJSON(), exportCSV());
      setDriveStatus('✓ Backed up to Google Drive.');
    } catch (err) {
      setDriveStatus(`⚠ Drive error: ${err.message || err}`);
    }
    setTimeout(() => setDriveStatus(''), 5000);
  }

  async function handleListBackups() {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setDriveStatus('⚠ Google Drive not configured.');
      return;
    }
    try {
      const files = await listBackups();
      setBackups(files);
    } catch (err) {
      setDriveStatus(`⚠ ${err.message || err}`);
    }
  }

  async function handleRestore(fileId) {
    try {
      setDriveStatus('Restoring…');
      const json = await restoreFromGoogleDrive(fileId);
      importEntries(JSON.parse(json));
      setDriveStatus('✓ Data restored from Drive.');
      setBackups([]);
    } catch (err) {
      setDriveStatus(`⚠ ${err.message || err}`);
    }
    setTimeout(() => setDriveStatus(''), 4000);
  }

  function openTagInput(catKey) {
    setActiveTagKey(catKey);
    setTagInputValue('');
    tagInputRefs.current[catKey]?.focus(); // synchronous focus — input already in DOM
  }

  function submitTag(catKey) {
    const val = tagInputValue.trim().toLowerCase();
    if (!val) return;
    const current = settings.tagLists?.[catKey] || [];
    if (!current.includes(val)) {
      const updated = { ...settings, tagLists: { ...settings.tagLists, [catKey]: [...current, val] } };
      setSettings(updated);
      saveSettings(updated);
    }
    setActiveTagKey(null);
    setTagInputValue('');
  }

  function removeTag(category, tag) {
    const current = settings.tagLists?.[category] || [];
    setSettings(s => ({ ...s, tagLists: { ...s.tagLists, [category]: current.filter(t => t !== tag) } }));
  }

  function showInsights() {
    const all = getAllEntries();
    setInsights(generateInsights(all));
  }

  return (
    <div className="screen settings-screen">
      <header className="screen-header">
        <h2>Settings</h2>
      </header>

      {/* Location */}
      <section className="settings-section">
        <h3>Location & Hemisphere</h3>
        <div className="setting-row">
          <label>Hemisphere</label>
          <div className="seg-control">
            {['north', 'south'].map(h => (
              <button
                key={h}
                className={settings.hemisphere === h ? 'active' : ''}
                onClick={() => setSettings(s => ({ ...s, hemisphere: h }))}
              >
                {h === 'north' ? 'Northern' : 'Southern'}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <label>Latitude</label>
          <div className="lat-input-row">
            <input
              type="number"
              min="-90"
              max="90"
              value={settings.latitude}
              onChange={e => setSettings(s => ({ ...s, latitude: Number(e.target.value) }))}
              className="lat-input"
            />
            <span>°</span>
          </div>
          <p className="help-text">Used to calculate daylight hours (e.g. 51 for London, 37 for San Francisco, -33 for Sydney)</p>
        </div>
        <button className="settings-btn primary" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
      </section>

      {/* Manage Tags */}
      <section className="settings-section">
        <h3>Manage Tags</h3>
        <p className="help-text">These appear as pill options on the Today screen. Add or remove freely.</p>
        {TAG_CATEGORIES.map(cat => (
          <div key={cat.key} className="tag-manage-block">
            <span className="tag-manage-label">{cat.label}</span>
            <div className="tag-manage-pills">
              {(settings.tagLists?.[cat.key] || []).map(tag => (
                <span key={tag} className="tag-manage-pill">
                  {tag}
                  <button onClick={() => removeTag(cat.key, tag)} type="button"><X size={11} /></button>
                </span>
              ))}
            </div>
            {/* Input always in DOM so focus() works synchronously on iOS PWA */}
            <div className="custom-tag-row" style={{ display: activeTagKey === cat.key ? 'flex' : 'none' }}>
              <input
                ref={el => { tagInputRefs.current[cat.key] = el; }}
                type="text"
                placeholder={`Type ${cat.label.toLowerCase()}…`}
                value={tagInputValue}
                onChange={e => setTagInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitTag(cat.key)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <button type="button" onClick={() => submitTag(cat.key)}><Check size={16} /></button>
              <button type="button" onClick={() => setActiveTagKey(null)}><X size={16} /></button>
            </div>
            {activeTagKey !== cat.key && (
              <button
                className="settings-btn"
                style={{ marginTop: 8 }}
                type="button"
                onClick={() => openTagInput(cat.key)}
              >
                <Plus size={16} /> Add {cat.label.toLowerCase()}
              </button>
            )}
          </div>
        ))}
        <button className="settings-btn primary" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save tag lists'}
        </button>
      </section>

      {/* Notifications */}
      <section className="settings-section">
        <h3>Notifications</h3>
        <p className="help-text">Your cycle summary will be emailed here at the start of each new cycle.</p>
        <div className="setting-row">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={settings.email || ''}
            onChange={e => setSettings(s => ({ ...s, email: e.target.value }))}
            className="lat-input"
            style={{ width: '100%', maxWidth: '240px' }}
          />
        </div>
        <button className="settings-btn primary" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </section>

      {/* AI Insights */}
      <section className="settings-section">
        <h3>AI Insights</h3>
        <p className="help-text">Your Anthropic API key is stored locally on this device and used only to call Claude from the AI Insights tab.</p>
        <div className="setting-row" style={{ marginTop: 10 }}>
          <label>API key</label>
          <input
            type="password"
            placeholder="sk-ant-…"
            value={settings.anthropicApiKey || ''}
            onChange={e => setSettings(s => ({ ...s, anthropicApiKey: e.target.value }))}
            className="lat-input"
            style={{ width: '100%', maxWidth: '240px', fontFamily: 'monospace', fontSize: 13 }}
          />
        </div>
        <button className="settings-btn primary" onClick={handleSave} style={{ marginTop: 10 }}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </section>

      {/* Insights */}
      <section className="settings-section">
        <h3>Pattern Insights</h3>
        <button className="settings-btn" onClick={showInsights}>
          <Lightbulb size={16} /> Generate insights
        </button>
        {insights !== null && (
          <div className="insights-list">
            {insights.length === 0
              ? <p className="help-text">Log at least 2 weeks of data to see insights.</p>
              : insights.map((i, idx) => <p key={idx} className="insight-item">✦ {i}</p>)
            }
          </div>
        )}
      </section>

      {/* Export */}
      <section className="settings-section">
        <h3>Export Data</h3>
        <div className="btn-row">
          <button className="settings-btn" onClick={downloadJSON}>
            <Download size={16} /> Export JSON
          </button>
          <button className="settings-btn" onClick={downloadCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </section>

      {/* Import */}
      <section className="settings-section">
        <h3>Import / Restore</h3>
        <label className="settings-btn file-btn">
          <Upload size={16} /> Import JSON file
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <button className="settings-btn" style={{ marginTop: 8, borderStyle: 'dashed' }} onClick={() => { importEntries(SEED_ENTRIES); setDriveStatus('✓ Sample cycle loaded. Refresh the page.'); setTimeout(() => setDriveStatus(''), 4000); }}>
          Load sample cycle (Jul 12 – Aug 3)
        </button>
        {driveStatus && <p className={`drive-status ${driveStatus.startsWith('⚠') ? 'error' : 'ok'}`}>{driveStatus}</p>}
      </section>

      {/* Google Drive */}
      <section className="settings-section">
        <h3>Google Drive Sync</h3>
        <p className="help-text">
          Your data auto-saves to a <strong>Find Your Rhythm</strong> folder in your Google Drive every time you save an entry. Each user connects their own Google account.
        </p>
        <p className="help-text" style={{ marginTop: 6 }}>
          You need a Google Cloud project with Drive API enabled. Get a Client ID and API Key from <strong>console.cloud.google.com</strong>.
        </p>
        <div className="setting-row" style={{ marginTop: 10 }}>
          <label>Client ID</label>
          <input
            type="text"
            placeholder="xxxx.apps.googleusercontent.com"
            value={settings.googleClientId || ''}
            onChange={e => setSettings(s => ({ ...s, googleClientId: e.target.value }))}
            className="lat-input"
            style={{ width: '100%', maxWidth: '240px', fontSize: 12, fontFamily: 'monospace' }}
          />
        </div>
        <div className="setting-row">
          <label>API Key</label>
          <input
            type="password"
            placeholder="AIza…"
            value={settings.googleApiKey || ''}
            onChange={e => setSettings(s => ({ ...s, googleApiKey: e.target.value }))}
            className="lat-input"
            style={{ width: '100%', maxWidth: '240px', fontSize: 12, fontFamily: 'monospace' }}
          />
        </div>
        <button className="settings-btn primary" onClick={handleSave} style={{ marginTop: 10 }}>
          {saved ? '✓ Saved' : 'Save credentials'}
        </button>

        {hasCredentials() && (
          <>
            <button className="settings-btn" style={{ marginTop: 8 }} onClick={async () => {
              try {
                setDriveStatus('Connecting…');
                await connectDrive();
                setDriveStatus('✓ Connected to Google Drive. Auto-backup is now active.');
              } catch (err) {
                setDriveStatus(`⚠ ${err.message || err}`);
              }
              setTimeout(() => setDriveStatus(''), 5000);
            }}>
              <CloudUpload size={16} /> Connect Google Drive
            </button>

            {isConnected() && (
              <div className="btn-row" style={{ marginTop: 8 }}>
                <button className="settings-btn" onClick={handleDriveBackup}>
                  <CloudUpload size={16} /> Backup now
                </button>
                <button className="settings-btn" onClick={handleListBackups}>
                  <RefreshCw size={16} /> Restore
                </button>
              </div>
            )}
          </>
        )}

        {driveStatus && <p className={`drive-status ${driveStatus.startsWith('⚠') ? 'error' : 'ok'}`}>{driveStatus}</p>}
        {backups.length > 0 && (
          <div className="backup-list">
            <h4>Choose a file to restore:</h4>
            {backups.map(f => (
              <button key={f.id} className="backup-item" onClick={() => handleRestore(f.id)}>
                {f.name} <span className="backup-date">{f.modifiedTime?.slice(0, 10)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="settings-footer">
        <p>Find Your Rhythm · All data stored locally on this device</p>
        <p style={{ marginTop: 4, fontSize: 10, opacity: 0.5 }}>build {__BUILD_DATE__}</p>
      </div>
    </div>
  );
}
