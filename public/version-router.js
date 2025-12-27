// public/version-router.js
//
// 역할:
// - /RCTS/, /RCTS/test/, /RCTS/preopen/ 같은 "입구"에서만 동작
// - channels.json에서 채널(prod/preopen/test)에 해당하는 버전(tag)을 읽고
// - /RCTS/versions/<tag>/... 으로 한 번만 보내줌
// - 이미 /RCTS/versions/ 아래에 있으면 아무 것도 하지 않음

(function () {
  try {
    // 0) versions 아래에서는 절대 동작하지 않도록 막기 (무한 루프 방지)
    if (location.pathname.startsWith("/RCTS/versions/")) {
      // 앱이 이미 열려 있는 상태 → 그냥 두기
      return;
    }

    // 1) 채널 결정 (없으면 prod)
    var rawChannel =
      typeof window !== "undefined" && window.VERSION_CHANNEL
        ? String(window.VERSION_CHANNEL)
        : "prod";

    var channel = rawChannel.trim() || "prod";

    // 2) channels.json 로드 (base=/RCTS/ 기준이므로 상대경로 사용)
    fetch("channels.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("channels.json load failed: " + res.status);
        }
        return res.json();
      })
      .then(function (map) {
        if (!map || typeof map !== "object") {
          throw new Error("invalid channels.json");
        }

        var tag = map[channel];
        tag = (tag || "").toString().trim();

        if (!tag) {
          console.error(
            "[version-router] channel=" + channel + " 에 해당하는 tag 없음"
          );
          return;
        }

        // 3) GitHub Pages SPA용 redirect 파라미터 처리 (있으면 한 번만 사용)
        var params = new URLSearchParams(location.search);
        var redirect = params.get("redirect") || "";

        // "/RCTS/..." or "/" 로 시작하는 경우 정리
        if (redirect.startsWith("/RCTS/")) {
          redirect = redirect.slice("/RCTS/".length);
        } else if (redirect.startsWith("/")) {
          redirect = redirect.slice(1);
        }

        // 4) 최종 이동할 경로 구성
        var targetPath = "/RCTS/versions/" + encodeURIComponent(tag) + "/";

        if (redirect) {
          // 예: redirect="channels.json" 이면
          // /RCTS/versions/v0.05/channels.json 으로
          targetPath += redirect;
        }

        // 현재 위치와 동일하면 다시 리다이렉트하지 않음
        var current = location.pathname + location.search;

        if (current === targetPath) {
          return;
        }

        console.info(
          "[version-router] channel=" +
            channel +
            " tag=" +
            tag +
            " → " +
            targetPath
        );

        // 5) 실제 이동
        location.replace(targetPath);
      })
      .catch(function (err) {
        console.error("[version-router] error:", err);
      });
  } catch (e) {
    console.error("[version-router] init error:", e);
  }
})();
