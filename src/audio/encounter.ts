import {playScream} from './scream';
import { playHeelClick } from './heels';
import { playNoiseBurst } from './synth';
import { heelInterval } from '../entities/maiden';
import type { Maiden } from '../entities/maiden';
import type { Heightmap } from '../gen/heightmap';
import { sampleHeight } from '../gen/heightmap';

export function playVoice(ctx:AudioContext, low:boolean,destination:AudioNode=ctx.destination):void {
  const now=ctx.currentTime;
  const oscillator=ctx.createOscillator(); oscillator.type='sawtooth';
  oscillator.frequency.setValueAtTime(300,now);
  oscillator.frequency.exponentialRampToValueAtTime(low?120:330,now+.08);
  oscillator.frequency.exponentialRampToValueAtTime(low?110:260,now+.55);
  const gain=ctx.createGain(); gain.gain.setValueAtTime(.001,now);
  gain.gain.linearRampToValueAtTime(.12,now+.04);
  gain.gain.exponentialRampToValueAtTime(.001,now+.65);
  gain.connect(destination);
  for(const frequency of low?[600,1000,2400]:[800,1400,2800]) {
    const formant=ctx.createBiquadFilter();formant.type='bandpass';
    formant.frequency.value=frequency;formant.Q.value=5;
    oscillator.connect(formant).connect(gain);
  }
  oscillator.start();oscillator.stop(now+.7);
  if(low) playNoiseBurst(ctx,destination,{duration:.35,bandpassFreq:600,gain:.08});
}
const WOMAN_VOICE_PROFILES=[
  {pitch:190,formants:[720,1180,2520]},
  {pitch:165,formants:[650,1050,2350]},
  {pitch:215,formants:[780,1320,2680]},
  {pitch:180,formants:[690,1240,2460]},
  {pitch:145,formants:[590,980,2210]},
] as const;
export function womanVoiceProfile(index:number):{readonly pitch:number;readonly formants:readonly number[]} {
  return WOMAN_VOICE_PROFILES[Math.abs(Math.trunc(index))%WOMAN_VOICE_PROFILES.length];
}
export function playWomanVoice(ctx:AudioContext,index:number,destination:AudioNode=ctx.destination):void {
  const profile=womanVoiceProfile(index),now=ctx.currentTime,oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='triangle';
  oscillator.frequency.setValueAtTime(profile.pitch*1.08,now);oscillator.frequency.exponentialRampToValueAtTime(profile.pitch,now+.55);
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.085,now+.05);gain.gain.exponentialRampToValueAtTime(.001,now+.7);gain.connect(destination);
  for(const frequency of profile.formants){const formant=ctx.createBiquadFilter();formant.type='bandpass';formant.frequency.value=frequency;formant.Q.value=6;oscillator.connect(formant).connect(gain);}
  oscillator.start();oscillator.stop(now+.72);
}
export function createEncounterAudio(ctx:AudioContext,map:Heightmap,destination:AudioNode=ctx.destination,onScream:()=>void=()=>{},voiceIndex:(maiden:Maiden)=>number=()=>0) {
  const channels=new Map<Maiden,{panner:PannerNode;remaining:number;scream:number;mode:Maiden['mode']}>();
  return (maidens:readonly Maiden[], player:{readonly x:number;readonly z:number;readonly yaw:number},dt:number)=> {
    const listener=ctx.listener;
    listener.positionX.value=player.x;listener.positionY.value=sampleHeight(map,player.x,player.z)+1.6;listener.positionZ.value=player.z;
    listener.forwardX.value=Math.sin(player.yaw);listener.forwardY.value=0;listener.forwardZ.value=Math.cos(player.yaw);
    listener.upX.value=0;listener.upY.value=1;listener.upZ.value=0;
    for(const maiden of maidens) {
      let channel=channels.get(maiden);
      if(!channel) {
        const panner=ctx.createPanner();panner.panningModel='HRTF';panner.refDistance=6;panner.rolloffFactor=.7;
        panner.connect(destination);channel={panner,remaining:0,scream:.75,mode:maiden.mode};channels.set(maiden,channel);
      }
      channel.panner.positionX.value=maiden.x;
      channel.panner.positionY.value=sampleHeight(map,maiden.x,maiden.z)+.1;
      channel.panner.positionZ.value=maiden.z;
      if(channel.mode!==maiden.mode){channel.mode=maiden.mode;channel.remaining=0;}
      channel.remaining-=dt;channel.scream-=dt;
      if(maiden.mode==='notice'&&channel.remaining<=0){playHeelClick(ctx,channel.panner);playWomanVoice(ctx,voiceIndex(maiden),channel.panner);channel.remaining=Infinity;}
      if((maiden.mode==='chase'||maiden.mode==='attack')&&channel.scream<=0&&Math.hypot(maiden.x-player.x,maiden.z-player.z)<30){playScream(ctx,channel.panner);channel.scream=4;onScream();}
      if(channel.remaining<=0) {
        const interval=heelInterval(maiden.mode);
        if(Number.isFinite(interval)&&Math.hypot(maiden.x-player.x,maiden.z-player.z)<65) playHeelClick(ctx,channel.panner);
        channel.remaining=Number.isFinite(interval)?interval:.1;
      }
    }
  };
}
