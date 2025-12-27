// vite.config.js
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

// ✅ ESM 환경에서 __dirname 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeBase(input, fallback = "/RCTS/") {
  let b = (input ?? fallback).trim();
  if (!b) b = fallback;

  // 앞 슬래시 보장
  if (!b.startsWith("/")) b = "/" + b;

  // 뒤 슬래시 보장 (Vite/Router에서 중요)
  if (!b.endsWith("/")) b = b + "/";

  return b;
}

export default defineConfig(({ mode }) => {
  // VITE_* env 로드
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // ✅ 1) 직접 base 지정이 있으면 최우선
  // (예: VITE_BASE=/RCTS/versions/0.02/ npm run build)
  const explicitBase = env.VITE_BASE;

  // ✅ 2) 버전 태그 기반 base 자동 산출
  // (예: VITE_VERSION_TAG=0.02 → /RCTS/versions/0.02/)
  const versionTag = (env.VITE_VERSION_TAG ?? "").trim();

  // ✅ 3) 채널 값 기반 base 자동 산출 (기존 정책 유지)
  const channel = (env.VITE_DEPLOY_CHANNEL ?? "").trim().toLowerCase();

  // 운영 경로 정책:
  // prod    -> /RCTS/
  // test    -> /RCTS/test/
  // preview -> /RCTS/preview/
  // staging -> /RCTS/staging/
  // dev     -> /RCTS/dev/
  const channelBaseMap = {
    prod: "/RCTS/",
    production: "/RCTS/",
    test: "/RCTS/test/",
    preview: "/RCTS/preview/",
    staging: "/RCTS/staging/",
    dev: "/RCTS/dev/",
  };

  let rawBase;

  if (explicitBase) {
    // 1순위: VITE_BASE 강제 지정
    rawBase = explicitBase;
  } else if (versionTag) {
    // 2순위: 버전 태그가 있으면 /RCTS/versions/<tag>/ 로 빌드
    rawBase = `/RCTS/versions/${versionTag}/`;
  } else {
    // 3순위: 채널 기반 또는 기본값
    rawBase =
      channelBaseMap[channel] ??
      (mode === "production" ? "/RCTS/" : "/");
  }

  const base = normalizeBase(rawBase);

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      watch: { usePolling: true },
    },
  };
});
