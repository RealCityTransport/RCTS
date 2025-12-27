// vite.config.js
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

// ✅ ESM 환경에서 __dirname 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * base 경로 정규화
 *
 * - 절대 경로 ("/RCTS/", "/foo/") 는 앞/뒤 슬래시 강제
 * - 상대 경로 ("./", "../foo/") 는 앞 슬래시는 건드리지 않고, 뒤 슬래시만 보장
 */
function normalizeBase(input, fallback = "/") {
  let b = (input ?? fallback).trim();
  if (!b) b = fallback;

  const isRelative = b.startsWith("."); // "./", "../" 등

  // 상대 경로가 아닌 경우에만 앞 슬래시 보장
  if (!isRelative) {
    if (!b.startsWith("/")) b = "/" + b;
  }

  // 뒤 슬래시는 공통으로 보장
  if (!b.endsWith("/")) b = b + "/";

  return b;
}

export default defineConfig(({ mode }) => {
  // VITE_* env 로드
  const env = loadEnv(mode, process.cwd(), "VITE_");

  /**
   * base 결정 우선순위
   * 1) VITE_BASE (CI/Actions에서 주입하는 명시값)
   * 2) VITE_DEPLOY_CHANNEL 기반 맵핑
   * 3) 그 외: production이면 /RCTS/, dev면 /
   */
  const explicitBase = (env.VITE_BASE ?? "").trim();
  const channel = (env.VITE_DEPLOY_CHANNEL ?? "").trim().toLowerCase();

  /**
   * 경로 정책
   *
   * - prod (메인 RCTS repo pages):     /RCTS/
   * - test/preview/staging/beta:       ./      (여러 repo에서 재사용 가능한 상대 base)
   * - dev/local:                       /       (로컬 개발)
   *
   * ⚠️ test/preview/staging 번들은 RCTS_Test, RCTS_Preview 등
   *    여러 GitHub Pages repo에서 그대로 재사용해야 하므로
   *    "/RCTS_Test/" 처럼 repo 이름 고정 base 를 쓰지 않고 "./" 를 사용한다.
   */
  const channelBaseMap = {
    prod: "/RCTS/",
    production: "/RCTS/",
    main: "/RCTS/",

    // ✅ 공유 아티팩트 채널: 상대 base
    test: "./",
    rcts_test: "./",
    "rcts-test": "./",
    rcts_source_test: "./",

    preview: "./",
    rcts_preview: "./",
    "rcts-preview": "./",

    staging: "./",
    rcts_staging: "./",
    "rcts-staging": "./",

    beta: "./",

    // 개발 계열
    dev: "/",
    local: "/",
  };

  const computedBase =
    channelBaseMap[channel] ?? (mode === "production" ? "/RCTS/" : "/");

  // 1순위: VITE_BASE 직접 주입, 없으면 채널기반/기본값
  const base = normalizeBase(explicitBase || computedBase);

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // 앱 코드에서 채널 분기를 하고 싶을 때 사용 (빌드 타임 상수)
      __DEPLOY_CHANNEL__: JSON.stringify(channel || mode || ""),
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      watch: { usePolling: true },
    },
  };
});
