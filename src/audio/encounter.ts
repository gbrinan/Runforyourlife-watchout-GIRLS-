import {playScream} from './scream';
import { playHeelClick } from './heels';
import { playNoiseBurst } from './synth';
import { heelInterval } from '../entities/maiden';
import type { Maiden } from '../entities/maiden';
import type { Heightmap } from '../gen/heightmap';
import { sampleHeight } from '../gen/heightmap';

export function playVoice(ctx:AudioContext, adult:boolean,destination:AudioNode=ctx.destination):void {
  const now=ctx.currentTime;
  const oscillator=ctx.createOscillator(); oscillator.type='sawtooth';
  oscillator.frequency.setValueAtTime(300,now);
  oscillator.frequency.exponentialRampToValueAtTime(adult?120:330,now+.08);
  oscillator.frequency.exponentialRampToValueAtTime(adult?110:260,now+.55);
  const gain=ctx.createGain(); gain.gain.setValueAtTime(.001,now);
  gain.gain.linearRampToValueAtTime(.12,now+.04);
  gain.gain.exponentialRampToValueAtTime(.001,now+.65);
  gain.connect(destination);
  for(const frequency of adult?[600,1000,2400]:[800,1400,2800]) {
    const formant=ctx.createBiquadFilter();formant.type='bandpass';
    formant.frequency.value=frequency;formant.Q.value=5;
    oscillator.connect(formant).connect(gain);
  }
  oscillator.start();oscillator.stop(now+.7);
  if(adult) playNoiseBurst(ctx,destination,{duration:.35,bandpassFreq:600,gain:.08});
}
export function createEncounterAudio(ctx:AudioContext, map:Heightmap,destination:AudioNode=ctx.destination,onScream:()=>void=()=>{}) {
  const channels=new Map<Maiden,{panner:PannerNode;remaining:number;scream:number}>();
  return (maidens:readonly Maiden[], player:{readonly x:number;readonly z:number;readonly yaw:number},dt:number)=> {
    const listener=ctx.listener;
    listener.positionX.value=player.x;listener.positionY.value=sampleHeight(map,player.x,player.z)+1.6;listener.positionZ.value=player.z;
    listener.forwardX.value=Math.sin(player.yaw);listener.forwardY.value=0;listener.forwardZ.value=Math.cos(player.yaw);
    listener.upX.value=0;listener.upY.value=1;listener.upZ.value=0;
    for(const maiden of maidens) {
      let channel=channels.get(maiden);
      if(!channel) {
        const panner=ctx.createPanner();panner.panningModel='HRTF';panner.refDistance=6;panner.rolloffFactor=.7;
        panner.connect(destination);channel={panner,remaining:0,scream:.75};channels.set(maiden,channel);
      }
      channel.panner.positionX.value=maiden.x;
      channel.panner.positionY.value=sampleHeight(map,maiden.x,maiden.z)+.1;
      channel.panner.positionZ.value=maiden.z;
      channel.remaining-=dt;channel.scream-=dt;
      if((maiden.mode==='chase'||maiden.mode==='attack')&&channel.scream<=0&&Math.hypot(maiden.x-player.x,maiden.z-player.z)<30){playScream(ctx,channel.panner);channel.scream=4;onScream();}
      if(channel.remaining<=0) {
        const interval=heelInterval(maiden.mode);
        if(Number.isFinite(interval)&&Math.hypot(maiden.x-player.x,maiden.z-player.z)<65) playHeelClick(ctx,channel.panner);
        channel.remaining=Number.isFinite(interval)?interval:.1;
      }
    }
  };
}
