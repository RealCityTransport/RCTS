(function () {
  try {
    // 0) 이미 버전 폴더라면 아무 것도 하지 않음
    if (location.pathname.startsWith("/RCTS/versions/")) {
      return;
    }

    // 1) 채널 결정 (없으면 prod)
    var rawChannel =
      typeof window !== "undefined" && window.VERSION_CHANNEL
        ? String(window.VERSION_CHANNEL)
        : "prod";

    var channel = rawChannel.trim() || "prod";

    // 2) 채널 → 태그 매핑
    var tagMap = {
      prod: "v0.05",
      preopen: "v0.06",
      test: "v0.07",
    };

    var tag = tagMap[channel] || tagMap.prod;

    if (!tag) return;

    // 3) 이동 대상
    var target = "/RCTS/versions/" + encodeURIComponent(tag) + "/";

    // 이미 그 위치면 이동 금지
    if (location.pathname === target) return;

    // 4) 이동
    location.replace(target);

  } catch (e) {
    console.error(e);
  }
})();
