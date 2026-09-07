# tasks.md — 작업 계획과 추적

## 목표
「캔디마운틴까지」: 1인칭 프로시저럴 유니콘 서바이벌 호러. 에셋 파일 0, 빌드 300 KB(gzip, Three.js 포함), 맵·사운드는 실행 시 생성. 기획서: docs/GDD.md

## 현재 단계
- [done-impl] M-1 전제 검증 (힐 발소리 + 처녀 웃음 + 파스텔 초원 1장면) — 코드 구현 완료(m1.html), 실사람 평가(5명 무설명 노출)는 미실시
- [done-impl] M0 프로토타입 (지형 + 재질 판정 + 4단 보법 + 발굽 합성음) — 코드 구현·테스트 완료(index.html), "말 같다" 평가는 미실시
- [done-impl] M1 소음·추격 (+스태미너, 히힝, 들이받기, 아저씨 목소리) — 세션 4 구현·테스트 완료(사람 플레이테스트 미실시)
- [done-impl] M1.5 던전 오프닝 — 세션 4 구현·테스트 완료
- [waiting] M2 맵 완성
- [waiting] M3 아이템·마녀·약초
- [waiting] M3.5 동행·엔딩 분기
- [waiting] M4 톤·엔딩 시퀀스
- [waiting] M5 폴리시

## 핵심 질문
- Q1. 프로시저럴만으로 "귀여움"과 "사람다움"이 나오는가? (M-1이 답함. 미달 시 제약 재협상) — 시각 기준선은 세션 3에서 파스텔 초원으로 확보. 청각(웃음)은 미평가
- Q2. Three.js 트리셰이킹 후 예산 180 KB 안에 자체 코드가 들어가는가?
- Q3. HRTF 패너로 힐 소리 앞뒤 구분이 되는가? (M1)

## 결정 표
| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-09-07 | 웹 Three.js + Web Audio | 용량 제약, 링크 배포 |
| 2026-09-07 | 로그라이크 15~25분, 체크포인트 1 | 공포 유지 |
| 2026-09-07 | 털보 2~3명, 확률 배신 | 안식처 의심 |
| 2026-09-07 | 엔딩 5분기 + 노래→순환→요약→암전 | 사용자 지정 |
| 2026-09-07 | M-1을 M0 앞에 둠 | /hate first_nail |
| 2026-09-07 | 던전 오프닝, 처녀 추격 4.5 < 구보 5.0, 스태미너, 들이받기 | 사용자 지정 (GDD B18) |

## 오류 로그
(없음)

## 세션 2 갱신 (2026-09-07)
- M-1, M0 코드 구현 완료. 빌드 gzip 약 123.41 KB (예산 300 KB 이하 통과). vitest 43/43 통과, 커버리지 97.43%(목표 85% 초과).
- 남은 검증: M-1의 "5명 무설명 노출 → 귀여움/무서움 각 3/5 이상" 및 M0의 "개발자 외 2명이 말 같다고 답함"은 사람이 직접 플레이해 판정해야 함(자동화 불가).
- 다음 단계: 위 사람 평가 완료 후 M1(소음·추격) 착수.

## 세션 4 갱신 (2026-09-07): M1 + M1.5 구현
- [done-impl] M1 소음·추격 시스템: src/systems/noise.ts(소음 버스+절사), src/entities/stamina.ts, src/entities/maiden.ts(FSM), src/entities/hp.ts, src/entities/hornlight.ts, src/render/maiden.ts(로우폴리 처녀 메시), src/audio/synth.ts 추가(playBoyVoice/playCrisisVoice/playEchoTowardDoor).
- [done-impl] M1.5 던전 오프닝: src/gen/dungeon.ts(3~5방 미로 생성기, 연결성/문 검증 포함), src/render/dungeon.ts(어두운 상자 지오메트리 + 문 + 뿔의 빛 + 미약 앰비언트).
- [done-impl] src/main.ts 전면 재작성: 던전 시작 -> 히힝/들이받기로 문 3회 타격 -> 초원 전환 -> 처녀 8명 스폰, 스태미너/HP/뿔의 빛/HUD 통합.
- 테스트: vitest 97/97 통과, 커버리지 94.37%(목표 85% 초과). 신규 테스트 파일: noise.test.ts, stamina.test.ts, maiden.test.ts, hp.test.ts, dungeon.test.ts, hornlight.test.ts.
- 빌드: `npm run build` 성공. gzip 합계 약 129.3 KB (index.html 0.98 + main 5.68 + laugh(three.js 포함 vendor) 121.40 + m1 0.66 + m1.html 0.55) — 예산 300 KB 이하 통과.
- 남은 항목: 사람 플레이테스트(HRTF 방향 판별, "말 같다"/"무섭다" 체감 검증)는 자동화 불가로 미실시. 처녀 시야 레이캐스트(지형 차폐)는 M1 범위상 거리+원뿔로 단순화(차폐 생략), M2에서 정교화 예정. 마녀·아이템·엔딩은 M3 이후 범위.
