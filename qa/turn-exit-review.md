# 출구 경로 보장 / D·E 제자리 회전 QA

## 구현 결과

- 던전 생성 결과를 반환하기 전에 플레이어 충돌 반경을 적용한 BFS로 시작점에서 `EXIT` 바깥 지점까지의 경로를 검증한다.
- `D`는 제자리 좌회전, `E`는 제자리 우회전이다. 두 키 모두 이동 속도를 만들지 않는다.
- 기존 `E` 울음 동작은 `Q`로 옮겼고 시작 화면, HUD, README 안내를 함께 갱신했다.

## 자동 검증

- 무작위 2,000개 시드에서 시작점 → `EXIT` 바깥 경로 통과.
- TypeScript 타입 검사 통과.
- Vitest 125/125 통과.
- 프로덕션 빌드 통과. 전체 gzip 약 152.96 KB.
- Vite의 vendor 청크 원본 500 KB 안내는 기존 경고이며 압축 예산 300 KB 이내다.

## 실제 Chrome 검증

- `D` 0.6초 입력: 시작 시점에서 왼쪽 복도로 회전, HUD 속도 `0.0 m/s`.
- 이어서 `E` 1.2초 입력: 오른쪽으로 회전, HUD 속도 `0.0 m/s`.
- `Q` 입력: `히힝!` 자막 확인.
- 실제 키보드·마우스 이동으로 `EXIT` 통과, 탈출 화면, 시간 정지, 새 시드 재시작 확인.
- 플레이어·AI·클리어 상태 주입 없음. `pageerror` 0건.

증거: `turn-final-before.png`, `turn-final-after-d.png`, `turn-final-after-e.png`, `turn-exit-browser-results.json`, `exit-browser-results.json`, `exit-clear.png`.

## 독립 검토

- `turn_exit_verified_functional`: PASS. 입력 매핑, 제자리 회전, Q 울음, 생성 경로 계약에 차단 사항 없음.
- `turn_exit_verified_visual`: PASS (높은 확신). 새 파일명의 최종 캡처에서 좌우 회전, 0.0m/s, 안내와 EXIT 화면 확인.
