export const CANDY_THEME_BPM = 132;
export const CANDY_THEME_NOTES = [
  72, 76, 79, 84, 81, 79, 76, 74,
  72, 76, 79, 84, 83, 79, 76, 71,
  69, 72, 76, 81, 79, 76, 72, 69,
  68, 71, 74, 77, 76, 72, 71, 68,
] as const;
const BASS_ROOTS = [48, 53, 55, 52, 45, 53, 50, 52] as const;

export function candyThemeDuration(): number {
  return CANDY_THEME_NOTES.length * 30 / CANDY_THEME_BPM;
}

function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function addTone(
  output: Float32Array,
  sampleRate: number,
  start: number,
  duration: number,
  hz: number,
  gain: number,
  timbre: 'toy' | 'bell' | 'bass',
): void {
  const first = Math.floor(start * sampleRate);
  const count = Math.min(output.length - first, Math.floor(duration * sampleRate));
  for (let index = 0; index < count; index += 1) {
    const time = index / sampleRate;
    const attack = Math.min(1, time / .012);
    const release = Math.min(1, Math.max(0, (duration - time) / (timbre === 'bass' ? .12 : .06)));
    const envelope = attack * release * (timbre === 'bell' ? Math.exp(-time * 4.2) : 1);
    const phase = Math.PI * 2 * hz * time;
    const wave = timbre === 'bass'
      ? Math.sin(phase) + Math.sin(phase * .5) * .22
      : timbre === 'bell'
        ? Math.sin(phase) + Math.sin(phase * 2.01) * .35 + Math.sin(phase * 3.98) * .18
        : Math.sin(phase) + Math.sin(phase * 2) * .28 + Math.sin(phase * 3) * .12;
    output[first + index] += wave * envelope * gain;
  }
}

export function renderCandyMountainTheme(sampleRate: number): Float32Array<ArrayBuffer> {
  const duration = candyThemeDuration();
  const step = 30 / CANDY_THEME_BPM;
  const output: Float32Array<ArrayBuffer> = new Float32Array(Math.floor(duration * sampleRate));
  CANDY_THEME_NOTES.forEach((note, index) => {
    const start = index * step;
    addTone(output, sampleRate, start, step * .86, frequency(note), .18, 'toy');
    if (index % 2 === 0) addTone(output, sampleRate, start, step * .5, frequency(note + 12), .055, 'bell');
    if (index % 4 === 0) {
      const root = BASS_ROOTS[index / 4];
      addTone(output, sampleRate, start, step * 3.7, frequency(root), .12, 'bass');
      addTone(output, sampleRate, start, step * 3.7, frequency(root + 7), .035, 'bass');
    }
  });
  let peak = 0;
  for (const sample of output) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > .82 ? .82 / peak : 1;
  const edge = Math.max(1, Math.floor(sampleRate * .04));
  for (let index = 0; index < output.length; index += 1) {
    const fade = Math.min(1, index / edge, (output.length - 1 - index) / edge);
    output[index] *= scale * Math.max(0, fade);
  }
  return output;
}

export function playCandyMountainSong(context: AudioContext, destination: AudioNode = context.destination) {
  const samples = renderCandyMountainTheme(context.sampleRate);
  const buffer = context.createBuffer(1, samples.length, context.sampleRate);
  buffer.copyToChannel(samples, 0);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const volume = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  filter.type = 'lowpass';
  filter.frequency.value = 3600;
  volume.gain.setValueAtTime(.001, context.currentTime);
  volume.gain.exponentialRampToValueAtTime(.24, context.currentTime + .8);
  source.connect(filter).connect(volume).connect(destination);
  source.start();
  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      const now = context.currentTime;
      volume.gain.cancelScheduledValues(now);
      volume.gain.setValueAtTime(Math.max(.001, volume.gain.value), now);
      volume.gain.exponentialRampToValueAtTime(.001, now + .35);
      source.stop(now + .36);
    },
  };
}
