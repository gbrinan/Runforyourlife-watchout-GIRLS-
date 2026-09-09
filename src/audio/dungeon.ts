export function createDungeonAudioBus(context:AudioContext):GainNode {
  const input=context.createGain();input.gain.value=.8;input.connect(context.destination);
  for(const [seconds,level] of [[.13,.2],[.29,.1]]) {
    const delay=context.createDelay(.5);delay.delayTime.value=seconds;
    const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;
    const gain=context.createGain();gain.gain.value=level;
    input.connect(delay).connect(filter).connect(gain).connect(context.destination);
  }
  return input;
}
