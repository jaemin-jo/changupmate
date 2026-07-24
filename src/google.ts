/** Google Identity Services 로더 + 액세스 토큰 팝업 (본진 frontend/src/api/google.ts와 동일 로직). */

interface TokenResponse {
  access_token?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
            error_callback?: (err: { type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

/** 광고 차단기(uBlock 등)가 구글 스크립트를 막았을 때 던지는 특수 에러 */
export class GoogleBlockedError extends Error {
  constructor() {
    super(
      "광고 차단기(uBlock Origin 등)가 구글 로그인을 막고 있어요. 이 사이트에서 차단기를 잠시 꺼주시거나, 아래 이메일 로그인을 이용해 주세요.",
    );
    this.name = "GoogleBlockedError";
  }
}

/** 카카오톡·인스타 등 인앱 브라우저에서 구글 로그인 시도 시 (구글이 WebView OAuth 차단) */
export class InAppBrowserError extends Error {
  constructor() {
    super("인앱 브라우저에서는 구글 로그인이 제한돼요.");
    this.name = "InAppBrowserError";
  }
}

/** 카카오톡/인스타/페북/네이버/라인 등 인앱 브라우저(WebView) 감지 */
export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || "";
  return /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER\(inapp|DaumApps|SamsungBrowser\/.*wv|; wv\)|Snapchat|Twitter/i.test(
    ua,
  );
}

export function inAppName(): string {
  const ua = navigator.userAgent || "";
  if (/KAKAOTALK/i.test(ua)) return "카카오톡";
  if (/Instagram/i.test(ua)) return "인스타그램";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "페이스북";
  if (/NAVER/i.test(ua)) return "네이버 앱";
  if (/Line\//i.test(ua)) return "라인";
  return "인앱";
}

/** 인앱 브라우저에서 시스템 기본 브라우저(크롬/사파리)로 현재 페이지 열기 */
export function openInExternalBrowser(url: string): void {
  const ua = navigator.userAgent || "";
  if (/KAKAOTALK/i.test(ua)) {
    // 카카오톡 전용 스킴 — 시스템 브라우저로 강제 오픈
    window.location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
    return;
  }
  if (/Line\//i.test(ua)) {
    window.location.href = url + (url.includes("?") ? "&" : "?") + "openExternalBrowser=1";
    return;
  }
  if (/Android/i.test(ua)) {
    // 안드로이드: 크롬 인텐트로 오픈
    const noScheme = url.replace(/^https?:\/\//, "");
    window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }
  // iOS 등: 강제 불가 → 사용자가 공유/메뉴로 직접 열어야 함 (안내는 배너에서)
}

const BLOCK_TIMEOUT_MS = 7000;

let scriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;

      // uBlock은 onerror 없이 조용히 매달리기도 해서 타임아웃으로도 차단을 감지
      const timer = setTimeout(() => {
        scriptPromise = null;
        reject(new GoogleBlockedError());
      }, BLOCK_TIMEOUT_MS);

      s.onload = () => {
        clearTimeout(timer);
        // 스크립트는 로드됐다 쳐도 실제 객체가 없으면 차단된 것
        if (window.google?.accounts?.oauth2) resolve();
        else {
          scriptPromise = null;
          reject(new GoogleBlockedError());
        }
      };
      s.onerror = () => {
        clearTimeout(timer);
        scriptPromise = null;
        reject(new GoogleBlockedError());
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export async function getGoogleAccessToken(clientId: string): Promise<string> {
  // 인앱 브라우저는 구글이 OAuth를 막으므로 시도 전에 차단 (헛된 대기 방지)
  if (isInAppBrowser()) throw new InAppBrowserError();
  await loadGisScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new GoogleBlockedError();

  return new Promise((resolve, reject) => {
    try {
      const client = oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (resp) => {
          if (resp.access_token) resolve(resp.access_token);
          else reject(new Error("구글 로그인이 취소되었어요."));
        },
        error_callback: (err) => {
          // 팝업이 아예 안 열리면 차단기/팝업차단 가능성
          if (err?.type === "popup_failed_to_open") reject(new GoogleBlockedError());
          else reject(new Error("구글 로그인 창이 닫혔어요. 다시 시도해 주세요."));
        },
      });
      client.requestAccessToken();
    } catch {
      reject(new GoogleBlockedError());
    }
  });
}
