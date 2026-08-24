/* WRECKMARCH — first playable vertical slice */
const W = 540;
const H = 960;
const TAU = Math.PI * 2;

class WreckmarchScene extends Phaser.Scene {
  constructor() {
    super('Wreckmarch');
    this.runTime = 0;
    this.scrap = 0;
    this.level = 1;
    this.nextUpgrade = 14;
    this.fireDelay = 430;
    this.lastShot = 0;
    this.weaponLevel = 1;
    this.damage = 24;
    this.gameOver = false;
    this.upgrading = false;
    this.enemySerial = 0;
  }

  create() {
    this.createTextures();
    this.createWorld();
    this.createGroups();
    this.createFortress();
    this.createHero();
    this.createHUD();
    this.createJoystick();
    this.createAudio();
    this.cameras.main.setBackgroundColor('#171d26');
    this.physics.world.setBounds(24, 92, W - 48, H - 155);
    this.spawnEvent = this.time.addEvent({ delay: 680, loop: true, callback: () => this.spawnEnemy() });
    this.waveEvent = this.time.addEvent({ delay: 15000, loop: true, callback: () => this.advanceWave() });
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, undefined, this);
    this.physics.add.overlap(this.hero, this.scraps, this.collectScrap, undefined, this);
    this.physics.add.overlap(this.cartCore, this.enemies, this.enemyTouchesCart, undefined, this);
    this.physics.add.overlap(this.hero, this.enemies, this.enemyTouchesHero, undefined, this);
    this.input.once('pointerdown', () => this.unlockAudio());
    document.body.classList.add('ready');
  }

  createTextures() {
    const g = this.make.graphics({ add: false });
    g.clear();
    g.fillStyle(0x3b2d24).fillCircle(25,34,17);
    g.fillStyle(0xe0ae73).fillCircle(25,20,12);
    g.fillStyle(0x20242c).fillRoundedRect(11,31,28,28,8);
    g.fillStyle(0xc94f35).fillTriangle(8,27,27,35,7,43);
    g.fillStyle(0xe9e2d1).fillCircle(29,18,3);
    g.fillStyle(0x11151c).fillCircle(30,18,1.5);
    g.fillStyle(0xd6a15e).fillRoundedRect(9,54,12,8,3);
    g.fillRoundedRect(29,54,12,8,3);
    g.generateTexture('hero',50,66);

    g.clear();
    g.fillStyle(0x6f8544).fillEllipse(26,30,42,31);
    g.fillStyle(0x839b50).fillTriangle(8,20,14,2,22,20);
    g.fillTriangle(30,18,42,3,45,24);
    g.fillStyle(0xe9e2d1).fillCircle(35,24,4);
    g.fillStyle(0x171d26).fillCircle(36,24,2);
    g.fillStyle(0xc8563d).fillTriangle(44,31,55,35,44,39);
    g.lineStyle(4,0x3d4928,1).beginPath().moveTo(9,34).quadraticBezierTo(-8,28,3,15).strokePath();
    g.generateTexture('enemy',58,52);

    g.clear();
    g.fillStyle(0xffd469).fillCircle(10,10,7);
    g.fillStyle(0xffffff).fillCircle(8,8,3);
    g.generateTexture('bullet',20,20);

    g.clear();
    g.fillStyle(0xb98f5e).fillCircle(12,12,10);
    g.fillStyle(0xe8c68d).fillRect(9,4,6,16);
    g.fillRect(4,9,16,6);
    g.fillStyle(0x5d4a35).fillCircle(12,12,4);
    g.generateTexture('scrap',24,24);

    g.clear();
    g.fillStyle(0xffffff,1).fillCircle(32,32,30);
    g.generateTexture('core',64,64);

    g.clear();
    g.fillStyle(0x10151c).fillCircle(16,50,12).fillCircle(74,50,12);
    g.fillStyle(0x58616b).fillCircle(16,50,7).fillCircle(74,50,7);
    g.fillStyle(0x7b6548).fillRoundedRect(5,18,80,34,9);
    g.fillStyle(0x9c7c51).fillRoundedRect(14,10,58,27,7);
    g.lineStyle(3,0x3f3327,1).strokeRoundedRect(14,10,58,27,7);
    g.fillStyle(0xc55b38).fillTriangle(8,15,23,15,8,29);
    g.generateTexture('cart',90,66);

    g.clear();
    g.fillStyle(0x37404a).fillCircle(20,20,16);
    g.fillStyle(0x66717d).fillCircle(20,20,10);
    g.fillStyle(0x2a3038).fillRoundedRect(20,15,31,10,4);
    g.fillStyle(0xd79b4e).fillRect(45,16,8,8);
    g.generateTexture('turret',56,40);

    g.clear();
    g.fillStyle(0xffdc72).fillTriangle(0,8,24,0,18,9);
    g.fillStyle(0xff8c3d).fillTriangle(0,8,22,16,16,7);
    g.generateTexture('flash',24,16);
  }

  createWorld() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x252a31,0x252a31,0x171d26,0x171d26,1);
    bg.fillRect(0,0,W,H);
    const road = this.add.graphics();
    road.fillStyle(0x2b3037,1).fillRoundedRect(76,80,W-152,H-126,70);
    road.lineStyle(2,0x343a42,.8).strokeRoundedRect(76,80,W-152,H-126,70);
    for (let i=0;i<34;i++) {
      this.add.rectangle(Phaser.Math.Between(34,W-34),Phaser.Math.Between(100,H-50),Phaser.Math.Between(3,10),Phaser.Math.Between(2,5),Phaser.Math.RND.pick([0x5c5144,0x474c51,0x725d45]),Phaser.Math.FloatBetween(.18,.42)).setRotation(Phaser.Math.FloatBetween(0,TAU));
    }
    const top = this.add.graphics().setDepth(500);
    top.fillStyle(0x0b0e13,.82).fillRect(0,0,W,105);
  }

  createGroups() {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.scraps = this.physics.add.group();
  }

  createFortress() {
    this.cart = this.add.container(W/2,H*.64).setDepth(15);
    this.cart.add(this.add.image(0,0,'cart'));
    this.turrets = [];
    this.addTurret(-2,-20);
    this.cartCore = this.physics.add.image(this.cart.x,this.cart.y,'core').setVisible(false).setCircle(30).setImmovable(true);
    this.cartCore.body.setOffset(2,2);
    this.cartMaxHp = 220;
    this.cartHp = this.cartMaxHp;
  }

  addTurret(x,y) {
    const turret = this.add.image(x,y,'turret').setOrigin(.35,.5).setScale(.86);
    this.cart.add(turret);
    this.turrets.push(turret);
    this.weaponLevel = this.turrets.length;
    if (this.cameras?.main) this.cameras.main.flash(90,240,180,88,false);
    this.playTone?.(310,.045,'square',.025);
  }

  createHero() {
    this.hero = this.physics.add.sprite(W/2,H*.78,'hero').setDepth(22);
    this.hero.setCollideWorldBounds(true);
    this.hero.body.setCircle(18,7,23);
    this.heroHp = 100;
    this.heroMaxHp = 100;
    this.heroSpeed = 255;
    this.lastHeroHit = 0;
    this.move = new Phaser.Math.Vector2();
  }

  createHUD() {
    const small = { fontFamily:'Arial, sans-serif', fontSize:'18px', color:'#d7dde5', fontStyle:'bold' };
    this.titleText = this.add.text(28,20,'WRECKMARCH',{fontFamily:'Arial Black, Arial',fontSize:'23px',color:'#f2d19b'}).setDepth(700);
    this.timerText = this.add.text(W-28,23,'00:00',small).setOrigin(1,0).setDepth(700);
    this.hpBg = this.add.rectangle(28,58,W-56,13,0x0b0f14,.9).setOrigin(0,.5).setDepth(700);
    this.hpBar = this.add.rectangle(28,58,W-56,9,0xd26a45,1).setOrigin(0,.5).setDepth(701);
    this.add.text(28,74,'FORTRESS',{...small,fontSize:'12px',color:'#aeb7c2'}).setDepth(700);
    this.scrapText = this.add.text(W-28,74,'SCRAP  0 / 14',{...small,fontSize:'14px',color:'#e8c68d'}).setOrigin(1,0).setDepth(700);
    this.waveText = this.add.text(W/2,108,'WAVE 1',{...small,fontSize:'13px',color:'#8793a0'}).setOrigin(.5).setDepth(700);
    this.hint = this.add.text(W/2,H-28,'DRAG TO MOVE • AUTO FIRE',{...small,fontSize:'12px',color:'#77818d'}).setOrigin(.5,1).setDepth(700);
    this.time.delayedCall(5000,()=>this.tweens.add({targets:this.hint,alpha:0,duration:700}));
  }

  createJoystick() {
    this.joy={id:null,origin:new Phaser.Math.Vector2(),current:new Phaser.Math.Vector2(),radius:62,active:false};
    this.joyBase=this.add.circle(92,H-118,55,0x111820,.38).setStrokeStyle(2,0x9ba8b6,.18).setDepth(650);
    this.joyKnob=this.add.circle(92,H-118,24,0xe7c38d,.4).setDepth(651);
    this.input.on('pointerdown',p=>{
      if(this.gameOver||this.upgrading||p.y<H*.36)return;
      this.joy.id=p.id;this.joy.active=true;this.joy.origin.set(p.x,p.y);this.joy.current.set(p.x,p.y);
      this.joyBase.setPosition(p.x,p.y).setAlpha(.75);this.joyKnob.setPosition(p.x,p.y).setAlpha(.85);
    });
    this.input.on('pointermove',p=>{
      if(!this.joy.active||p.id!==this.joy.id)return;
      this.joy.current.set(p.x,p.y);
      const d=new Phaser.Math.Vector2(p.x-this.joy.origin.x,p.y-this.joy.origin.y);
      if(d.length()>this.joy.radius)d.setLength(this.joy.radius);
      this.joyKnob.setPosition(this.joy.origin.x+d.x,this.joy.origin.y+d.y);
    });
    const release=p=>{if(p.id!==this.joy.id)return;this.joy.active=false;this.joy.id=null;this.joyBase.setPosition(92,H-118).setAlpha(.38);this.joyKnob.setPosition(92,H-118).setAlpha(.4);};
    this.input.on('pointerup',release);this.input.on('pointerupoutside',release);
  }

  createAudio() {
    this.audioCtx=null;
    try { this.audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(this.audioCtx.state==='running')this.audioCtx.suspend(); } catch(_){}
  }
  unlockAudio(){if(this.audioCtx?.state==='suspended')this.audioCtx.resume();}
  playTone(freq,duration=.05,type='sine',volume=.03,slide=0){
    if(!this.audioCtx||this.audioCtx.state!=='running')return;
    const now=this.audioCtx.currentTime,osc=this.audioCtx.createOscillator(),gain=this.audioCtx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,now);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),now+duration);
    gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain).connect(this.audioCtx.destination);osc.start(now);osc.stop(now+duration);
  }

  advanceWave(){
    if(this.gameOver)return;
    const wave=Math.floor(this.runTime/15)+1;this.waveText.setText(`WAVE ${wave}`);this.spawnEvent.delay=Math.max(255,680-wave*82);
    this.showBanner(wave%2===0?'Horde incoming':'The road gets meaner');
    for(let i=0;i<Math.min(8,wave*2);i++)this.time.delayedCall(i*85,()=>this.spawnEnemy(true));
  }

  spawnEnemy(elite=false){
    if(this.gameOver||this.upgrading)return;
    const side=Phaser.Math.Between(0,3);let x,y;
    if(side===0){x=Phaser.Math.Between(20,W-20);y=105;} if(side===1){x=W-20;y=Phaser.Math.Between(130,H-180);} if(side===2){x=Phaser.Math.Between(20,W-20);y=H-165;} if(side===3){x=20;y=Phaser.Math.Between(130,H-180);}
    const e=this.enemies.create(x,y,'enemy').setDepth(12);e.name=`scraprat-${this.enemySerial++}`;e.setCircle(18,10,8);
    e.hp=elite?110+this.runTime*2.4:54+this.runTime*1.25;e.maxHp=e.hp;e.speed=elite?Phaser.Math.Between(66,84):Phaser.Math.Between(82,116);e.damage=elite?19:10;e.elite=elite;e.lastTouch=0;
    e.setScale(elite?1.32:Phaser.Math.FloatBetween(.9,1.06));if(elite)e.setTint(0xd08f55);
    this.tweens.add({targets:e,scaleX:e.scaleX*1.04,scaleY:e.scaleY*.95,yoyo:true,repeat:-1,duration:Phaser.Math.Between(190,270)});
  }

  update(time,delta){
    if(this.gameOver||this.upgrading)return;
    const dt=delta/1000;this.runTime+=dt;this.updateTimer();this.updateMovement();this.updateFortress(dt);this.updateEnemies(time);this.updateBullets(delta);this.updateScrapMagnet();this.autoFire(time);this.updateHUD();
  }

  updateMovement(){
    this.move.set(0,0);
    if(this.joy.active){this.move.set(this.joy.current.x-this.joy.origin.x,this.joy.current.y-this.joy.origin.y);if(this.move.length()>8)this.move.normalize();else this.move.set(0,0);}
    const kb=this.input.keyboard;if(kb){const c=kb.createCursorKeys();if(c.left.isDown)this.move.x-=1;if(c.right.isDown)this.move.x+=1;if(c.up.isDown)this.move.y-=1;if(c.down.isDown)this.move.y+=1;if(this.move.lengthSq()>1)this.move.normalize();}
    this.hero.setVelocity(this.move.x*this.heroSpeed,this.move.y*this.heroSpeed);
    this.hero.rotation=Phaser.Math.Linear(this.hero.rotation,this.move.lengthSq()>.05?this.move.x*.11:0,.16);this.hero.setFlipX(this.move.x<-.12);
    if(this.move.lengthSq()>.05)this.hero.y+=Math.sin(this.runTime*15)*.25;
  }

  updateFortress(dt){
    const desiredX=Phaser.Math.Clamp(this.hero.x-this.move.x*76,70,W-70),desiredY=Phaser.Math.Clamp(this.hero.y-this.move.y*76+12,135,H-190),follow=1-Math.pow(.001,dt);
    this.cart.x=Phaser.Math.Linear(this.cart.x,desiredX,follow*.28);this.cart.y=Phaser.Math.Linear(this.cart.y,desiredY,follow*.28);this.cart.rotation=Phaser.Math.Linear(this.cart.rotation,this.move.x*.035,.08);
    this.cartCore.setPosition(this.cart.x,this.cart.y);this.cartCore.body.updateFromGameObject();
    const target=this.findNearestEnemy(this.cart.x,this.cart.y,420);
    if(target){const angle=Phaser.Math.Angle.Between(this.cart.x,this.cart.y-18,target.x,target.y);this.turrets.forEach(t=>t.rotation=Phaser.Math.Angle.RotateTo(t.rotation,angle-this.cart.rotation,.14));}
  }

  updateEnemies(time){
    this.enemies.children.iterate(e=>{if(!e?.active)return;const dHero=Phaser.Math.Distance.Between(e.x,e.y,this.hero.x,this.hero.y),tx=dHero<90?this.hero.x:this.cart.x,ty=dHero<90?this.hero.y:this.cart.y,ang=Phaser.Math.Angle.Between(e.x,e.y,tx,ty);e.setVelocity(Math.cos(ang)*e.speed,Math.sin(ang)*e.speed);e.rotation=Phaser.Math.Linear(e.rotation,Math.sin(time*.01+e.x)*.06,.1);e.setFlipX(Math.cos(ang)<0);});
  }
  updateBullets(delta){this.bullets.children.iterate(b=>{if(!b?.active)return;b.life-=delta;if(b.life<=0||b.x<-30||b.x>W+30||b.y<80||b.y>H+30)b.destroy();});}
  updateScrapMagnet(){
    this.scraps.children.iterate(s=>{if(!s?.active)return;const d=Phaser.Math.Distance.Between(s.x,s.y,this.hero.x,this.hero.y);if(d<125){const strength=Phaser.Math.Clamp((132-d)/132,.08,1),ang=Phaser.Math.Angle.Between(s.x,s.y,this.hero.x,this.hero.y);s.setVelocity(Math.cos(ang)*(130+strength*330),Math.sin(ang)*(130+strength*330));}else{s.setVelocity(s.body.velocity.x*.9,s.body.velocity.y*.9);}s.rotation+=.045;});
  }

  autoFire(time){
    if(time<this.lastShot+this.fireDelay)return;const target=this.findNearestEnemy(this.cart.x,this.cart.y,420);if(!target)return;this.lastShot=time;
    const shots=Math.min(this.turrets.length,3);
    for(let i=0;i<shots;i++){const spread=(i-(shots-1)/2)*.09,ang=Phaser.Math.Angle.Between(this.cart.x,this.cart.y-18,target.x,target.y)+spread,sx=this.cart.x+Math.cos(ang)*37,sy=this.cart.y-18+Math.sin(ang)*37,b=this.bullets.create(sx,sy,'bullet').setDepth(18).setScale(.82);b.setCircle(7,3,3);b.damage=this.damage;b.life=1000;b.setVelocity(Math.cos(ang)*620,Math.sin(ang)*620);const flash=this.add.image(sx,sy,'flash').setDepth(19).setRotation(ang).setScale(.72);this.tweens.add({targets:flash,alpha:0,scale:.15,duration:75,onComplete:()=>flash.destroy()});}
    this.playTone(145,.045,'square',.022,-35);
  }

  findNearestEnemy(x,y,maxD=Infinity){let best=null,bestSq=maxD*maxD;this.enemies.children.iterate(e=>{if(!e?.active)return;const d=Phaser.Math.Distance.Squared(x,y,e.x,e.y);if(d<bestSq){best=e;bestSq=d;}});return best;}

  onBulletHit(bullet,enemy){
    if(!bullet.active||!enemy.active)return;const vx=bullet.body.velocity.x,vy=bullet.body.velocity.y;bullet.destroy();enemy.hp-=bullet.damage??this.damage;enemy.setTintFill(0xffffff);this.time.delayedCall(55,()=>enemy?.active&&enemy.clearTint());enemy.body.velocity.x+=vx*.05;enemy.body.velocity.y+=vy*.05;this.spawnHitFx(enemy.x,enemy.y,vx,vy);this.playTone(78,.025,'square',.013,35);if(enemy.hp<=0)this.killEnemy(enemy);
  }

  spawnHitFx(x,y,vx,vy){for(let i=0;i<3;i++){const p=this.add.circle(x,y,Phaser.Math.Between(2,4),0xf1c675,.9).setDepth(30),a=Math.atan2(vy,vx)+Math.PI+Phaser.Math.FloatBetween(-.8,.8),dist=Phaser.Math.Between(16,34);this.tweens.add({targets:p,x:x+Math.cos(a)*dist,y:y+Math.sin(a)*dist,alpha:0,scale:.2,duration:170,onComplete:()=>p.destroy()});}}

  killEnemy(enemy){
    const x=enemy.x,y=enemy.y,elite=enemy.elite;enemy.disableBody(true,true);this.cameras.main.shake(elite?90:40,elite?.0045:.0015);this.playTone(elite?52:64,elite?.11:.06,'sawtooth',.025,-18);
    const burst=this.add.circle(x,y,elite?28:18,0xd8954f,.55).setDepth(13);this.tweens.add({targets:burst,scale:2.4,alpha:0,duration:180,onComplete:()=>burst.destroy()});
    for(let i=0;i<(elite?3:1);i++){const s=this.scraps.create(x+Phaser.Math.Between(-12,12),y+Phaser.Math.Between(-12,12),'scrap').setDepth(10);s.setScale(elite?.95:.78);s.setCircle(10,2,2);s.setVelocity(Phaser.Math.Between(-90,90),Phaser.Math.Between(-90,90));s.setBounce(.4);}
  }

  collectScrap(hero,scrap){
    if(!scrap.active)return;scrap.disableBody(true,true);this.scrap+=1;this.playTone(620+Math.min(this.scrap%6,5)*55,.035,'sine',.018,80);this.tweens.add({targets:this.scrapText,scale:1.12,duration:70,yoyo:true});
    if(this.scrap>=this.nextUpgrade){this.level+=1;this.scrap-=this.nextUpgrade;this.nextUpgrade=Math.round(this.nextUpgrade*1.34+3);this.time.delayedCall(110,()=>this.showUpgrade());}
  }

  enemyTouchesCart(cart,enemy){
    const now=this.time.now;if(!enemy.active||now<(enemy.lastDamageToCart||0)+520)return;enemy.lastDamageToCart=now;this.cartHp-=enemy.damage;this.cart.setAlpha(.6);this.time.delayedCall(70,()=>this.cart?.setAlpha(1));this.cameras.main.shake(65,.0035);this.playTone(90,.06,'sawtooth',.025,-25);if(this.cartHp<=0)this.endRun('FORTRESS LOST');
  }
  enemyTouchesHero(hero,enemy){
    const now=this.time.now;if(!enemy.active||now<this.lastHeroHit+520)return;this.lastHeroHit=now;this.heroHp-=enemy.damage*.55;this.hero.setTintFill(0xffffff);this.time.delayedCall(80,()=>this.hero?.active&&this.hero.clearTint());this.cameras.main.shake(45,.0025);if(this.heroHp<=0)this.endRun('RUNNER DOWN');
  }

  showUpgrade(){
    if(this.upgrading||this.gameOver)return;this.upgrading=true;this.physics.pause();this.spawnEvent.paused=true;
    const shade=this.add.rectangle(W/2,H/2,W,H,0x090d12,.86).setDepth(1000),title=this.add.text(W/2,180,'FORTRESS UPGRADE',{fontFamily:'Arial Black, Arial',fontSize:'28px',color:'#f0cc91'}).setOrigin(.5).setDepth(1001),sub=this.add.text(W/2,220,'Choose what the scrap becomes',{fontFamily:'Arial',fontSize:'15px',color:'#9ca8b5'}).setOrigin(.5).setDepth(1001);
    const options=[
      {title:'TWIN CANNON',icon:'II',desc:'Bolt another gun onto the rig.',apply:()=>{const x=this.turrets.length%2?-24:24,y=-18-Math.floor(this.turrets.length/2)*8;this.addTurret(x,y);}},
      {title:'HOT CHAMBER',icon:'>>',desc:'Fire 22% faster. More noise. More scrap.',apply:()=>{this.fireDelay=Math.max(175,this.fireDelay*.78);}},
      {title:'HEAVY SLUGS',icon:'+',desc:'Shots hit 40% harder and kick deeper.',apply:()=>{this.damage*=1.4;}}
    ];
    const cards=[];
    options.forEach((opt,i)=>{const y=330+i*155,card=this.add.container(W/2,y).setDepth(1002),bg=this.add.rectangle(0,0,W-76,126,0x1c242d,.98).setStrokeStyle(2,0x6f7a86,.36),badge=this.add.circle(-178,0,31,0xb87945,1),icon=this.add.text(-178,-1,opt.icon,{fontFamily:'Arial Black',fontSize:'22px',color:'#171d26'}).setOrigin(.5),t=this.add.text(-128,-25,opt.title,{fontFamily:'Arial Black',fontSize:'19px',color:'#f2d19b'}).setOrigin(0,.5),d=this.add.text(-128,18,opt.desc,{fontFamily:'Arial',fontSize:'14px',color:'#aeb8c3',wordWrap:{width:280}}).setOrigin(0,.5);card.add([bg,badge,icon,t,d]);bg.setInteractive({useHandCursor:true});bg.on('pointerover',()=>card.setScale(1.025));bg.on('pointerout',()=>card.setScale(1));bg.on('pointerdown',()=>{opt.apply();this.playTone(240,.07,'square',.025,450);this.cameras.main.flash(160,226,174,96,false);[shade,title,sub,...cards].forEach(o=>o.destroy());this.physics.resume();this.spawnEvent.paused=false;this.upgrading=false;this.showBanner(opt.title);});cards.push(card);});
  }

  showBanner(text){const t=this.add.text(W/2,142,text.toUpperCase(),{fontFamily:'Arial Black',fontSize:'16px',color:'#f0cc91',backgroundColor:'#111820cc',padding:{x:16,y:8}}).setOrigin(.5).setDepth(850).setAlpha(0).setY(132);this.tweens.add({targets:t,alpha:1,y:142,duration:180,hold:800,yoyo:true,onComplete:()=>t.destroy()});}
  updateTimer(){const sec=Math.floor(this.runTime),m=String(Math.floor(sec/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');this.timerText.setText(`${m}:${s}`);}
  updateHUD(){const hp=Phaser.Math.Clamp(this.cartHp/this.cartMaxHp,0,1);this.hpBar.width=(W-56)*hp;this.scrapText.setText(`SCRAP  ${this.scrap} / ${this.nextUpgrade}`);}

  endRun(reason){
    if(this.gameOver)return;this.gameOver=true;this.physics.pause();this.spawnEvent.paused=true;this.cameras.main.shake(260,.008);this.playTone(90,.35,'sawtooth',.04,-55);
    this.add.rectangle(W/2,H/2,W,H,0x090d12,.88).setDepth(2000);this.add.text(W/2,H*.38,reason,{fontFamily:'Arial Black',fontSize:'32px',color:'#d56a49'}).setOrigin(.5).setDepth(2001);this.add.text(W/2,H*.45,`SURVIVED ${Math.floor(this.runTime)}s  •  FORTRESS LV.${this.level}`,{fontFamily:'Arial',fontSize:'16px',color:'#c0c8d1'}).setOrigin(.5).setDepth(2001);const btn=this.add.rectangle(W/2,H*.56,260,64,0xb97945,1).setDepth(2001).setInteractive({useHandCursor:true});this.add.text(W/2,H*.56,'RUN AGAIN',{fontFamily:'Arial Black',fontSize:'20px',color:'#171d26'}).setOrigin(.5).setDepth(2002);btn.on('pointerdown',()=>this.scene.restart());
  }
}

const config={type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#171d26',render:{antialias:true,pixelArt:false,roundPixels:false},physics:{default:'arcade',arcade:{debug:false,gravity:{x:0,y:0}}},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:W,height:H},input:{activePointers:3},scene:[WreckmarchScene]};
new Phaser.Game(config);
