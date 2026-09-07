# 캔디마운틴까지 (Unicorn Horror)

1인칭 프로시저럴 유니콘 서바이벌 호러. 에셋 파일 없이 지형과 사운드를 모두 런타임에 생성한다.
기획서: `docs/GDD.md`

현재 구현 범위: M-1(전제 검증) + M0(프로토타입).

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 다음 경로를 연다.

- `http://localhost:5173/index.html` — M0: 1인칭 4단 보법 프로토타입. 클릭해서 포인터 락을 건 뒤 마우스로 시선을 돌리고 W로 전진한다. Shift로 보법을 올리고 Ctrl로 내린다. `?seed=원하는값`으로 시드를 지정할 수 있다.
- `http://localhost:5173/m1.html` — M-1: 파스텔 초원 실험 화면. "힐 소리" 버튼은 30m에서 3m로 15초에 걸쳐 다가오는 3D(HRTF) 소리를 재생하고, "웃음" 버튼은 처녀 웃음 합성음을 재생한다.

## 빌드

```bash
npm run build
```

`dist/`에 gzip 기준 약 123 KB(Three.js 포함)로 결과물이 생성된다. 목표는 300 KB 이하.

## 테스트

```bash
npm run test
npm run test:coverage
```

`src/core`, `src/gen`, `src/entities`, `src/audio/hooves.ts`의 순수 로직을 대상으로 하며 목표 커버리지는 85% 이상이다.
