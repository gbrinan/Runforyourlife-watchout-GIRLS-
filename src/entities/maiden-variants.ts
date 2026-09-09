import type { MaidenTuning } from './maiden';

export type MaidenLook = {
  readonly name: string;
  readonly hairStyle: 'short' | 'bob' | 'long';
  readonly build: 'slender' | 'curvy';
  readonly hair: number;
  readonly dress: number;
  readonly eyes: string;
  readonly description: string;
  readonly routine: 'mirror' | 'attendance' | 'locker' | 'gacha' | 'television';
  readonly observation: string;
  readonly pursuit: string;
  readonly faceScale: number;
  readonly combat: MaidenTuning;
  readonly threat: string;
};
const standard: MaidenTuning={chaseSpeed:2.4,lungeTime:.8,grabReach:1.6,attackCooldown:2,stunTime:2,heelCadence:1};
export const MAIDEN_LOOKS: readonly MaidenLook[] = [
  {name:'세라',hairStyle:'bob',build:'curvy',hair:0xd981ad,dress:0x493550,eyes:'#925c8c',description:'핑크 단발 · 글래머',routine:'mirror',observation:'세라가 깨진 거울에 립스틱을 긋는다. 몸은 거울을 향한 채 목만 당신 쪽으로 꺾인다.',pursuit:'나 예뻐? 왜 대답 안 해?',faceScale:1,combat:standard,threat:'보통 · 균형형 추격'},
  {name:'유나',hairStyle:'long',build:'slender',hair:0x242233,dress:0x343246,eyes:'#67578e',description:'흑발 장발 · 슬렌더',routine:'attendance',observation:'유나가 빈 교실의 출석을 부른다. 마지막 이름은 당신의 이름이다.',pursuit:'결석하면 안 돼. 돌아와.',faceScale:.86,combat:{chaseSpeed:2.9,lungeTime:.7,grabReach:1.65,attackCooldown:1.7,stunTime:1.55,heelCadence:.9},threat:'빠름 · 끈질긴 출석 추격'},
  {name:'린',hairStyle:'short',build:'slender',hair:0xc5d5df,dress:0x2b4a50,eyes:'#487e91',description:'은발 숏컷 · 슬렌더',routine:'locker',observation:'린이 사물함에 쪽지를 넣는다. 받는 사람 칸에는 유니콘이라고 적혀 있다.',pursuit:'쪽지 읽었지? 이제 같이 가자.',faceScale:1,combat:{chaseSpeed:2.15,lungeTime:.9,grabReach:1.5,attackCooldown:2.2,stunTime:2.4,heelCadence:1.1},threat:'느림 · 빈틈이 큰 수색형'},
  {name:'로제',hairStyle:'long',build:'curvy',hair:0xec98b9,dress:0x643e50,eyes:'#965474',description:'핑크 장발 · 글래머',routine:'gacha',observation:'로제가 빈 가챠 캡슐을 귀에 대고 웃는다. 안에서는 발굽 소리가 난다.',pursuit:'마지막 상품은 네 뿔이야.',faceScale:.9,combat:{chaseSpeed:3.2,lungeTime:.65,grabReach:1.75,attackCooldown:1.5,stunTime:1.2,heelCadence:.8},threat:'매우 빠름 · 넓은 잡기 범위'},
];
export const STALKER_LOOK: MaidenLook={name:'이브',hairStyle:'long',build:'slender',hair:0xe8ded5,dress:0x712b3e,eyes:'#be324e',description:'백금 장발 · 집착녀',routine:'television',observation:'이브가 TV 속 말 영상을 본다. 몸은 화면을 향한 채 목만 당신 쪽으로 꺾인다.',pursuit:'영상보다 가까이서 보고 싶었어.',faceScale:.84,combat:{chaseSpeed:3.5,lungeTime:.6,grabReach:1.8,attackCooldown:1.4,stunTime:.45,heelCadence:.72},threat:'최고 속도 · 봉인진에서만 제압'};
