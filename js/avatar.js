/* Kidy — the child's avatar.
   A simple, warm SVG character built from a few finite choices (no shop,
   no unlockables, no random rewards — identity, not dopamine).
   Base look (skin, hair) is set by the parent in the parents corner;
   outfits (dress, cape, crown…) are played with in the dress-up game. */

const AVATAR_SKINS = ['#F5D0A9', '#EAB584', '#C68B59', '#8D5A3B'];
const AVATAR_HAIR_COLORS = ['#2E2A28', '#4A3626', '#7B4B2A', '#B8814A', '#D98CA6', '#8FBA8F'];
const AVATAR_OUTFIT_COLORS = ['#E2926B', '#7FA7C9', '#8FBA8F', '#D98CA6', '#A48BC0', '#F2D27E'];
const AVATAR_HAIR_STYLES = ['short', 'curly', 'pigtails', 'hijab'];
const AVATAR_OUTFITS = ['shirt', 'dress', 'cape'];
const AVATAR_HEADWEAR = ['none', 'crown', 'hat', 'mask'];

const AVATAR_DEFAULT = { skin: 0, hair: 1, hairColor: 0, outfit: 'shirt', outfitColor: 1, head: 'none' };

function avatarSVG(cfg, cls) {
  const c = Object.assign({}, AVATAR_DEFAULT, cfg || {});
  const skin = AVATAR_SKINS[c.skin] || AVATAR_SKINS[0];
  const hairC = AVATAR_HAIR_COLORS[c.hairColor] || AVATAR_HAIR_COLORS[0];
  const outC = AVATAR_OUTFIT_COLORS[c.outfitColor] || AVATAR_OUTFIT_COLORS[1];
  const style = AVATAR_HAIR_STYLES[c.hair] || 'short';
  const parts = [];

  // cape behind everything
  if (c.outfit === 'cape') {
    parts.push(`<path d="M18 100 L38 64 L62 64 L82 100 Z" fill="${outC}" opacity="0.9"/>`);
  }

  // body / outfit
  if (c.outfit === 'dress') {
    parts.push(`<path d="M28 100 L40 68 Q50 62 60 68 L72 100 Z" fill="${outC}"/>`);
  } else {
    parts.push(`<path d="M27 100 Q27 72 50 72 Q73 72 73 100 Z" fill="${c.outfit === 'cape' ? '#6E7FB8' : outC}"/>`);
  }
  if (c.outfit === 'cape') {
    parts.push(`<path d="M50 78 L52.4 83 L58 83.7 L54 87.5 L55 93 L50 90.4 L45 93 L46 87.5 L42 83.7 L47.6 83 Z" fill="#F2D27E"/>`);
  }

  // head
  if (style === 'hijab') {
    parts.push(`<ellipse cx="50" cy="47" rx="36" ry="38" fill="${hairC}"/>`);
    parts.push(`<circle cx="50" cy="47" r="26" fill="${skin}"/>`);
  } else {
    parts.push(`<circle cx="50" cy="45" r="30" fill="${skin}"/>`);
    if (style === 'short') {
      parts.push(`<path d="M20 45 A30 30 0 0 1 80 45 L80 38 A30 30 0 0 0 20 38 Z" fill="${hairC}"/>`);
      parts.push(`<path d="M20 45 A30 30 0 0 1 80 45 L74 45 A24 26 0 0 0 26 45 Z" fill="${hairC}"/>`);
    } else if (style === 'curly') {
      parts.push(`<circle cx="32" cy="26" r="14" fill="${hairC}"/>`);
      parts.push(`<circle cx="50" cy="19" r="15" fill="${hairC}"/>`);
      parts.push(`<circle cx="68" cy="26" r="14" fill="${hairC}"/>`);
    } else if (style === 'pigtails') {
      parts.push(`<path d="M20 45 A30 30 0 0 1 80 45 L74 45 A24 26 0 0 0 26 45 Z" fill="${hairC}"/>`);
      parts.push(`<circle cx="15" cy="44" r="10" fill="${hairC}"/>`);
      parts.push(`<circle cx="85" cy="44" r="10" fill="${hairC}"/>`);
    }
  }

  // face
  const eyeY = style === 'hijab' ? 45 : 43;
  parts.push(`<circle cx="41" cy="${eyeY}" r="2.6" fill="#4E4439"/>`);
  parts.push(`<circle cx="59" cy="${eyeY}" r="2.6" fill="#4E4439"/>`);
  parts.push(`<path d="M42 ${eyeY + 10} Q50 ${eyeY + 17} 58 ${eyeY + 10}" stroke="#4E4439" stroke-width="2.6" stroke-linecap="round" fill="none"/>`);

  // headwear on top
  if (c.head === 'crown') {
    parts.push(`<path d="M31 19 L38 4 L46 15 L54 2 L62 15 L70 4 L77 19 Q54 12 31 19 Z" fill="#E9B949" stroke="#D19E2E" stroke-width="1.5"/>`);
  } else if (c.head === 'hat') {
    parts.push(`<ellipse cx="50" cy="19" rx="27" ry="6.5" fill="#E8C97A"/>`);
    parts.push(`<path d="M31 18 A19 15 0 0 1 69 18 Z" fill="#E8C97A"/>`);
    parts.push(`<path d="M31 18 A19 15 0 0 1 69 18" fill="none" stroke="#D4B25C" stroke-width="1.5"/>`);
  } else if (c.head === 'mask') {
    parts.push(`<rect x="29" y="${eyeY - 7}" width="42" height="14" rx="7" fill="#5A6EB5"/>`);
    parts.push(`<circle cx="41" cy="${eyeY}" r="3.6" fill="#FDF6EC"/>`);
    parts.push(`<circle cx="59" cy="${eyeY}" r="3.6" fill="#FDF6EC"/>`);
    parts.push(`<circle cx="41" cy="${eyeY}" r="1.8" fill="#4E4439"/>`);
    parts.push(`<circle cx="59" cy="${eyeY}" r="1.8" fill="#4E4439"/>`);
  }

  return `<svg viewBox="0 0 100 100" class="avatar ${cls || ''}" aria-hidden="true">${parts.join('')}</svg>`;
}
