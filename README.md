# zuicy

한국어 | [English](README.en.md)

[Cider](https://cider.sh)에서 재생 중인 곡을 OBS에 띄워 주는 Now Playing 위젯입니다.

- 앨범아트 색에 맞춘 자동 테마
- 앨범아트 / 아티스트 사진 / 단색 배경
- Cider 2.x, 3.x 지원
- 서버나 빌드 없이 OBS에 `index.html`만 등록하면 동작

## 사용법

### 1. Cider 설정

Settings → Connectivity에서 RPC/API와 WebSocket을 켜 주세요. 인증을 쓰려면 같은 화면의 Manage External Application Access에서 토큰을 발급받으면 됩니다.

RPC 응답은 아래 명령으로 확인합니다.

```sh
curl -i http://localhost:10767/api/v1/playback/active   # Cider 2.x: 204
curl -i http://localhost:10767/api/v2/playback          # Cider 3.x: 200
```

### 2. OBS에 추가

소스 추가 → 브라우저에서 **로컬 파일**을 체크하고 `index.html`을 선택합니다. 크기는 460 × 120으로 맞춰 주세요.

위젯은 곡이 재생 중일 때만 보입니다. 일시정지하면 2초 뒤에, Cider 연결이 끊기면 바로 사라집니다.

### 3. 대시보드 (선택)

`dashboard.html`을 Chrome이나 Edge에서 열면 미리보기를 보면서 설정을 바꿀 수 있습니다.

**위젯 폴더 연결**을 누르고 `index.html`이 있는 폴더를 선택하면 설정이 그 폴더에 저장되고, OBS 위젯에도 몇 초 안에 반영됩니다. 폴더 연결이 안 되는 브라우저라면 **설정 파일 다운로드**로 받은 파일 두 개를 `index.html`과 같은 폴더에 넣어 주세요.

## 설정

대시보드에서 설정을 저장하면 `widget-config.js`가 생성됩니다.

```js
window.__zuicyConfig = { "host": "localhost:10767", "token": "", "bg": "art", "font": "" };
```

| 키 | 기본값 | 설명 |
|---|---|---|
| `host` | `localhost:10767` | Cider 주소 |
| `token` | | Cider 앱 토큰 (인증을 켰을 때만) |
| `bg` | `art` | `art` 앨범아트, `artist` 아티스트 사진, `accent` 단색 |
| `font` | | OBS PC에 설치된 폰트 이름 |
| `debug` | `false` | 위젯 하단에 진단 정보 표시 (URL에서는 `debug=1`) |

같은 키를 URL 파라미터(`index.html?bg=artist`)로 넘겨도 되고, 그러면 파일보다 우선합니다. 다만 OBS 로컬 파일 모드에서는 파라미터가 사라지기도 해서 평소 설정은 파일에 두는 편이 안전합니다.

`widget-config.json`은 같은 내용의 JSON 버전입니다. http로 띄웠는데 JS 파일이 없을 때만 읽습니다.

## 아티스트 사진

`bg`를 `artist`로 두면 위젯 폴더의 `artist-images/`에서 사진을 먼저 찾고, 없으면 Deezer에서 검색합니다.

대시보드에서 위젯 폴더를 연결하면 재생했던 아티스트 목록이 나옵니다. 항목을 펼치면 Deezer에서 사진을 저장하거나 파일·URL로 교체하는 버튼이 있습니다. 같은 아티스트가 다른 이름으로 나올 때는(한글/영문 표기 등) **다른 이름에도 적용**에 추가해 주세요.

<details>
<summary>직접 넣기</summary>

파일명은 아티스트명을 소문자로 바꾸고, 악센트를 빼고(é → e), 기호와 공백을 `-`로 바꾼 이름입니다. 예를 들어 `Daft Punk`는 `artist-images/daft-punk.jpg`가 됩니다.

별칭은 `artist-images/index.js`에 적습니다. http에서는 같은 내용의 `index.json`도 읽습니다.

```js
window.__zuicyArtistImages = {
  "images": { "daft punk": "daft-punk.jpg" },
  "aliases": { "다프트 펑크": "daft punk" }
};
```

</details>

## 안 될 때

- 위젯이 안 보이면 Cider에서 곡이 재생 중인지, 위의 `curl` 명령이 응답하는지 확인해 주세요.
- 토큰을 쓰는데 첫 곡 정보가 안 나온다면 CORS 문제일 수 있습니다. `file://`에서 토큰 헤더를 보내면 막히기도 해서, Cider에서 토큰 요구를 끄는 게 가장 간단합니다.
- 설정이 반영되지 않으면 `index.html`과 같은 폴더에 `widget-config.js`가 있는지 확인해 주세요.
- 그래도 원인을 모르겠다면 설정에 `"debug": true`를 넣어 보세요. 위젯 하단에 설정을 어디서 읽었는지, 아티스트 사진을 어디서 가져왔는지, API 버전과 소켓 연결 상태가 표시됩니다.

## 알려진 문제

- 위젯 크기는 460 × 120으로 고정되어 있습니다.
- Windows의 OBS에서는 아직 테스트하지 못했습니다.
- v1 API만 있는 Cider에서는 콘솔에 v2 404 경고가 반복해서 찍힙니다. 동작에는 영향이 없습니다.

## 개발

Cider 없이 테스트하려면 모의 서버를 띄우면 됩니다.

```sh
cd tools && npm install && npm run mock   # localhost:10767
python3 -m http.server 8080               # 다른 터미널에서, 프로젝트 루트 기준
```

`http://localhost:8080/index.html?debug=1`과 `http://localhost:8080/dashboard.html`을 열어서 확인합니다. 모의 서버는 v1 API만 있는 Cider처럼 동작하고 8초마다 곡을 바꿉니다. 다른 상황을 테스트하려면 `tools/mock-cider.js`의 `setInterval` 부분을 고치면 됩니다. 실제 OBS는 위젯을 `file://`로 읽기 때문에, http에서 확인한 뒤에도 파일로 한 번 더 열어 보는 게 좋습니다.

스타일을 수정했다면 CSS를 다시 컴파일해서 같이 커밋해 주세요. OBS와 대시보드는 컴파일된 CSS를 그대로 읽습니다.

```sh
sass --no-source-map assets/sass/style.scss assets/css/style.css    # 대시보드
sass --no-source-map assets/sass/widget.scss assets/css/widget.css  # 위젯
```

작업할 때는 아래 규칙을 지켜 주세요.

- OBS PC가 오프라인이어도 동작하도록 CDN이나 웹폰트는 쓰지 않습니다.
- 위젯이 로컬 파일로 열리기 때문에 경로는 모두 상대 경로로 씁니다.
- UI 문구는 한 화면 안에서 한 언어로 맞춥니다. 브랜드명, 제품명, 파일명은 예외입니다.

OBS PC로 옮길 ZIP 파일을 만듭니다.

```sh
zip -r ../zuicy.zip index.html dashboard.html widget-config.* assets LICENSE -x "*.DS_Store" "assets/sass/*"
```

## 라이선스

[MIT](LICENSE) 라이선스로 배포합니다. 포함된 외부 파일은 각각의 라이선스를 따릅니다.

- socket.io 클라이언트: MIT
- destyle.css: MIT
- Pretendard JP: SIL OFL 1.1 ([assets/fonts/LICENSE.txt](assets/fonts/LICENSE.txt))
