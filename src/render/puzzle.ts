import * as THREE from 'three';
import {BELL_NAMES,clueText,puzzleTarget,ringBell} from '../systems/puzzle';
import type {Puzzle} from '../systems/puzzle';
import type {Point} from '../entities/maiden';
import type {Exit} from '../gen/furnishings';

function plaque(lines:readonly string[],width:number,height:number):THREE.Mesh{
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=384;
  const ctx=canvas.getContext('2d');
  if(ctx){ctx.fillStyle='#11191c';ctx.fillRect(0,0,768,384);ctx.strokeStyle='#fa718c';ctx.lineWidth=10;ctx.strokeRect(8,8,752,368);ctx.fillStyle='#fff7ee';ctx.textAlign='center';ctx.font='bold 48px sans-serif';lines.forEach((line,i)=>ctx.fillText(line,384,80+i*76));}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
}
export function createPuzzleScene(puzzle:Puzzle,exit:Exit){
  const group=new THREE.Group(),bells:THREE.Group[]=[],marks:THREE.MeshStandardMaterial[]=[];
  const iron=new THREE.MeshStandardMaterial({color:0x272b2b,metalness:.75,roughness:.5});
  for(const bell of puzzle.bells){
    const node=new THREE.Group();node.position.set(bell.point.x,0,bell.point.z);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.38,.46,.16,12),iron);base.position.y=.08;node.add(base);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.9,8),iron);stem.position.y=.55;node.add(stem);
    const mat=new THREE.MeshStandardMaterial({color:0x9c7653,metalness:.6,roughness:.4,emissive:0x611523,emissiveIntensity:.35});marks.push(mat);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.14,.32,.42,16),mat);body.position.y=1.13;node.add(body);
    const label=plaque([BELL_NAMES[bell.id],'R · 종 울리기'],1,.5);label.position.y=1.72;node.add(label);
    bells.push(node);group.add(node);
  }
  const clue=plaque(['세 종의 비문','R · 단서 기록','오답은 그녀들을 부른다'],1.6,.85);clue.position.set(puzzle.clue.x,1.5,puzzle.clue.z);group.add(clue);
  const lectern=new THREE.Mesh(new THREE.CylinderGeometry(.06,.12,1.3,8),iron);lectern.position.set(puzzle.clue.x,.65,puzzle.clue.z);group.add(lectern);
  const gate=new THREE.Group();gate.position.set(exit.point.x,0,exit.point.z);gate.rotation.y=Math.atan2(exit.normal.x,exit.normal.z);
  const sealMaterial=new THREE.MeshStandardMaterial({color:0x611523,emissive:0xfa718c,emissiveIntensity:.6,metalness:.8,roughness:.35});
  for(let x=-1.2;x<=1.21;x+=.4){const bar=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.5,8),sealMaterial);bar.position.set(x,1.25,0);gate.add(bar);}
  const lock=plaque(['세 종의 봉인'],1.6,.45);lock.position.set(0,1.7,-.1);lock.rotation.y=Math.PI;gate.add(lock);group.add(gate);
  function interact(player:Point):'clue'|'wrong'|'correct'|'solved'|undefined{
    const target=puzzleTarget(puzzle,player);
    if(target==='clue'){puzzle.read=true;return 'clue';}
    if(target===undefined)return undefined;
    return ringBell(puzzle,target);
  }
  return {group,interact,update(player:Point,dt:number){
    puzzle.alarm=Math.max(0,puzzle.alarm-dt);gate.visible=!puzzle.solved;
    bells.forEach((node,i)=>{node.children[3].lookAt(player.x,1.72,player.z);marks[i].emissive.setHex(puzzle.order.slice(0,puzzle.progress).includes(i)?0x8fd9b5:0x611523);});
    clue.lookAt(player.x,1.5,player.z);
    const target=puzzleTarget(puzzle,player),hint=document.querySelector('#puzzle-hint'),objective=document.querySelector('#objective');
    if(objective)objective.textContent=puzzle.solved?'봉인 해제 · EXIT 밖으로 탈출':`EXIT 봉인 · 종 ${puzzle.progress} / 3`;
    if(hint)hint.textContent=puzzle.solved?'세 종이 침묵했다. 출구가 열렸다.':(target==='clue'?'R · 비문을 읽고 단서 기록':typeof target==='number'?`R · ${BELL_NAMES[target]}의 종 울리기`:'시작 방의 비문을 찾아 R로 읽으세요.')+(puzzle.read?'\n'+clueText(puzzle):'');
    document.body.classList.toggle('puzzle-alarm',puzzle.alarm>0);
  }};
}
