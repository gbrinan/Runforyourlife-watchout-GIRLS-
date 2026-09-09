import * as THREE from 'three';
import { createRng, seedFromUrl } from './core/rng';
import { sampleHeight } from './gen/heightmap';
import { createDungeonLayout, isDungeonBlocked } from './gen/dungeon';
import { Material } from './gen/material';
import { createDungeonScene } from './render/dungeon';
import { createEncounter } from './render/encounter';
import { createInitialUnicornState } from './entities/unicorn';
import { ramInDungeon } from './systems/dungeon-combat';
import { createSurvival, updateSurvival, hurt } from './systems/survival';
import { hoofNoiseRadius } from './systems/noise';
import { getHoofbeatsInInterval, computeBobOffsetMeters } from './audio/hooves';
import { playHoofbeat } from './audio/synth';
import { createEncounterAudio, playVoice } from './audio/encounter';
import { createTracks, recordTrack, expireTracks } from './systems/tracks';
import { createDungeonAudioBus } from './audio/dungeon';
import { readMovement, readTurn } from './systems/controls';
import { sealPositions, ramStalker, insideSeal } from './systems/stalker';
import { createStalkerScene } from './render/stalker';
import { createCastGallery } from './ui/cast';
import {createHunt,rearThreat} from './systems/hunt';
import {createDevices,nearestDevice,activateDevice,lureFor,visionRange,deviceTarget} from './systems/devices';
import {createDeviceScene} from './render/devices';
import {playGacha} from './audio/scream';
import {crossedExit} from './systems/exit';
import {createExitScene} from './render/exit';
import { createHud } from './ui/hud';
import {createJump,startJump,stepJump} from './systems/jump';
import {createPuzzle,clueText,exitSealed} from './systems/puzzle';
import {createPuzzleScene} from './render/puzzle';
import {createCandyMountain} from './render/candy-mountain';
import {SCHOOL} from './render/school-palette';

