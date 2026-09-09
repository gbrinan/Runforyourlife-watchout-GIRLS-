export function playScream(ctx:AudioContext,destination:AudioNode):void {
  const now=ctx.currentTime;
  const voice=ctx.createOscillator();voice.type='sawtooth';voice.frequency.setValueAtTime(380,now);voice.frequency.exponentialRampToValueAtTime(920,now+.12);voice.frequency.exponentialRampToValueAtTime(190,now+.85);
  const tremor=ctx.createOscillator();tremor.frequency.value=31;
  const modulation=ctx.createGain();modulation.gain.value=55;tremor.connect(modulation).connect(voice.frequency);
  const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1700;filter.Q.value=.8;
  const gain=ctx.createGain();gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.065,now+.08);gain.gain.exponentialRampToValueAtTime(.001,now+.9);
  voice.connect(filter).connect(gain).connect(destination);voice.start();tremor.start();voice.stop(now+.95);tremor.stop(now+.95);
}
export function playGacha(ctx:AudioContext,destination:AudioNode,point:{readonly x:number;readonly z:number}):void {
  const panner=ctx.createPanner();panner.panningModel='HRTF';panner.refDistance=3;panner.positionX.value=point.x;panner.positionY.value=1.4;panner.positionZ.value=point.z;panner.connect(destination);
  for(const [i,frequency] of [523,659,784].entries()){
    const oscillator=ctx.createOscillator();oscillator.type='triangle';oscillator.frequency.value=frequency;
    const gain=ctx.createGain(),time=ctx.currentTime+i*.12;gain.gain.setValueAtTime(.001,time);gain.gain.linearRampToValueAtTime(.09,time+.02);gain.gain.exponentialRampToValueAtTime(.001,time+.25);
    oscillator.connect(gain).connect(panner);oscillator.start(time);oscillator.stop(time+.3);
    if(i===2)oscillator.onended=()=>panner.disconnect();
  }
}
