/* WRECKMARCH Phase C.5 — character-driven presentation + crisp HD cards + visible road network */
import { installCharacterPresentationPhase } from './characters/character-runtime-presentation.js?v=2';
const WORLD_W=2200,WORLD_H=2200;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const CARD_IDS=['heavy-rivets','overclock','long-barrel','twin-riveter','fleet-feet','scrap-magnet','armor-plate','call-rig','rig-overdrive','twin-cannon'];
async function getScene(timeout=9000){const t=performance.now();while(performance.now()-t<timeout){const g=window.Phaser?.GAMES?.find(Boolean)||window.Phaser?.GAMES?.[0],s=g?.scene?.getScene?.('Wreckmarch');if(s?.sys?.isActive?.()&&s.hero&&s.weaponV3Gun&&s.upgradeLevels&&window.__WM_PHASE_C4__)return s;await wait(50)}throw Error('Phase C.5 scene timeout')}
async function loadAssets(s){
 const needSheet=!s.textures.exists('c5-upgrade-sheet');
 if(needSheet){
  await new Promise((resolve,reject)=>{let bad=false;const fail=f=>{if(bad)return;bad=true;reject(Error('C5 asset failed '+(f?.key||'')))},done=()=>{s.load.off('loaderror',fail);if(!bad)resolve()};s.load.once('loaderror',fail);s.load.once('complete',done);s.load.svg('c5-upgrade-sheet','./assets/ui/upgrade-art-v2.svg',{width:4800,height:320});s.load.start()});
 }
 const tex=s.textures.get('c5-upgrade-sheet');CARD_IDS.forEach((id,index)=>{const name=`c5-card-${id}`;if(!tex.has(name))tex.add(name,0,index*480,0,480,320)});
}
function selfTest(s){
 if(new URLSearchParams(location.search).get('autotest')!=='1')return;
 const presentation=s.__characterPresentationC5;
 const sheet=s.textures.get('c5-upgrade-sheet'),cards=CARD_IDS.every((id,i)=>sheet?.has(`c5-card-${id}`)&&sheet.get(`c5-card-${id}`).realWidth>=480);
 const roads=(s.__e0FastRoadSegments||[]).filter(o=>o?.active!==false),near=roads.some(im=>Phaser.Math.Distance.Between(im.x,im.y,WORLD_W/2,WORLD_H/2)<190);
 const checks={characterPresentation:presentation?.characterId===s.characterDefinition?.id&&presentation?.ok===true,...(presentation?.checks||{}),cardArtVectorHD:cards,roadNetwork:roads.length>200&&near,roadsVisible:roads.every(im=>im.visible&&im.alpha>.9&&im.displayHeight>=145),groundVisible:!!s.children.list.find(o=>o?.name==='e0-ground-base'&&o.visible&&o.__terrainSystemObject)};
 const ok=Object.values(checks).every(Boolean),detail=Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' ');
 window.__WM_C5_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchC5SelfTest=ok?'passed':'failed';window.__WM_LOG__?.(`C5 browser self-test ${ok?'PASSED':'FAILED'}: ${detail}`);if(!ok)throw Error('Phase C.5 self-test failed: '+detail)
}
export async function applyPhaseC5(){const s=await getScene();await loadAssets(s);await installCharacterPresentationPhase(s,'c5');window.__WM_PHASE_C5__=true;document.documentElement.dataset.wreckmarchPhaseC5='active';window.__WM_LOG__?.('Phase C.5 active: character-driven presentation + 2x vector upgrade art + visible road network');selfTest(s);return true}
