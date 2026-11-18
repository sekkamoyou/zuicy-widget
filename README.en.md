# zuicy

[한국어](README.md) | English

A Now Playing widget for OBS that shows what's playing in [Cider](https://cider.sh).

- Theme colors follow the album art
- Background: album art, artist photo, or solid color
- Detects the Cider 2.x and 3.x APIs automatically
- No server or build step. Just add `index.html` to OBS

## Setup

### 1. Cider

Turn on RPC/API and WebSocket in Settings → Connectivity. If you want authentication, get a token from Manage External Application Access on the same screen.

To check that it's on:

```sh
curl -i http://localhost:10767/api/v1/playback/active   # Cider 2.x: 204
curl -i http://localhost:10767/api/v2/playback          # Cider 3.x: 200
```

### 2. OBS

Add a Browser source, check **Local file**, and pick `index.html`. Size: 460 × 120.

The widget only shows while something is playing. It hides 2 seconds after you pause, and right away if Cider disconnects.

### 3. Dashboard (optional)

Open `dashboard.html` in Chrome or Edge to change settings with a live preview. The dashboard UI is in Korean for now.

Click **위젯 폴더 연결** (connect widget folder) and pick the folder with `index.html`. Settings are saved there, and the widget in OBS picks them up within a few seconds. In browsers that can't connect a folder, use **설정 파일 다운로드** (download config files) and put both files next to `index.html`.

## Settings

`widget-config.js` (the dashboard writes it for you):

```js
window.__zuicyConfig = { "host": "localhost:10767", "token": "", "bg": "art", "font": "" };
```

| Key | Default | |
|---|---|---|
| `host` | `localhost:10767` | Cider address |
| `token` | | Cider app token, only if you turned on authentication |
| `bg` | `art` | `art` album art, `artist` artist photo, `accent` solid color |
| `font` | | Name of a font installed on the OBS PC |
| `debug` | `false` | Show diagnostics at the bottom of the widget. Use `debug=1` in the URL |

The same keys work as URL parameters (`index.html?bg=artist`) and override the file. OBS local file mode can drop URL parameters, though, so keep your usual settings in the file.

`widget-config.json` is a JSON version of the same file. It's only read over http, when the JS file is missing.

## Artist photos

With `bg` set to `artist`, the widget looks in `artist-images/` in the widget folder first and falls back to a Deezer search.

Once you connect the widget folder, the dashboard lists the artists you've played. Expand a row to save a photo from Deezer or replace it with a file or URL. If the same artist shows up under another name (a localized spelling, for example), add it under **다른 이름에도 적용** (apply to other names).

<details>
<summary>Adding photos by hand</summary>

File name: the artist name in lowercase, accents dropped (é → e), symbols and spaces turned into `-`. `Daft Punk` → `artist-images/daft-punk.jpg`

Aliases go in `artist-images/index.js`. Over http, an `index.json` with the same content also works.

```js
window.__zuicyArtistImages = {
  "images": { "daft punk": "daft-punk.jpg" },
  "aliases": { "다프트 펑크": "daft punk" }
};
```

</details>

## Troubleshooting

- Widget not showing: make sure something is playing in Cider and the `curl` commands above respond.
- Using a token and the first track doesn't show up: requests from `file://` with a token header can get blocked by CORS. Turning off the token requirement in Cider is the easy fix.
- Settings not applying: check that `widget-config.js` is next to `index.html`.
- Still stuck: add `"debug": true` to the config. The widget will show where it read its config from, where the artist photo came from, the API version, and the socket state.

## Known issues

- Fixed at 460 × 120
- On Cider builds with only the v1 API, the console keeps logging a v2 404 warning (harmless)

## Development

To test without Cider, run the mock server:

```sh
cd tools && npm install && npm run mock   # localhost:10767
python3 -m http.server 8080               # in another terminal, from the project root
```

Open `http://localhost:8080/index.html?debug=1` and `http://localhost:8080/dashboard.html`. The mock serves the Cider v1 API and switches tracks every 8 seconds. To check OBS local file mode, also open `index.html` as a local file in your browser.

OBS and the dashboard read the CSS in `assets/css/` directly. After editing the SCSS, regenerate the CSS with these commands.

```sh
sass --no-source-map assets/sass/style.scss assets/css/style.css    # dashboard
sass --no-source-map assets/sass/widget.scss assets/css/widget.css  # widget
```

To bundle only what the OBS PC needs:

```sh
zip -r ../zuicy.zip index.html dashboard.html widget-config.* assets LICENSE -x "*.DS_Store" "assets/sass/*"
```

## License

[MIT](LICENSE). Bundled third-party files keep their own licenses:

- socket.io client: MIT
- destyle.css: MIT
- Pretendard JP: SIL OFL 1.1 ([assets/fonts/LICENSE.txt](assets/fonts/LICENSE.txt))
