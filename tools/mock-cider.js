// Cider RPC 모의 서버 — 실제 Cider 없이 위젯·대시보드를 검증하기 위한 개발 도구.
//
// 재현 대상은 실사용 환경(Cider v1 전용)이다:
//   - GET /api/v2/playback            → 404 (v2 미탑재 빌드)
//   - GET /api/v1/playback/active     → 204
//   - GET /api/v1/playback/now-playing → { status, info: { ... } }
//   - GET /api/v1/playback/is-playing  → { status, is_playing }
//   - socket.io "API:Playback" 브로드캐스트
//
// 아트워크는 실제 Apple Music CDN URL이라 {w}x{h} 치환 경로까지 검증된다.
// 팔레트(bgColor/textColor)는 일부러 넣지 않는다. v1 Cider가 주지 않으므로,
// 위젯의 "앨범아트 평균색 추출" 폴백이 동작하는 조건이 된다.
//
// 실행: cd tools && npm install && node mock-cider.js

const http = require("http");
const { Server } = require("socket.io");

const PORT = 10767;

const tracks = {
  a: {
    id: "1001",
    // marquee(넘침 스크롤) 검증을 위해 일부러 긴 제목
    name: "Midnight City Drive — Extended Club Remaster (feat. Someone With A Very Long Name)",
    artistName: "Daft Punk", // Deezer 검색이 성공하는 실존 아티스트
    albumName: "Random Access Memories",
    durationInMillis: 200000,
    artwork: {
      url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e8/43/5f/e8435ffa-b6b9-b171-40ab-4ff3959ab661/886443919266.jpg/{w}x{h}bb.jpg",
    },
  },
  b: {
    id: "1002",
    name: "Short Song",
    artistName: "Zzqx Nonexistent Artist 9931", // Deezer 미스 → 폴백 경로 검증용
    albumName: "After Hours",
    durationInMillis: 95000,
    artwork: {
      url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/{w}x{h}bb.jpg",
    },
  },
};

let state = { track: tracks.a, current: 30, playing: true };

const server = http.createServer((req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "apptoken, content-type",
  };
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    return res.end();
  }
  if (req.url === "/api/v2/playback") {
    res.writeHead(404, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify({
      message: "Route GET:/api/v2/playback not found",
      error: "Not Found",
      statusCode: 404,
    }));
  }
  if (req.url === "/api/v1/playback/active") {
    res.writeHead(204, cors);
    return res.end();
  }
  if (req.url === "/api/v1/playback/now-playing") {
    res.writeHead(200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify({
      status: "ok",
      info: {
        ...state.track,
        currentPlaybackTime: state.current,
        remainingTime: state.track.durationInMillis / 1000 - state.current,
      },
    }));
  }
  if (req.url === "/api/v1/playback/is-playing") {
    res.writeHead(200, { "Content-Type": "application/json", ...cors });
    return res.end(JSON.stringify({ status: "ok", is_playing: state.playing }));
  }
  res.writeHead(404, cors);
  res.end();
});

const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", socket => console.log("[mock] socket connected", socket.id));

function emit(type, data) {
  io.emit("API:Playback", { type, data });
}

// 기본 시나리오: 1초마다 재생 시간, 8초마다 곡 교대.
let tick = 0;
let current = "a";
setInterval(() => {
  tick += 1;
  state.current += 1;

  emit("playbackStatus.playbackTimeDidChange", {
    currentPlaybackTime: state.current,
    currentPlaybackDuration: state.track.durationInMillis / 1000,
    currentPlaybackTimeRemaining: state.track.durationInMillis / 1000 - state.current,
    isPlaying: true,
  });

  if (tick % 8 === 0) {
    current = current === "a" ? "b" : "a";
    state = { track: tracks[current], current: 0, playing: true };
    console.log(`[mock] track change -> ${current.toUpperCase()} (${state.track.artistName})`);
    emit("playbackStatus.nowPlayingItemDidChange", {
      attributes: state.track,
      id: state.track.id,
    });
  }
}, 1000);

server.listen(PORT, () => console.log(`[mock] Cider mock on :${PORT}`));
