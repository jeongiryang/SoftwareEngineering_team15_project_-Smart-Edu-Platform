function toSvgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const avatarSkySvg = `
<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyBg" x1="32" y1="24" x2="196" y2="212" gradientUnits="userSpaceOnUse">
      <stop stop-color="#EAF6FF"/>
      <stop offset="1" stop-color="#BCDFFF"/>
    </linearGradient>
    <linearGradient id="skyAccent" x1="88" y1="40" x2="162" y2="198" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4B89D8"/>
      <stop offset="1" stop-color="#255B9A"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="120" fill="url(#skyBg)"/>
  <circle cx="120" cy="90" r="42" fill="#F9FEFF"/>
  <path d="M120 138C83.5492 138 54 167.549 54 204V216H186V204C186 167.549 156.451 138 120 138Z" fill="#F9FEFF"/>
  <path d="M153.08 69.22L176.32 92.46L117.95 150.83L90.57 157.67L97.41 130.29L153.08 69.22Z" fill="url(#skyAccent)"/>
  <path d="M153.08 69.22L164.23 58.07C167.29 55.01 172.26 55.01 175.32 58.07L187.47 70.22C190.53 73.28 190.53 78.25 187.47 81.31L176.32 92.46L153.08 69.22Z" fill="#2F6FB7"/>
  <path d="M90.57 157.67L84 184L110.33 177.43L90.57 157.67Z" fill="#F3D4A0"/>
</svg>`;

const avatarForestSvg = `
<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="forestBg" x1="28" y1="28" x2="208" y2="208" gradientUnits="userSpaceOnUse">
      <stop stop-color="#EAF7F1"/>
      <stop offset="1" stop-color="#BFE8D0"/>
    </linearGradient>
    <linearGradient id="forestAccent" x1="85" y1="52" x2="165" y2="196" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4AA37D"/>
      <stop offset="1" stop-color="#22664C"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="120" fill="url(#forestBg)"/>
  <circle cx="120" cy="88" r="42" fill="#FAFFFD"/>
  <path d="M120 136C83.5492 136 54 165.549 54 202V216H186V202C186 165.549 156.451 136 120 136Z" fill="#FAFFFD"/>
  <path d="M116 46L145 93H87L116 46Z" fill="url(#forestAccent)"/>
  <path d="M149 70L179 119H119L149 70Z" fill="#2F7C5A"/>
  <path d="M93 82L122 131H64L93 82Z" fill="#4AA37D"/>
  <rect x="112" y="129" width="16" height="44" rx="8" fill="#7A583B"/>
</svg>`;

const backgroundDawnSvg = `
<svg width="800" height="460" viewBox="0 0 800 460" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dawnBg" x1="74" y1="42" x2="702" y2="372" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF4E5"/>
      <stop offset="0.45" stop-color="#FADCC6"/>
      <stop offset="1" stop-color="#DCCFEF"/>
    </linearGradient>
    <linearGradient id="dawnHill" x1="400" y1="220" x2="400" y2="430" gradientUnits="userSpaceOnUse">
      <stop stop-color="#C8E1D8"/>
      <stop offset="1" stop-color="#9DBFB5"/>
    </linearGradient>
  </defs>
  <rect width="800" height="460" rx="36" fill="url(#dawnBg)"/>
  <circle cx="606" cy="110" r="58" fill="#FFF9F0"/>
  <path d="M0 346C119.427 288.28 205.709 268 314 280C409.827 290.615 469.769 354.822 571 362C668.933 368.945 735.807 330.177 800 290V460H0V346Z" fill="url(#dawnHill)"/>
  <path d="M0 382C112.883 344.072 181.292 338.094 276 350C364.624 361.142 456.446 421.666 548 420C657.93 417.999 717.277 372.242 800 340V460H0V382Z" fill="#6FA6A4" fill-opacity="0.25"/>
</svg>`;

const backgroundMintSvg = `
<svg width="800" height="460" viewBox="0 0 800 460" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mintBg" x1="54" y1="36" x2="692" y2="404" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E7F5F0"/>
      <stop offset="1" stop-color="#D6F0F4"/>
    </linearGradient>
    <linearGradient id="mintPaper" x1="120" y1="70" x2="640" y2="386" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F6FFFD"/>
    </linearGradient>
  </defs>
  <rect width="800" height="460" rx="36" fill="url(#mintBg)"/>
  <rect x="86" y="58" width="628" height="344" rx="28" fill="url(#mintPaper)"/>
  <path d="M132 144H666" stroke="#DDEEEB" stroke-width="10" stroke-linecap="round"/>
  <path d="M132 196H666" stroke="#DDEEEB" stroke-width="10" stroke-linecap="round"/>
  <path d="M132 248H666" stroke="#DDEEEB" stroke-width="10" stroke-linecap="round"/>
  <path d="M132 300H666" stroke="#DDEEEB" stroke-width="10" stroke-linecap="round"/>
  <path d="M180 90V366" stroke="#F3D4A0" stroke-width="8" stroke-linecap="round"/>
</svg>`;

export const SHOP_ASSET_URI_MAP = {
  '/assets/shop/avatar-sky.png': toSvgDataUri(avatarSkySvg),
  '/assets/shop/avatar-forest.png': toSvgDataUri(avatarForestSvg),
  '/assets/shop/background-dawn.png': toSvgDataUri(backgroundDawnSvg),
  '/assets/shop/background-mint.png': toSvgDataUri(backgroundMintSvg)
};
