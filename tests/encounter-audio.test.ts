import {describe,expect,it} from 'vitest';
import {womanVoiceProfile} from '../src/audio/encounter';

describe('recognizable woman voices',()=>{
  it('gives every character a distinct adult vocal profile',()=>{
    const profiles=[0,1,2,3,4].map(womanVoiceProfile);
    expect(new Set(profiles.map(profile=>profile.pitch)).size).toBe(5);
    for(const profile of profiles)expect(profile.pitch).toBeGreaterThanOrEqual(145);
  });
});
