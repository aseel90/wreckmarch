/* WRECKMARCH mobile polish — dedicated 4-frame Runner locomotion art */
const DEFS = `
<defs>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#aab2b5"/><stop offset=".48" stop-color="#596267"/><stop offset="1" stop-color="#2a3033"/></linearGradient>
  <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e1994f"/><stop offset=".5" stop-color="#925127"/><stop offset="1" stop-color="#5b2d18"/></linearGradient>
  <linearGradient id="leather" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9b7047"/><stop offset="1" stop-color="#523824"/></linearGradient>
  <radialGradient id="lens"><stop stop-color="#e3fdff"/><stop offset=".42" stop-color="#52ddeb"/><stop offset="1" stop-color="#167d91"/></radialGradient>
</defs>`;

function runnerSvg(stride) {
  const strideAbs = Math.abs(stride);
  const bob = strideAbs > .7 ? 2 : -1;
  const frontLeg = 15 * stride;
  const backLeg = -frontLeg;
  const arm = -12 * stride;
  const scarf = 4 + 5 * strideAbs;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 148">${DEFS}
  <ellipse cx="63" cy="140" rx="34" ry="6" fill="#000" opacity=".2"/>
  <g transform="translate(0 ${bob})" stroke="#241b18" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M44 54 C28 ${53-scarf} 17 ${56-scarf} 6 ${65-scarf} C21 ${67-scarf} 32 ${73-scarf} 47 68Z" fill="#ba4b2f"/>
    <path d="M45 61 C29 ${62+scarf/2} 17 ${72+scarf/2} 10 ${79+scarf/2} C27 78 37 79 50 71Z" fill="#8d3427"/>
    <g transform="translate(${backLeg*.48} 0)"><path d="M67 101L83 103 87 127 75 131 64 112Z" fill="#383630"/><path d="M72 124L91 124 97 136 72 140 64 133Z" fill="url(#leather)"/></g>
    <g transform="translate(${frontLeg*.48} 0)"><path d="M45 101L62 103 58 128 44 131 37 111Z" fill="#454139"/><path d="M41 125L61 126 66 137 39 140 32 133Z" fill="url(#leather)"/></g>
    <path d="M37 59Q43 51 55 50L78 51Q91 55 94 69L89 105Q68 112 42 105L33 72Z" fill="#8b6543"/>
    <path d="M49 61L79 61 83 99Q66 104 48 99Z" fill="#263038"/>
    <path d="M51 62L63 78 75 62" fill="none" stroke="#c0874b"/>
    <path d="M39 92H89" stroke="#2a211c" stroke-width="7"/><rect x="58" y="88" width="14" height="10" rx="2" fill="url(#copper)"/>
    <g transform="rotate(${arm/2} 35 70)"><path d="M38 61Q26 64 24 75L19 96 34 100 43 77Z" fill="#8a6543"/><path d="M19 91L35 92 36 102Q25 109 17 100Z" fill="#2b2e31"/><circle cx="26" cy="100" r="6" fill="#302823"/></g>
    <g transform="rotate(${-arm/2} 92 70)"><path d="M89 61Q101 64 103 75L109 96 94 100 86 77Z" fill="#7c5b3d"/><path d="M93 91L109 92 111 101Q102 108 92 101Z" fill="#2b2e31"/><circle cx="101" cy="100" r="6" fill="#302823"/></g>
    <path d="M82 58Q98 57 105 69L100 79 87 75 80 64Z" fill="url(#metal)"/><path d="M88 61L99 66 95 72" fill="none" stroke="#d07b3e" stroke-width="2"/><circle cx="96" cy="68" r="3" fill="#4fd9e8" stroke="none"/>
    <path d="M45 48Q64 42 83 49L88 63Q65 71 40 61Z" fill="#103d48"/><path d="M45 51Q64 47 82 52L83 58Q64 63 43 57Z" fill="#1d7483" stroke="none"/>
    <ellipse cx="64" cy="38" rx="24" ry="25" fill="#e1a773"/><ellipse cx="39" cy="40" rx="5" ry="8" fill="#d29463"/><ellipse cx="89" cy="40" rx="5" ry="8" fill="#d29463"/>
    <path d="M39 31C41 14 48 10 54 13L59 5 66 13 76 3 78 16 91 9 87 25 97 23 87 35Q62 19 39 31Z" fill="#3b281f"/><path d="M45 25L52 13 58 24 66 11 72 25 82 14 80 28" fill="none" stroke="#5a3522" stroke-width="5"/>
    <path d="M48 37L58 34M70 34L80 37"/><ellipse cx="54" cy="41" rx="4.5" ry="5" fill="#f7efe3" stroke="none"/><ellipse cx="75" cy="41" rx="4.5" ry="5" fill="#f7efe3" stroke="none"/><circle cx="55" cy="41" r="2.2" fill="#17191b" stroke="none"/><circle cx="74" cy="41" r="2.2" fill="#17191b" stroke="none"/>
    <path d="M42 48Q63 43 86 48L82 62Q64 69 45 61Z" fill="#123c47"/><path d="M48 51L60 57 64 52 68 57 79 51" fill="none" stroke="#287b89" stroke-width="2"/>
    <path d="M40 21Q64 15 88 21" fill="none" stroke="#5e3f2d" stroke-width="7"/><circle cx="51" cy="21" r="12" fill="#2e3436"/><circle cx="78" cy="21" r="12" fill="#2e3436"/><circle cx="51" cy="21" r="8.5" fill="url(#lens)" stroke="#9a6a40" stroke-width="2"/><circle cx="78" cy="21" r="8.5" fill="url(#lens)" stroke="#9a6a40" stroke-width="2"/><ellipse cx="48" cy="18" rx="3" ry="2" fill="#fff" opacity=".65" stroke="none"/><ellipse cx="75" cy="18" rx="3" ry="2" fill="#fff" opacity=".65" stroke="none"/>
    <path d="M99 86L105 112" stroke="#9da5a7" stroke-width="5"/><path d="M101 84Q108 79 111 85L106 91" fill="none" stroke="#9da5a7" stroke-width="5"/><circle cx="106" cy="115" r="5" fill="none" stroke="#9da5a7" stroke-width="4"/>
  </g></svg>`;
}

export function loadRunnerLocomotionArt(scene) {
  const frames = [-1, -.35, .35, 1];
  if (frames.every((_, index) => scene.textures.exists(`runner-run-${index}`))) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const urls = [];
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      urls.forEach(URL.revokeObjectURL);
      reject(new Error(`Runner locomotion asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      urls.forEach(URL.revokeObjectURL);
      if (!failed) resolve();
    });
    frames.forEach((stride, index) => {
      const url = URL.createObjectURL(new Blob([runnerSvg(stride)], { type: 'image/svg+xml' }));
      urls.push(url);
      scene.load.svg(`runner-run-${index}`, url);
    });
    scene.load.start();
  });
}
