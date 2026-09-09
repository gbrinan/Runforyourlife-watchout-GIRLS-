import type {Device} from '../systems/devices';
import type { Survival } from '../systems/survival';
import type { Gait } from '../entities/unicorn';
import type { Material } from '../gen/material';
import type {ThreatSide} from '../systems/hunt';
const gaitNames={walk:'서행',trot:'속보',canter:'구보',gallop:'질주'};
const materialNames={grass:'풀밭',dirt:'돌바닥',gravel:'자갈',shallow_water:'여울',deep_water:'깊은 물'};
export function createHud(seed:string) {
  const stats=document.querySelector('#stats');
  const stamina=document.querySelector('meter');
  const subtitle=document.querySelector('#subtitle');
  const overlay=document.querySelector<HTMLElement>('#overlay');
  const title=document.querySelector('#overlay-title');
  const description=document.querySelector('#overlay-description');
  const button=document.querySelector<HTMLButtonElement>('#start');
  const seedLabel=document.querySelector('#seed');
  if(seedLabel)seedLabel.textContent=`시드 ${seed}`;
  let messageTime=0;
  return {
    button,
    exploration(time:number,count:number,device:Device|undefined,rear:{readonly strength:number;readonly side:ThreatSide}){
      const spawn=document.querySelector('#spawn-status'),interaction=document.querySelector('#interaction');
      if(spawn)spawn.textContent=time<25?'탐색 시간 '+Math.ceil(25-time)+'초 · 기척 0 / 3':'지하실의 기척 '+count+' / 3';
      if(interaction)interaction.textContent=!device?'R · 장치 가까이에서 상호작용':device.kind==='switch'?'R · 방 조명 '+(device.lit?'끄기':'켜기'):device.activeUntil>time?'가챠 유인 중 · '+Math.ceil(device.activeUntil-time)+'초':device.readyAt>time?'가챠 충전 중 · '+Math.ceil(device.readyAt-time)+'초':'R · 소리 가챠 작동 (12초 유인)';
      document.body.style.setProperty('--rear-threat',String(Math.min(.8,rear.strength)));
      document.body.style.setProperty('--rear-x',rear.side==='left'?'32%':rear.side==='right'?'68%':'50%');
      const warning=document.querySelector('#rear-warning');if(warning)warning.textContent=`${rear.side==='left'?'왼쪽 뒤':rear.side==='right'?'오른쪽 뒤':'바로 뒤'} · 하이힐 소리가 가까워진다`;
      document.body.classList.toggle('rear-chase',rear.strength>0);
    },
    stalkerStatus(sealed:boolean,awake:boolean,vulnerable:boolean,present=true,observed=false){
      const status=document.querySelector('#stalker-status');
      if(status)status.textContent=sealed?'이브 봉인 완료':!present?(observed?'이브 · TV 속 말을 보고 있음':'지하실 · 누군가 생활한 흔적'):!awake?'이브 · 당신을 아직 보지 못함':vulnerable?'봉인 가능! 이브를 향해 F':'이브 추격 중 · 봉인진으로 유인하세요';
      document.body.classList.toggle('stalker-awake',awake&&!sealed);
    },
    sensitivity:()=>Number(document.querySelector<HTMLInputElement>('#sensitivity')?.value ?? 1)*.002,
    bobEnabled:()=>document.querySelector<HTMLInputElement>('#camera-bob')?.checked ?? false,
    show(heading:string,copy:string,label:string) {
      if(overlay)overlay.hidden=false;
      if(title)title.textContent=heading;
      if(description)description.textContent=copy;
      if(button){button.textContent=label;button.focus();}
    },
    hide(){if(overlay)overlay.hidden=true;},
    say(message:string,duration=3){if(subtitle)subtitle.textContent=message;messageTime=duration;},
    update(state:Survival, status:{gait:Gait;material:Material;noise:number;speed:number},dt:number) {
      if(stamina)stamina.value=state.stamina;
      if(stats)stats.textContent=`${gaitNames[status.gait]} · ${status.speed.toFixed(1)} m/s · ${materialNames[status.material]} · ${status.noise===0?'무음':`소음 ${status.noise} m`}`;
      document.body.classList.toggle('hurt',state.invulnerable>1.5);
      document.body.classList.toggle('tail-lost',state.lostParts.has('tail'));
      document.body.classList.toggle('mane-lost',state.lostParts.has('mane'));
      messageTime-=dt;
      if(messageTime<=0&&subtitle)subtitle.textContent=state.exhausted?'숨이 찹니다. Shift를 놓고 숨을 고르세요.':'돌바닥은 작은 발굽 소리도 멀리 퍼뜨립니다.';
    },
  };
}
