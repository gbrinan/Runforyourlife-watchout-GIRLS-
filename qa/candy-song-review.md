# 캔디마운틴 엔딩 테마곡 검증

- 구현: 132 BPM 오리지널 멜로디, 장난감 피아노·벨·베이스 합성, 7.273초 반복
- 자동 검사: 타입검사, 19파일 143개 테스트, 프로덕션 빌드 통과
- 실제 경로: `exit-4` 시드에서 종 퍼즐 해결 후 EXIT 문턱 통과
- 브라우저 결과: `candy-song-results.json`의 `title=캔디마운틴`, `loop=true`, `contextState=running`, `errors=[]`
- 신호: 렌더 파형 peak 0.4357 / energy 0.01875, 실제 출력 meter peak 0.0826
- 화면: `candy-song-ending.png`
- 녹음: `candy-mountain-song.webm`

사람 청취 취향 평가는 수행하지 않았다. 멜로디의 밝음과 후반 불협화음 균형은 실제 플레이 피드백으로 조정할 수 있다.