const seed=seedFromUrl();
const layout=createDungeonLayout(seed);
const map={size:layout.size,data:new Float32Array(layout.size*layout.size)};
const materialAt=()=>Material.Dirt;
const scene=new THREE.Scene(); scene.background=new THREE.Color(SCHOOL.fog);
scene.fog=new THREE.FogExp2(SCHOOL.fog,.035);
const camera=new THREE.PerspectiveCamera(85,innerWidth/innerHeight,.1,1000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
document.querySelector('#app')?.appendChild(renderer.domElement);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const dungeon=createDungeonScene(layout,seed);scene.add(dungeon.group);
const encounter=createEncounter(map,layout.spawns.slice(0,2),Math.floor(createRng(seed+':looks')()*4));scene.add(encounter.group);
const seals=sealPositions(layout);
const hunt=createHunt(layout,encounter.maidens),stalker=hunt.stalker;
const devices=createDevices(layout),deviceScene=createDeviceScene(devices);scene.add(deviceScene.group);
for(const device of devices)if(device.kind==='switch'&&device.room===0)device.lit=true;
scene.add(createExitScene(layout.exit));
const puzzle=createPuzzle(layout,seed),puzzleScene=createPuzzleScene(puzzle,layout.exit);scene.add(puzzleScene.group);
const jump=createJump();let ending:ReturnType<typeof createCandyMountain>|undefined;
let deviceBeat=0,cleared=false;
const stalkerScene=createStalkerScene(seals);scene.add(stalkerScene.group);
const cast=createCastGallery();
const player={...layout.start,yaw:Math.atan2(dungeon.focal.x-layout.start.x,dungeon.focal.z-layout.start.z)};
let pitch=-.12;camera.rotation.order='YXZ';
let gait=createInitialUnicornState();
const survival=createSurvival();
const tracks=createTracks();let gameTime=0;
const hud=createHud(seed);
hud.say('서울, 은목여고 지하실. 소환은 성공했고, 학생들은 사라졌다.');
const keys=new Set<string>();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let running=false, pendingTurn=0, elapsed=0, noise=0, noiseTime=0, actionTime=0;
let audio:AudioContext|undefined;
let audioBus:GainNode|undefined;
let spatial:ReturnType<typeof createEncounterAudio>|undefined;
const canvas=renderer.domElement;
function emit(radius:number) {
  noise=radius;noiseTime=.6;hunt.noise(player,radius);
}
function voice(adult:boolean) {if(audio&&audioBus)playVoice(audio,adult,audioBus);}
function damage() {
  if(!hurt(survival))return;
  emit(20);voice(true);
  hud.say(survival.hp===2?'꼬리가 뜯겼다. 달려!':'갈기가 뜯겼다. 오래 달릴 수 없다.');
  if(survival.hp===0) {
    running=false;keys.clear();gait={...gait,currentSpeed:0};document.exitPointerLock();
    hud.show('붙잡혔다.','지하실에 또각 소리만 남았습니다. 어둠 속에서 다시 깨어나세요.','다시 깨어나기');
  }
}
function pause() {
  if(!running)return;
  running=false;keys.clear();gait={...gait,currentSpeed:0};pendingTurn=0;
  document.exitPointerLock();
  if(audio)void audio.suspend();
  hud.show('잠깐 숨 고르기','지하실도 함께 멈춰 있습니다. 준비되면 다시 달리세요.','계속하기');
}
function start() {
  if(survival.hp===0||cleared){location.href=location.pathname;return;}
  if(!audio){audio=new AudioContext();audioBus=createDungeonAudioBus(audio);spatial=createEncounterAudio(audio,map,audioBus,()=>hud.say('여인의 괴성이 복도를 울린다.'));}
  void audio.resume();running=true;hud.hide();
  Promise.resolve().then(()=>canvas.requestPointerLock()).catch((error:unknown)=>{
    if(error instanceof DOMException){hud.say('마우스를 움직여 둘러보세요. 화면 끝에서는 ← → 키도 쓸 수 있습니다.');return;}
    throw error;
  });
}
hud.button?.addEventListener('click',start);
document.querySelector('#new-map')?.addEventListener('click',()=>{location.href=location.pathname;});
canvas.addEventListener('click',()=>{if(!running)start();});
document.addEventListener('mousemove',event=>{
  if(running&&(document.pointerLockElement===canvas||event.target===canvas)){
    const sensitivity=hud.sensitivity();
    pendingTurn-=event.movementX*sensitivity;
    pitch=Math.max(-1.15,Math.min(1.15,pitch-event.movementY*sensitivity));
  }
});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)pause();});
window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function attack() {
  if(!running||actionTime>0)return;
  emit(25);actionTime=.5;hud.say('뿔을 내질렀다.');
  const special=hunt.present[2]?ramStalker(stalker,layout,player,seals):'miss';
  if(special==='sealed'){hud.say('이브를 봉인했다. 이제 더는 따라오지 않는다.');return;}
  if(special==='repelled'){hud.say('잠깐 멈췄을 뿐이다! 청록색 봉인진으로 유인하세요.');return;}
  for(const maiden of hunt.active().filter(m=>m!==stalker.body)){
    const result=ramInDungeon(layout,maiden,player);
    switch(result){
      case 'miss':break;
      case 'pushed':hud.say('밀어냈다. 지금 도망쳐!');return;
      case 'caught':damage();return;
      default:throw new TypeError('Unknown ram outcome');
    }
  }
}
canvas.addEventListener('mousedown',event=>{if(event.button===0&&document.pointerLockElement===canvas)attack();});
window.addEventListener('keydown',event=>{
  if(cast.isOpen())return;
  if(event.code==='Escape'){pause();return;}
  if(event.code==='Enter'&&!running&&!event.repeat){
    if(event.target instanceof HTMLInputElement||event.target instanceof HTMLButtonElement)return;
    event.preventDefault();start();return;
  }
  if(!running)return;
  if(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyQ','KeyH','KeyF','KeyR','ControlLeft','ControlRight','ShiftLeft','ShiftRight','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(event.code))event.preventDefault();
  keys.add(event.code);
  if(event.repeat)return;
  if(event.code==='KeyF')attack();
  if(event.code==='Space'&&startJump(jump))hud.say('뛰어올랐다. 착지 소리를 조심하세요.');
  if(event.code==='KeyR'){
    const result=puzzleScene.interact(player);
    if(result){
      hud.say(result==='clue'?clueText(puzzle):result==='wrong'?'틀렸다. 종소리를 듣고 그녀들이 다가온다.':result==='solved'?'세 종의 봉인이 풀렸다. EXIT로 도망쳐!':`종이 응답했다. ${puzzle.progress} / 3`);
      if(result!=='clue'){
        emit(result==='wrong'?60:18);
        if(audio&&audioBus){const tone=audio.createOscillator(),gain=audio.createGain();tone.type='sine';tone.frequency.setValueAtTime(result==='wrong'?73:220+puzzle.progress*110,audio.currentTime);gain.gain.setValueAtTime(.12,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+1.4);tone.connect(gain);gain.connect(audioBus);tone.start();tone.stop(audio.currentTime+1.4);tone.onended=()=>{tone.disconnect();gain.disconnect();};}
      }
      return;
    }
    const device=nearestDevice(devices,player);
    if(device){const result=activateDevice(device,gameTime);hud.say(result==='gacha'?'가챠가 12초 동안 소리로 유인합니다. 지금 자리를 벗어나세요.':result==='cooldown'?'가챠가 충전 중입니다.':result==='light-on'?'방 조명을 켰다.':'방 조명을 껐다. 일반 적의 시야가 짧아졌다.');}
  }
  if(event.code==='KeyH'&&actionTime<=0){emit(60);voice(survival.hp===1);hud.say('히힝! 소리가 멀리 퍼졌다.');actionTime=1;}
});
window.addEventListener('keyup',event=>keys.delete(event.code));
function tick(dt:number) {
  const previousPosition={x:player.x,z:player.z};
  gameTime+=dt;expireTracks(tracks,gameTime);
  if(stepJump(jump,dt)){emit(18);if(audio&&audioBus)playHoofbeat(audio,audioBus,Material.Dirt);hud.say('착지 소리가 복도에 울렸다.');}
  player.yaw+=pendingTurn+(readTurn(keys)+(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*2.2;pendingTurn=0;
  pitch=Math.max(-1.15,Math.min(1.15,pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt));
  const movement=readMovement(keys,player.yaw,survival.exhausted);
  if(gait.gait!==movement.gait)elapsed=0;
  gait={...gait,gait:movement.gait,currentSpeed:movement.speed};
  let moved=false;
  if(movement.speed>0) {
    const next={x:player.x+movement.x*dt,z:player.z+movement.z*dt};
    if(exitSealed(layout.exit,next,puzzle.solved)){next.x=player.x;next.z=player.z;hud.say('세 종의 봉인이 출구를 막고 있다.');}
    if(isDungeonBlocked(layout,next)) {
      if(!isDungeonBlocked(layout,{x:next.x,z:player.z}))next.z=player.z;
      else if(!isDungeonBlocked(layout,{x:player.x,z:next.z}))next.x=player.x;
    }
    if(!isDungeonBlocked(layout,next)) {
      moved=Math.hypot(next.x-player.x,next.z-player.z)>.00001;
      player.x=next.x;player.z=next.z;
    }
    if(moved&&jump.height===0) {
      const beats=getHoofbeatsInInterval(gait.gait,elapsed,elapsed+dt);elapsed+=dt;
      const material=materialAt();
      for(const beat of beats){
        void beat;emit(hoofNoiseRadius(gait.gait,material));
        recordTrack(tracks,{point:player,material,time:gameTime});
        if(audio&&audioBus&&hoofNoiseRadius(gait.gait,material)>0)playHoofbeat(audio,audioBus,material);
      }
    }
  }else{gait={...gait,currentSpeed:0};elapsed=0;}
  if(!moved)gait={...gait,currentSpeed:0};
  if(puzzle.solved&&crossedExit(layout.exit,previousPosition,player)){
    cleared=true;running=false;keys.clear();gait={...gait,currentSpeed:0};pendingTurn=0;
    document.exitPointerLock();if(audio)void audio.suspend();
    ending=createCandyMountain();document.body.classList.add('ending');
    document.querySelector('#app')?.setAttribute('aria-label','무지개빛 캔디마운틴 엔딩');
    hud.show('캔디마운틴',`탈출 성공 · ${Math.floor(gameTime/60)}분 ${Math.floor(gameTime%60)}초. 무지개 너머에서, 다시 그녀의 웃음이 들리는 것 같다.`,'새 던전 시작');
    return;
  }
  if(updateSurvival(survival,{gait:gait.gait,moving:moved},dt)) {voice(true);emit(20);hud.say('허억… 낮고 거친 숨이 새어 나왔다.');}
  const outcome=hunt.update(gameTime,dt,player,tracks,p=>lureFor(devices,p,gameTime),visionRange(layout,devices,player));
  if(outcome.spawned)hud.say('또각! 바로 뒤에서 누군가 나타났다. 달려!');
  if(outcome.hits>0)damage();
  deviceBeat-=dt;
  if(deviceBeat<=0){deviceBeat=1;for(const device of devices)if(device.kind==='gacha'&&device.activeUntil>gameTime){hunt.noise(deviceTarget(device),40);if(audio&&audioBus)playGacha(audio,audioBus,device.point);}}
  if(spatial)spatial(hunt.active(),player,dt);
  actionTime=Math.max(0,actionTime-dt);noiseTime-=dt;
  if(noiseTime<=0)noise=0;
}
let previous=performance.now();
function frame(now:number) {
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-previous)/1000);previous=now;
  if(running)tick(dt);
  if(ending){ending.camera.aspect=innerWidth/innerHeight;ending.camera.position.z=20/Math.min(1,ending.camera.aspect);ending.camera.lookAt(0,10,-23);ending.camera.updateProjectionMatrix();renderer.render(ending.scene,ending.camera);return;}
  const bob=reducedMotion||!hud.bobEnabled()?0:computeBobOffsetMeters(gait.gait,elapsed)*(survival.stamina<=30?1.5:1);
  camera.position.set(player.x,sampleHeight(map,player.x,player.z)+1.6+bob+jump.height,player.z);
  camera.rotation.set(pitch,player.yaw+Math.PI,0);
  dungeon.playerLight.position.set(player.x,1.9,player.z);
  encounter.draw(tracks,gameTime,hunt.present);stalkerScene.draw(stalker,gameTime,hunt.present[2]);deviceScene.draw(gameTime);
  for(const device of devices)if(device.kind==='switch')dungeon.lights[device.room].visible=device.lit;
  hud.stalkerStatus(stalker.sealed,stalker.awakened,insideSeal(stalker.body,seals),hunt.present[2]);
  hud.exploration(gameTime,hunt.active().length,nearestDevice(devices,player),rearThreat(layout,player,hunt.active()));
  puzzleScene.update(player,running?dt:0);
  hud.update(survival,{gait:gait.gait,material:materialAt(),noise,speed:gait.currentSpeed},running?dt:0);
  renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
requestAnimationFrame(frame);
