# 조작·캐릭터 QA

검토 대상: 최종 Chrome 캡처10장, controls-browser-results.json, 실제 입력/렌더 소스.

## 시각 검토
독립 controls_visual_review: PASS, HIGH, 차단 사항 없음.
- 시작/실행/마우스시점/정지/사망, 접근3단계,375/768 화면 모두 직접 확인.
- 한글 잘림/외톨이 음절/가로넘침 없음. 설정과 안내의 배치 정상.
- 실제3D 메시와 관절 동작, 생성 얼굴 텍스처, 실제DOM 설정 확인.
- 긴 머리와 큰 눈, 의상·팔다리가 식별됨. 정밀 수작업 모델 복제가 아닌 애니메이션풍 절차적 모델.

## 실행 증거
- controls-browser-results.json: WASD 각3m/s/키해제0, Shift8, Ctrl1.5, Space공격/근접밀침, 설정0.7유지/정지, 사망, pageerror0.
- controls-mouse-look-1280.png: 실제 마우스 입력으로 시점 변경.
- controls-start-375.png, controls-start-768.png, controls-start-1280.png: 반응형 시작/설정.
- controls-running-1280.png, controls-paused-1280.png, controls-death-1280.png: 실제 상태.
- maiden-approach-start.png, maiden-approach-mid.png, maiden-close-1280.png: 실제 접근·공격 모습.
- 타입검사/99테스트/빌드 통과. 세부 수치는 ../plan/progress.md.

## 평가 한계
한글 물리키 경로는 event.code 소스로 확인했으며 OS IME 전환 자체는 자동조작하지 않았다. 사람의 장시간 조작 편의/공포감과 기기별60fps는 별도 평가 필요. 키보드·마우스 게임, 터치 미지원.

## 기능·구현 독립 검토
controls_integrity_review: PASS, HIGH, 차단 사항 없음. 최종 캡처10장과 소스/실제키 스크립트 확인. 방향 벡터/대각선 정규화/즉시정지/달리기/서행 우선순위/피로 제한, Ctrl 선입력 단축키 방지 일치. 감도·시점·공격·피해·정지 증거 확인. 실제DOM/3D 구현으로 판정.
