# 후방 기습과 하이힐 검증

- 빌드: main-DhASvkn7.js / heels-DRQY0jYx.js.
- 타입검사와 133개 테스트, 프로덕션 빌드 성공. 기존 번들 크기 경고 유지.
- 실제 Chrome 증거: `rear-results.json`, `rear-audio.webm`, `rear-scare.cjs`.
- 전체 화면 4개: `rear-before.png`, `rear-appeared.png`, `rear-turn.png`, `rear-paused.png`.
- 첫 생성은 뒤쪽, 25초 도입에는 적/힐 없음, E키 회전으로 실제 모델 확인, 일시정지 때 오디오 중단.
- 오디오 출력 peak 0.2188, 1450Hz 굽 합성 시작 7회 관찰. 사람 청감/이어폰 HRTF 구분까지 검증했다는 뜻은 아니다.

독립 `rear_functional_final`, `rear_visual_final` 검토 모두 PASS. 전체 4장과 소스/출력 기록을 대조했고 차단 사항은 없다. 도입 캡처의 HUD는 2초이므로 25초 보호구간은 소스/회귀 검사로 증명한다. 임시 디버그 저널은 실행 기록을 progress.md에 보존한 뒤 제거했다.
