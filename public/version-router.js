// public/version-router.js
//
// 역할 (단순 버전):
// - /RCTS/, /RCTS/test/, /RCTS/preopen/ 같은 "입구"에서만 동작
// - channels.json에서 채널(prod/preopen/test)의 tag 읽어서
// - /RCTS/versions/<tag>/ 로 한 번만 이동
// - 이미 /RCTS/versions/ 아래에 있으면 아무 것도 안 함
// - redirect 파라미터는 당분간 무시 (무한루프 방지)

(function () {
  try {
    // 0) 이미 버전 경로에 있으면 아무 것도 안 함 (무한 루프 방지)
    if (location.pathname.startsWith("/RCTS/versions/")) {
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

        // 3) 최종 이동할 경로: /RCTS/versions/<tag>/
        var targetPath = "/RCTS/versions/" + encodeURIComponent(tag) + "/";

        // 이미 그 경로에 있다면 리다이렉트하지 않음
        if (location.pathname === targetPath) {
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

        // 4) 실제 이동
        location.replace(targetPath);
      })
      .catch(function (err) {
        console.error("[version-router] error:", err);
      });
  } catch (e) {
    console.error("[version-router] init error:", e);
  }
})();
