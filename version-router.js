// RCTS/version-router.js
//
// 역할:
// - channels.json에서 채널별 버전(tag)을 읽어와서
// - /RCTS/versions/<태그>/ 로 이동시키기

(function () {
  try {
    var rawChannel =
      typeof window !== 'undefined' && window.VERSION_CHANNEL
        ? String(window.VERSION_CHANNEL)
        : 'prod';

    var channel = rawChannel.trim() || 'prod';

    var CHANNELS_JSON_URL = '/RCTS/channels.json';

    fetch(CHANNELS_JSON_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('channels.json load failed: ' + res.status);
        }
        return res.json();
      })
      .then(function (map) {
        if (!map || typeof map !== 'object') {
          throw new Error('invalid channels.json');
        }

        var tag = map[channel];

        if (!tag) {
          console.error(
            '[version-router] channel "' +
              channel +
              '" not found in channels.json'
          );
          return;
        }

        tag = String(tag).trim();

        if (!tag) {
          console.error(
            '[version-router] channel "' + channel + '" has empty tag'
          );
          return;
        }

        var targetPath = '/RCTS/versions/' + encodeURIComponent(tag) + '/';

        if (location.pathname === targetPath) return;

        var search = location.search || '';
        var hash = location.hash || '';

        var targetUrl = targetPath + search + hash;

        console.info(
          '[version-router] channel=' +
            channel +
            ' → tag=' +
            tag +
            ' → ' +
            targetUrl
        );

        location.replace(targetUrl);
      })
      .catch(function (err) {
        console.error('[version-router] error:', err);
      });
  } catch (e) {
    console.error('[version-router] init error:', e);
  }
})();
