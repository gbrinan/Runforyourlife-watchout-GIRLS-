# Blender 던전 모듈 QA

## 산출물

- Blender 5.2.1 LTS 원본: `blender/dungeon-kit.blend`
- 게임용 GLB: `public/assets/dungeon-kit.glb`
- 재생성 스크립트: `tools/blender/build_dungeon_kit.py`
- 런타임 통합: `src/render/dungeon.ts`

고딕 석재 기둥, 분절 아치, 마모된 상인방, 철제 장식을 하나의 모듈로 제작했다. 시작 방에서는 봉쇄문을 감싸고, 나머지 랜덤 방에는 시드에 따라 북쪽 또는 남쪽 벽에 배치된다. 맵의 방·복도·EXIT 생성과 충돌 데이터는 기존 결정론적 생성기가 계속 담당한다.

## 검증

- Blender 백그라운드 재생성 및 GLB 내보내기 성공.
- TypeScript 타입 검사 통과.
- Vitest 125/125 통과. 2,000개 시드의 시작점 → EXIT 경로 검사 포함.
- 프로덕션 빌드 통과. GLTFLoader 통합 후 gzip 합계 약 177.88 KB.
- 실제 Chrome에서 `/assets/dungeon-kit.glb` 응답 200, `pageerror` 0건.
- 네 방향 캡처에서 시작 방과 복도의 아치 배치, 0.0m/s 제자리 회전, HUD 가독성을 확인했다.

화면 증거: `blender-map-final.png`, `blender-map-turn-1.png`, `blender-map-turn-2.png`, `blender-map-turn-3.png`, `blender-map-material-final.png`.

## 독립 검토

- `blender_map_functional`: PASS. 유효한 GLB, 결정론적 배치, 기존 충돌·EXIT 계약 유지에 차단 사항 없음.
- `blender_map_visual`: PASS (높은 확신). 벽 정렬, 낮은 천장 분위기, 어두운 재질, HUD 가독성에 차단 사항 없음.
