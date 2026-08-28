/* WRECKMARCH — Hunter production locomotion art (2 idle + 6 run frames) */
const DEFS = `
<defs>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9ba4a6"/><stop offset=".5" stop-color="#51595c"/><stop offset="1" stop-color="#272c2e"/></linearGradient>
  <linearGradient id="rust" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b56a3c"/><stop offset=".52" stop-color="#7b3f26"/><stop offset="1" stop-color="#442319"/></linearGradient>
  <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6a4632"/><stop offset="1" stop-color="#35271f"/></linearGradient>
  <radialGradient id="eye"><stop stop-color="#eaffff"/><stop offset=".38" stop-color="#62e8f1"/><stop offset="1" stop-color="#168999"/></radialGradient>
</defs>`;

function hunterSvg({ stride = 0, idle = 0 } = {}) {
  const strideAbs = Math.abs(stride);
  const bob = idle ? idle * 1.4 : (strideAbs > .75 ? 2 : strideAbs > .2 ? 0 : -1);
  const frontLeg = 15 * stride;
  const backLeg = -frontLeg;
  const arm = -9 * stride;
  const scarf = 5 + 5 * strideAbs;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 148">${DEFS}
  <ellipse cx="63" cy="140" rx="31" ry="6" fill="#000" opacity=".22"/>
  <g transform="translate(0 ${bob})" stroke="#211916" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M43 54 C27 ${51-scarf} 17 ${54-scarf} 7 ${62-scarf} C19 ${65-scarf} 30 ${70-scarf} 47 67Z" fill="#762f29"/>
    <path d="M45 62 C29 ${63+scarf/2} 18 ${72+scarf/2} 11 ${81+scarf/2} C26 79 37 79 50 71Z" fill="#51231f"/>
    <g transform="translate(${backLeg*.48} 0)"><path d="M67 99L83 102 87 127 75 132 64 111Z" fill="#313336"/><path d="M70 119L84 119 88 127 77 132 67 126Z" fill="url(#steel)"/><path d="M72 126L91 125 96 136 72 140 64 134Z" fill="#4b3427"/></g>
    <g transform="translate(${frontLeg*.48} 0)"><path d="M45 99L61 102 58 128 44 132 37 110Z" fill="#39393a"/><path d="M41 119L57 119 59 128 47 132 38 126Z" fill="url(#steel)"/><path d="M41 126L61 126 66 137 39 140 32 134Z" fill="#51382a"/></g>
    <path d="M36 59Q44 50 55 49L77 50Q90 54 94 68L89 103Q68 111 42 104L33 71Z" fill="url(#cloth)"/>
    <path d="M47 61L80 61 84 98Q65 104 46 98Z" fill="#24292b"/>
    <path d="M49 61L78 95M79 60L50 94" fill="none" stroke="#9a6842" stroke-width="4"/>
    <path d="M39 91H89" stroke="#211a17" stroke-width="7"/><rect x="57" y="87" width="15" height="11" rx="2" fill="url(#rust)"/>
    <g transform="rotate(${arm/2} 34 70)"><path d="M38 61Q26 64 23 76L19 96 34 101 43 76Z" fill="#594131"/><path d="M18 91L35 92 36 103Q25 109 17 100Z" fill="url(#steel)"/><circle cx="26" cy="100" r="6" fill="#302723"/></g>
    <g transform="rotate(${-arm/2} 93 70)"><path d="M89 61Q102 64 104 76L109 96 94 101 85 76Z" fill="#4f3a2e"/><path d="M93 91L110 92 111 102Q101 108 92 101Z" fill="url(#steel)"/><circle cx="101" cy="100" r="6" fill="#302723"/></g>
    <path d="M82 56Q99 56 106 68L100 80 87 75 79 63Z" fill="url(#steel)"/>
    <path d="M88 60L100 66 95 72" fill="none" stroke="#a65032" stroke-width="2"/>
    <circle cx="96" cy="67" r="3" fill="#b74734" stroke="none"/>
    <path d="M99 59L104 53M102 66L110 64M98 74L104 80" stroke="#8b9395" stroke-width="3"/>
    <path d="M42 50Q64 44 86 50L89 63Q65 71 39 61Z" fill="#6f2925"/>
    <path d="M45 54Q64 49 84 53L84 59Q64 65 43 58Z" fill="#8e3830" stroke="none"/>
    <path d="M38 38Q38 13 57 8Q76 4 91 24L91 47Q83 57 64 58Q46 57 37 47Z" fill="#59402f"/>
    <path d="M43 35Q45 17 60 13Q75 11 86 27L84 47Q73 52 63 52Q50 52 42 45Z" fill="#3a2c24"/>
    <path d="M42 27L48 16M80 17L86 31M59 11L61 19" stroke="#79543a" stroke-width="3" opacity=".8"/>
    <path d="M45 36Q63 29 82 36L84 51Q75 60 64 61Q52 60 43 51Z" fill="#252b2d"/>
    <path d="M56 43L64 38 73 43 72 53 64 57 56 53Z" fill="url(#steel)"/>
    <circle cx="50" cy="49" r="6" fill="#303638"/><circle cx="78" cy="49" r="6" fill="#303638"/>
    <circle cx="50" cy="49" r="3" fill="#141819"/><circle cx="78" cy="49" r="3" fill="#141819"/>
    <path d="M59 48H69M61 52H67" stroke="#191d1f" stroke-width="2"/>
    <path d="M46 32Q53 27 59 31L58 39Q51 42 46 38Z" fill="url(#eye)" stroke="#5f4935" stroke-width="2"/>
    <path d="M69 31Q76 27 82 32L81 38Q75 42 69 39Z" fill="url(#eye)" stroke="#5f4935" stroke-width="2"/>
    <circle cx="53" cy="34" r="1.6" fill="#fff" stroke="none" opacity=".75"/><circle cx="76" cy="34" r="1.6" fill="#fff" stroke="none" opacity=".75"/>
    <rect x="35" y="83" width="8" height="13" rx="2" fill="#654126"/><rect x="84" y="82" width="8" height="13" rx="2" fill="#654126"/>
  </g></svg>`;
}

export function loadRunnerLocomotionArt(scene) {
  const idleFrames = [0, 1];
  const runStrides = [-1, -.58, -.18, .18, .58, 1];
  const keys = [
    ...idleFrames.map(index => `hunter-idle-${index}`),
    ...runStrides.map((_, index) => `hunter-run-${index}`)
  ];
  if (keys.every(key => scene.textures.exists(key))) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const urls = [];
    let failed = false;
    const fail = file => {
      if (failed) return;
      failed = true;
      urls.forEach(URL.revokeObjectURL);
      reject(new Error(`Hunter locomotion asset failed: ${file?.key || 'unknown'}`));
    };
    scene.load.once('loaderror', fail);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', fail);
      urls.forEach(URL.revokeObjectURL);
      if (!failed) resolve();
    });
    idleFrames.forEach((idle, index) => {
      const url = URL.createObjectURL(new Blob([hunterSvg({ idle })], { type: 'image/svg+xml' }));
      urls.push(url);
      scene.load.svg(`hunter-idle-${index}`, url);
    });
    runStrides.forEach((stride, index) => {
      const url = URL.createObjectURL(new Blob([hunterSvg({ stride })], { type: 'image/svg+xml' }));
      urls.push(url);
      scene.load.svg(`hunter-run-${index}`, url);
    });
    scene.load.start();
  });
}
