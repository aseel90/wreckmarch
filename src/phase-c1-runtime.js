import { createRegisteredStatUpgradeChoice, createRegisteredUpgradeChoice } from './upgrades/upgrade-runtime.js?v=9';
import { rollUpgradeChoices } from './upgrades/upgrade-roll-service.js?v=2';

/* WRECKMARCH — Phase C.1: landscape HUD + 8-way two-hand aim + dedicated UpgradeScene */

const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function getScene(){for(let i=0;i<80;i++){const s=window.__WM_GAME__?.scene?.getScene?.('Wreckmarch');if(s?.hero)return s;await wait(100)}throw Error('Phase C1 scene unavailable')}

function c1UpgradePool(scene) {
  return [
    createRegisteredStatUpgradeChoice(scene, 'heavy-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'overclock', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'long-barrel', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'piercing-rivets', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'ricochet', { category: 'HERO' }),
    createRegisteredUpgradeChoice(scene, 'twin-riveter', { category: 'HERO' }),
    createRegisteredStatUpgradeChoice(scene, 'fleet-feet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'scrap-magnet', { category: 'UTILITY' }),
    createRegisteredStatUpgradeChoice(scene, 'armor-plate', { category: 'UTILITY' }),
    createRegisteredUpgradeChoice(scene, 'call-rig', { category: 'FORTRESS' })
  ].filter(Boolean);
}

export async function applyPhaseC1(){const s=await getScene();s.__c1UpgradePool=()=>c1UpgradePool(s);window.__WM_PHASE_C1__=true;return true}
