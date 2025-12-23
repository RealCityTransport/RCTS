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
  // (필요할 때만 쓰면 됨. 기본은 채널로 자동 산출)
  const explicitBase = env.VITE_BASE;

  // ✅ 2) 오빠가 이미 쓰는 채널 값 기반으로 base 자동 산출
  const channel = (env.VITE_DEPLOY_CHANNEL ?? "").trim().toLowerCase();

  // 오빠가 운영하려는 경로 정책:
  // prod    -> /RCTS/
  // test    -> /RCTS/test/
  // preview -> /RCTS/preview/
  // (필요하면 staging도 추가 가능)
  const channelBaseMap = {
    prod: "/RCTS/",
    production: "/RCTS/",
    test: "/RCTS/test/",
    preview: "/RCTS/preview/",
    staging: "/RCTS/staging/",
    dev: "/RCTS/dev/",
  };

  // 채널이 없거나 알 수 없을 때의 안전한 기본값
  // - build(=production mode)면 prod로 취급
  // - dev 서버면 "/" (로컬 개발은 보통 루트가 편함)
  const computedBase =
    channelBaseMap[channel] ??
    (mode === "production" ? "/RCTS/" : "/");

  const base = normalizeBase(explicitBase ?? computedBase);

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
