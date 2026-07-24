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
