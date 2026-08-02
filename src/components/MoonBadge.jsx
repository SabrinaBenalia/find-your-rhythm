import { getMoonEmoji, isFullMoon, isNewMoon } from '../utils/cosmos';

export default function MoonBadge({ phase, name, isEclipse }) {
  const emoji = getMoonEmoji(phase);
  const special = isFullMoon(phase) || isNewMoon(phase) || isEclipse;

  return (
    <span className={`moon-badge ${special ? 'special' : ''}`} title={`${name}${isEclipse ? ' • Eclipse' : ''}`}>
      {emoji} {isEclipse && '⚡'}
    </span>
  );
}
