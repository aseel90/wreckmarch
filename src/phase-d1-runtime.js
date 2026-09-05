/* WRECKMARCH Phase D.1 — character-driven production presentation + premium PNG cards + real roads + vehicle scale */
import { installCharacterPresentationPhase } from './characters/character-runtime-presentation.js?v=3&wrecker=2';
import { installUpgradeCardPresentation } from './upgrades/upgrade-card-presentation.js?v=3';
// Live Pages keeps this direct dependency sentinel while U5 presentation ownership migrates out of D1.
import './upgrades/upgrade-card-art.js?v=7';
const WORLD_W=2200,WORLD_H=2200;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const CARD_IDS=['heavy-rivets','overclock','long-barrel','twin-riveter','fleet-feet','scrap-magnet','armor-plate','call-rig','rig-overdrive','twin-cannon'];
const CARD_FRAME=id=>`icon_${id}.png`;
const WRECK_FRAMES={sedan:'wreck_a.png',overturned:'wreck_c.png',van:'wreck_b.png',truck:'wreck_d.png'};
const VEHICLE_PROFILE={sedan:{w:246,h:166},overturned:{w:270,h:240},van:{w:292,h:214},truck:{w:356,h:302}};

async function getScene(timeout=10000){const t=performance.now();while(performance.now()-t<timeout){const g=window.Phaser?.GAMES?.find(Boolean)||window.Phaser?.GAMES?.[0],s=g?.scene?.getScene?.('Wreckmarch');if(s?.sys?.isActive?.()&&s.hero&&s.weaponV3Gun&&s.textures?.exists?.('c3-atlas')&&s.textures?.exists?.('c4-road')&&window.__WM_PHASE_C5__)return s;await wait(50)}throw Error('Phase D.1 scene timeout')}
function fit(im,w,h){const fw=im.frame?.realWidth||im.width||1,fh=im.frame?.realHeight||im.height||1,z=Math.min(w/fw,h/fh);im.setDisplaySize(fw*z,fh*z);return im}
function hideLegacyWrecks(s){for(const o of s.children.list){const f=String(o?.frame?.name||'');if(['b1-wreck-a','b1-wreck-b'].includes(o?.texture?.key)||f.startsWith('wreck_'))o.setVisible(false)}}
function addWreck(s,kind,x,y,rot,flip){const frame=WRECK_FRAMES[kind],p=VEHICLE_PROFILE[kind],im=s.add.image(x,y,'c3-atlas',frame).setDepth(3).setRotation(rot).setFlipX(flip).setAlpha(.98).setName(`d1-wreck-${kind}`);fit(im,p.w,p.h);const sh=s.add.ellipse(x,y+p.h*.22,p.w*.76,p.h*.22,0,0.25).setDepth(2).setRotation(rot);im.__vehicleKind=kind;s.__d1Wrecks.push(im,sh);return im}
function installVehicleScale(s){
  hideLegacyWrecks(s);s.__d1Wrecks?.forEach?.(o=>o?.destroy?.());s.__d1Wrecks=[];
  const P=[['sedan',450,780,-.12,false],['truck',1720,720,.10,true],['overturned',700,1460,.18,false],['van',1580,1510,-.12,false],['sedan',1880,1180,.21,true],['van',330,1270,.08,true],['truck',1320,390,-.07,false],['overturned',1960,1880,-.18,true]];
  P.forEach(v=>addWreck(s,...v));s.vehicleScaleProfile=VEHICLE_PROFILE;s.__d1VehicleScale=true;
}

function selfTest(s){if(new URLSearchParams(location.search).get('autotest')!=='1')return;
  const presentation=s.__characterPresentationD1,allHdCards=CARD_IDS.every(id=>s.textures.get('c3-atlas')?.has?.(CARD_FRAME(id))),rarities=new Set(s.__d1RarityStyles||[]),roads=(s.__e0FastRoadSegments||[]).filter(o=>o?.active!==false),near=roads.some(o=>Phaser.Math.Distance.Between(o.x,o.y,WORLD_W/2,WORLD_H/2)<180),truck=s.__d1Wrecks?.find(o=>o.__vehicleKind==='truck'),sedan=s.__d1Wrecks?.find(o=>o.__vehicleKind==='sedan');
  const probe=s.add.image(-9999,-9999,'c3-atlas',CARD_FRAME('overclock'));fit(probe,112,96);
  const checks={characterPresentation:presentation?.characterId===s.characterDefinition?.id&&presentation?.ok===true,...(presentation?.checks||{}),premiumCards:allHdCards&&probe.texture?.key==='c3-atlas'&&probe.displayWidth>=80&&s.textures.exists('upgrade-icon-piercing-rivets')&&s.textures.exists('upgrade-icon-ricochet')&&s.textures.exists('upgrade-icon-shrapnel-impact')&&s.textures.exists('upgrade-icon-critical-rivet')&&s.textures.exists('upgrade-icon-explosive-rivet')&&s.textures.exists('upgrade-icon-triple-riveter')&&s.__upgradeCardArtReady===true,cardPresentation:s.__upgradeCardPresentationVersion==='u5-before-after-v3'&&Array.isArray(s.__upgradeCardVisualHierarchy)&&s.__upgradeCardVisualHierarchy.join('>')==='ART>NAME>RARITY>LEVEL>PREVIEW>DESCRIPTION',cardPreview:s.__upgradeCardPreviewVersion==='u5-before-after-v1',rarityCards:['COMMON','RARE','EPIC','LEGENDARY'].every(r=>rarities.has(r)),roadsVisible:roads.length>200&&near&&roads.every(o=>o.visible&&o.alpha>.95&&o.displayHeight>=145&&o.__terrainSystemObject),vehicleScale:!!truck&&!!sedan&&truck.displayWidth>=330&&sedan.displayWidth>=225&&truck.displayWidth>sedan.displayWidth};probe.destroy();
  const ok=Object.values(checks).every(Boolean),detail=Object.entries(checks).map(([k,v])=>`${k}=${v?'ok':'FAIL'}`).join(' ');window.__WM_D1_SELF_TEST__={ok,...checks};document.documentElement.dataset.wreckmarchD1SelfTest=ok?'passed':'failed';window.__WM_LOG__?.(`D1 browser self-test ${ok?'PASSED':'FAILED'}: ${detail}`);if(!ok)throw Error('Phase D.1 self-test failed: '+detail)
}

export async function applyPhaseD1(){const s=await getScene();await installCharacterPresentationPhase(s,'d1');installVehicleScale(s);installUpgradeCardPresentation(s);window.__WM_PHASE_D1__=true;document.documentElement.dataset.wreckmarchPhaseD1='active';window.__WM_LOG__?.('Phase D.1 active: character-driven production presentation + dynamic canonical rarity cards + visible asphalt + real vehicle scale');selfTest(s);return true}
