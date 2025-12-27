// public/version-router.js

(function () {
  try {
    var rawChannel =
      typeof window !== "undefined" && window.VERSION_CHANNEL
        ? String(window.VERSION_CHANNEL)
        : "prod";

    var channel = rawChannel.trim() || "prod";

    // channels.json은 그대로 사용 (prod/test/preopen 판단용)
    fetch("channels.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("channels.json load failed: " + res.status);
        return res.json();
      })
      .then(function (map) {
        if (!map || typeof map !== "object") {
          throw new Error("invalid channels.json");
        }

        var tag = map[channel]; // 지금은 써먹지 않아도 됨

        // 🔹 일단은 버전 서브폴더로 가지 말고,
        //     그냥 /RCTS/ 루트(지금 dist가 올라간 곳)만 바라보게.
        //     (= 리다이렉트 자체를 생략해도 됨)
        console.info("[version-router] channel=" + channel + " tag=" + tag);

        // 리다이렉트 안 하고 현재 페이지에 머무르기
        // 혹은 필요하면 location.replace("/RCTS/") 정도만 사용
      })
      .catch(function (err) {
        console.error("[version-router] error:", err);
      });
  } catch (e) {
    console.error("[version-router] init error:", e);
  }
})();
