// public/version-router.js

(function () {
  try {
    var rawChannel =
      typeof window !== "undefined" && window.VERSION_CHANNEL
        ? String(window.VERSION_CHANNEL)
        : "prod";

    var channel = rawChannel.trim() || "prod";

    // 이미 /RCTS/versions/ 아래에 있으면 더 이상 리다이렉트하지 않음
    if (location.pathname.startsWith("/RCTS/versions/")) {
      return;
    }

    fetch("channels.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("channels.json load failed: " + res.status);
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

        // ?redirect=/something 처리 (기존 GitHub Pages SPA 리다이렉트 대응)
        var params = new URLSearchParams(location.search);
        var redirect = params.get("redirect") || "";

        // "/RCTS/..." or "/" 로 시작하는 걸 정리
        if (redirect.startsWith("/RCTS/")) {
          redirect = redirect.slice("/RCTS/".length);
        } else if (redirect.startsWith("/")) {
          redirect = redirect.slice(1);
        }

        var targetPath = "/RCTS/versions/" + encodeURIComponent(tag) + "/";

        if (redirect) {
          targetPath += redirect;
        }

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

        location.replace(targetPath);
      })
      .catch(function (err) {
        console.error("[version-router] error:", err);
      });
  } catch (e) {
    console.error("[version-router] init error:", e);
  }
})();
