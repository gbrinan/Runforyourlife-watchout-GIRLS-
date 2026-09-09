import * as THREE from 'three';
import { MAIDEN_LOOKS, STALKER_LOOK } from '../entities/maiden-variants';
import { createMaidenModel } from '../render/maiden-model';

export function createCastGallery() {
  const dialog=document.querySelector<HTMLDialogElement>('#cast');
  const grid=document.querySelector('#cast-grid');
  let built=false;
  function build() {
    if(built||!grid)return;
    built=true;
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(240,320);renderer.setPixelRatio(1);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x19222a);
    scene.add(new THREE.AmbientLight(0xffffff,2));
    const light=new THREE.DirectionalLight(0xffe9da,3);light.position.set(-2,4,4);scene.add(light);
    const camera=new THREE.PerspectiveCamera(35,240/320,.1,10);camera.position.set(0,1.15,3.5);camera.lookAt(0,.95,0);
    for(const look of [...MAIDEN_LOOKS,STALKER_LOOK]) {
      const model=createMaidenModel(look);scene.add(model.group);renderer.render(scene,camera);
      const card=document.createElement('article');card.className='cast-card';
      const image=document.createElement('img');image.src=renderer.domElement.toDataURL('image/png');image.width=240;image.height=320;image.alt=look.description;
      const name=document.createElement('h3');name.textContent=look.name;
      const description=document.createElement('p');description.textContent=look.description;
      const detail=document.createElement('p');detail.className='small';detail.textContent=look===STALKER_LOOK?'강적 · 시야를 끊어도 추격\n봉인진 안에서만 들이받아 봉인':'소리와 발자국을 따라 접근\n모퉁이에서 시야를 끊으세요';
      card.append(image,name,description,detail);grid.append(card);scene.remove(model.group);
      model.group.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];for(const material of materials){if(material instanceof THREE.MeshBasicMaterial)material.map?.dispose();material.dispose();}}});
    }
    renderer.dispose();
  }
  document.querySelector('#cast-open')?.addEventListener('click',()=>{build();dialog?.showModal();});
  document.querySelector('#cast-close')?.addEventListener('click',()=>dialog?.close());
  return {isOpen:()=>dialog?.open??false};
}
