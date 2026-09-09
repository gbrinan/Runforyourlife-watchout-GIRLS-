export type MaidenLook = {
  readonly name: string;
  readonly hairStyle: 'short' | 'bob' | 'long';
  readonly build: 'slender' | 'curvy';
  readonly hair: number;
  readonly dress: number;
  readonly eyes: string;
  readonly description: string;
};
export const MAIDEN_LOOKS: readonly MaidenLook[] = [
  {name:'세라',hairStyle:'bob',build:'curvy',hair:0xd981ad,dress:0x493550,eyes:'#925c8c',description:'핑크 단발 · 글래머'},
  {name:'유나',hairStyle:'long',build:'slender',hair:0x242233,dress:0x343246,eyes:'#67578e',description:'흑발 장발 · 슬렌더'},
  {name:'린',hairStyle:'short',build:'slender',hair:0xc5d5df,dress:0x2b4a50,eyes:'#487e91',description:'은발 숏컷 · 슬렌더'},
  {name:'로제',hairStyle:'long',build:'curvy',hair:0xec98b9,dress:0x643e50,eyes:'#965474',description:'핑크 장발 · 글래머'},
];
export const STALKER_LOOK: MaidenLook={name:'이브',hairStyle:'long',build:'slender',hair:0xe8ded5,dress:0x712b3e,eyes:'#be324e',description:'백금 장발 · 집착녀'};
