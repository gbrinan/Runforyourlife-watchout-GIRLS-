# 얼굴 비율과 위협도 변형 검토

- 화면 증거: `threat-gallery-1280.png`, `threat-gallery-375.png`, `threat-card-1-375.png`부터 `threat-card-5-375.png`
- 실행 결과: `threat-variation-results.json`
- 기능 검증: 타입검사, 18파일 141개 테스트, 프로덕션 빌드 통과
- 실제 표면: Chrome 1280x800/375x812와 현재 인앱 브라우저 갤러리 확인
- `threat_visual_a`: PASS. 세 대상의 작은 얼굴, 다섯 외형의 구분, 데스크톱·모바일 문구 가독성, 오류·가로 넘침 부재 확인.
- `threat_visual_b`: PASS. 얼굴 배율 적용과 캐릭터 위계, 모바일 세로 스크롤, 카드 잘림 부재를 독립 확인.

남은 위험: 수치상 회피 가능성은 최소 0.6초 예고로 보호했지만, 세 강적의 체감 난이도는 사람 플레이테스트가 필요하다.
