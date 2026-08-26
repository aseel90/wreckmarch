/* WRECKMARCH final runtime hotfix — restart integrity + uniform cards + robot hound */
const HOUND_ICON_KEY='wm-robot-hound-icon-v2';

function fitImage(image,maxW,maxH){
  const w=image.frame?.realWidth||image.width||1,h=image.frame?.realHeight||image.height||1;
  const scale=Math.min(maxW/w,maxH/h);
  image.setDisplaySize(w*scale,h*scale);
  return image;
}

function ensureHoundIcon(scene){
  if(scene.textures.exists(HOUND_ICON_KEY))return HOUND_ICON_KEY;
  const g=scene.make.graphics({add:false});
  g.fillStyle(0x05080a,.42).fillEllipse(96,108,138,24);
  g.lineStyle(5,0x74858d,1).fillStyle(0x303a40,1).fillRoundedRect(45,40,88,46,10).strokeRoundedRect(45,40,88,46,10);
  g.lineStyle(3,0xd4ad62,.9).fillStyle(0x46545a,1).fillRoundedRect(56,47,58,27,6).strokeRoundedRect(56,47,58,27,6);
  g.lineStyle(3,0x93a3aa,1).fillStyle(0x38464c,1).fillRoundedRect(126,45,40,33,7).strokeRoundedRect(126,45,40,33,7);
  g.fillStyle(0x202b30,1).fillRoundedRect(158,54,18,14,4);
  g.lineStyle(2,0xb7f8ff,.95).fillStyle(0x63e4ef,1).fillCircle(148,55,5).strokeCircle(148,55,6);
  g.fillStyle(0x596970,1).fillTriangle(132,45,139,29,146,45).fillTriangle(147,45,155,28,161,47);
  g.lineStyle(3,0x1c2428,.95);
  [[58,78,50,108],[82,80,78,112],[121,80,116,112],[145,77,151,108]].forEach(([x1,y1,x2,y2])=>{
    g.beginPath().moveTo(x1,y1).lineTo(x2,y2).strokePath();
    g.lineStyle(3,0xd4ad62,.72).strokeCircle(x2,y2-10,4);
    g.lineStyle(3,0x1c2428,.95);
    g.fillStyle(0x20292e,1).fillRoundedRect(x2-11,y2-3,22,7,3);
  });
  g.lineStyle(5,0x4b5960,1).beginPath().moveTo(45,56).lineTo(26,43).lineTo(18,31).strokePath();
  g.lineStyle(3,0xd4ad62,.8).fillStyle(0x222b30,1).fillRoundedRect(84,26,38,12,4).strokeRoundedRect(84,26,38,12,4);
  g.fillStyle(0x55d6e3,1).fillCircle(74,58,7);
  g.generateTexture(HOUND_ICON_KEY,192,128);g.destroy();
  return HOUND_ICON_KEY;
}

function rebuildRobotHound(scene){
  if(!scene.cart)return false;
  const wasVisible=scene.cart.visible,wasActive=scene.cart.active;
  [...(scene.cart.list||[])].forEach(part=>part?.destroy?.());
  scene.cart.setDepth(20).setAlpha(1).setRotation(0);
  const sh=scene.add.ellipse(0,37,142,31,0x05070a,.52);
  const tail=scene.add.rectangle(-57,-8,36,7,0x4b5960,1).setStrokeStyle(2,0x1c2428,.9).setOrigin(1,.5).setRotation(-.48);
  const tailTip=scene.add.rectangle(-85,-25,15,9,0x252f34,1).setStrokeStyle(2,0xd4ad62,.55).setRotation(-.48);
  const body=scene.add.rectangle(-5,-5,104,49,0x303a40,1).setStrokeStyle(4,0x73838a,1);
  const armor=scene.add.rectangle(-11,-10,68,29,0x46545a,1).setStrokeStyle(2,0xd4ad62,.82);
  const core=scene.add.circle(-13,-8,9,0x162126,1).setStrokeStyle(3,0x55d6e3,1);
  const spine=scene.add.rectangle(-5,-28,72,8,0x20292e,1).setStrokeStyle(2,0x596970,.85);
  const head=scene.add.rectangle(51,-10,43,34,0x38464c,1).setStrokeStyle(3,0x93a3aa,1);
  const muzzle=scene.add.rectangle(75,-7,17,14,0x202b30,1).setStrokeStyle(2,0xd4ad62,.9);
  const eye=scene.add.circle(59,-15,5,0x63e4ef,1).setStrokeStyle(2,0xb7f8ff,.9);
  const earA=scene.add.triangle(39,-31,0,13,8,0,17,13,0x596970,1).setStrokeStyle(2,0x20272b,.9);
  const earB=scene.add.triangle(57,-32,0,13,8,0,17,13,0x4c5c63,1).setStrokeStyle(2,0x20272b,.9);
  const gaitParts=[];
  [[-38,5,-1,.15],[27,5,-1,Math.PI+.15],[-38,19,1,Math.PI],[27,19,1,0]].forEach(([x,y,lane,phase])=>{
    const kneeX=x+(x<0?-5:5);
    const upper=scene.add.rectangle(x,y,12,34,0x4a575d,1).setStrokeStyle(2,0x1c2428,.95).setOrigin(.5,.12);
    const joint=scene.add.circle(kneeX,y+31,7,0x202a2f,1).setStrokeStyle(2,0xd4ad62,.68);
    const lower=scene.add.rectangle(kneeX,y+35,10,28,0x2f3a3f,1).setStrokeStyle(2,0xd4ad62,.62).setOrigin(.5,.12);
    const foot=scene.add.rectangle(kneeX+(x<0?-5:5),y+62,23,9,0x171e22,1).setStrokeStyle(2,0x74858d,.9);
    [upper,lower,foot].forEach(part=>{part.__dogLane=lane;part.__dogPhase=phase;gaitParts.push(part)});
    scene.cart.add([upper,joint,lower,foot]);
  });
  const atlas=scene.textures.get('c3-atlas');
  const turret=atlas?.has?.('rig_turret.png')?scene.add.image(-4,-39,'c3-atlas','rig_turret.png').setDisplaySize(62,53).setOrigin(.5,.58):scene.add.rectangle(-4,-39,58,22,0x323c42,1).setStrokeStyle(3,0xd4ad62,.8);
  scene.cart.add([sh,tail,tailTip,body,armor,core,spine,head,muzzle,eye,earA,earB,turret]);
  scene.cartShadow=sh;scene.cartWheels=gaitParts;scene.cartBody=body;scene.turrets=[turret];
  scene.__c3Turret=turret;scene.__c3RigArmor=armor;scene.__c3RigHead=head;scene.__c3RigEye=eye;scene.__c3RigTail=tail;
  scene.__c3RigBaseBodyY=-5;scene.__c3RigBaseTurretY=-39;scene.__rigVisualType='robot-dog';scene.__rigVisualVersion='hound-v2';
  scene.cart.setVisible(wasVisible).setActive(wasActive);
  if(scene.rigSystem?.summon&&!scene.rigSystem.__houndSummonPatched){
    const summon=scene.rigSystem.summon.bind(scene.rigSystem);
    scene.rigSystem.summon=function(){const ok=summon();if(ok)scene.cart.setDepth(20).setScale(1);return ok};
    scene.rigSystem.__houndSummonPatched=true;
  }
  return true;
}

function patchUpgradeCards(scene){
  const up=scene.game.scene.getScene('UpgradeSceneV4');
  if(!up||up.__finalCardHotfix)return false;
  ensureHoundIcon(scene);
  const baseCard=up.card;
  up.card=function(x,y,w,h,u,i){
    const display=u?.id==='call-rig'?{...u,title:'ROBOT HOUND',desc:'Summon the armed robot hound companion.'}:u;
    baseCard.call(this,x,y,w,h,display,i);
    const card=this.cards?.[this.cards.length-1];
    if(!card)return;
    card.id=u?.id;
    if(u?.id==='call-rig'&&card.art){
      card.art.setTexture(HOUND_ICON_KEY);
      fitImage(card.art,Math.min(132,w*.48),Math.min(108,h*.31));
    }
  };
  const baseRefresh=up.refresh;
  up.refresh=function(){baseRefresh.call(this);this.cards?.forEach(card=>card.g?.setScale?.(1));};
  up.__finalCardHotfix=true;
  scene.__finalUniformUpgradeCards=true;
  return true;
}

function patchRunAgain(scene){
  if(scene.__finalRunAgainHotfix)return true;
  const prior=scene.endRun.bind(scene);
  scene.restartRun=()=>{
    if(scene.__runRestarting)return;
    scene.__runRestarting=true;
    document.documentElement.dataset.wreckmarchRunRestart='reloading';
    window.location.reload();
  };
  scene.endRun=function(reason){
    prior(reason);
    const layout=window.__WM_END_RUN_LAYOUT__;
    const btn=layout?.btn;
    if(btn){
      btn.off?.('pointerdown');
      btn.on?.('pointerdown',()=>this.restartRun());
      layout.buttonLabel?.setText?.('RUN AGAIN');
    }
  };
  scene.__finalRunAgainHotfix=true;
  return true;
}

export function applyFinalHotfix(scene){
  const hound=rebuildRobotHound(scene),cards=patchUpgradeCards(scene),restart=patchRunAgain(scene);
  window.__WM_FINAL_HOTFIX__={hound,cards,restart,version:'run-card-hound-v1'};
  document.documentElement.dataset.wreckmarchFinalHotfix='run-card-hound-v1';
  window.__WM_LOG__?.('Final hotfix active: full Run Again reload + equal card scale + robot hound visual/icon');
  if(new URLSearchParams(location.search).get('autotest')==='1'){
    const checks={hound:hound&&scene.__rigVisualType==='robot-dog'&&scene.__rigVisualVersion==='hound-v2'&&scene.cart?.depth>=20&&scene.cartWheels?.length>=12,icon:scene.textures.exists(HOUND_ICON_KEY),cards:cards&&scene.__finalUniformUpgradeCards===true,restart:restart&&typeof scene.restartRun==='function'};
    const ok=Object.values(checks).every(Boolean);
    window.__WM_FINAL_HOTFIX_TEST__={ok,...checks};
    document.documentElement.dataset.wreckmarchFinalHotfixTest=ok?'passed':'failed';
    if(!ok)throw Error('Final hotfix self-test failed: '+JSON.stringify(checks));
  }
  return true;
}
