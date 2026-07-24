import { useEffect, useState } from "react";
import { API_BASE } from "./api";

interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  created_at: string;
}
interface AdminEvent {
  kind: "signup" | "login" | "google";
  email: string | null;
  nickname: string | null;
  at: string;
}
interface Overview {
  stats: {
    total_users: number;
    today_signups: number;
    total_logins: number;
    logins_today: number;
  };
  users: AdminUser[];
  events: AdminEvent[];
}

const KEY_STORE = "admin.key";
const KIND_LABEL: Record<string, string> = {
  signup: "회원가입",
  login: "이메일 로그인",
  google: "구글 로그인",
};

export function AdminPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORE) ?? "");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(k: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`, {
        headers: { "X-Admin-Key": k },
      });
      if (res.status === 401) {
        setError("비밀번호가 올바르지 않습니다.");
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as Overview;
      setData(d);
      setAuthed(true);
      sessionStorage.setItem(KEY_STORE, k);
    } catch {
      setError("서버와 연결할 수 없어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  // 세션에 키가 있으면 자동 로그인
  useEffect(() => {
    if (key) load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 상태면 20초마다 자동 새로고침
  useEffect(() => {
    if (!authed) return;
    const iv = setInterval(() => load(key), 20_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, key]);

  if (!authed) {
    return (
      <div className="admin-gate">
        <div className="admin-card">
          <div className="admin-logo">
            <span className="logo-mark">K</span> 창업메이트 관리자
          </div>
          <p className="admin-sub">이용 현황을 보려면 관리자 비밀번호를 입력하세요.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(key);
            }}
          >
            <input
              className="admin-input"
              type="password"
              placeholder="관리자 비밀번호"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
            />
            <button className="btn primary" type="submit" disabled={busy || !key}>
              {busy ? "확인 중…" : "입장"}
            </button>
          </form>
          {error && <p className="admin-err">{error}</p>}
          <a className="admin-back" href="/">
            ← 서비스로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  const s = data?.stats;
  return (
    <div className="admin-wrap">
      <header className="admin-head">
        <div className="admin-logo">
          <span className="logo-mark">K</span> 창업메이트 관리자
        </div>
        <div className="admin-head-right">
          <span className="admin-live">
            <span className="dot" /> 20초마다 자동 갱신
          </span>
          <button className="btn" onClick={() => load(key)} disabled={busy}>
            새로고침
          </button>
          <button
            className="link-mut"
            onClick={() => {
              sessionStorage.removeItem(KEY_STORE);
              setAuthed(false);
              setKey("");
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="admin-body">
        <div className="stat-grid">
          <Stat label="총 가입 회원" value={s?.total_users ?? 0} accent="blue" />
          <Stat label="오늘 가입" value={s?.today_signups ?? 0} accent="green" />
          <Stat label="누적 로그인" value={s?.total_logins ?? 0} accent="ink" />
          <Stat label="오늘 로그인" value={s?.logins_today ?? 0} accent="amber" />
        </div>

        <div className="admin-cols">
          <section className="admin-panel">
            <h3>
              가입 회원 <span className="cnt">{data?.users.length ?? 0}</span>
            </h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>닉네임</th>
                    <th>이메일</th>
                    <th>가입일시</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.users ?? []).map((u) => (
                    <tr key={u.id}>
                      <td className="mut">{u.id}</td>
                      <td>{u.nickname}</td>
                      <td className="mono">{u.email}</td>
                      <td className="mut">{u.created_at}</td>
                    </tr>
                  ))}
                  {data && data.users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty">
                        아직 가입한 회원이 없어요
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel">
            <h3>
              최근 이용 이벤트 <span className="cnt">{data?.events.length ?? 0}</span>
            </h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>사용자</th>
                    <th>일시</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.events ?? []).map((e, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`kind-chip k-${e.kind}`}>{KIND_LABEL[e.kind] ?? e.kind}</span>
                      </td>
                      <td>
                        {e.nickname ? `${e.nickname} ` : ""}
                        <span className="mono mut">{e.email}</span>
                      </td>
                      <td className="mut">{e.at}</td>
                    </tr>
                  ))}
                  {data && data.events.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty">
                        아직 이용 기록이 없어요
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <p className="admin-note">
          ※ 현재 회원 DB는 서버리스 임시 저장소(/tmp)라 서버 인스턴스가 재활용되면 초기화됩니다. 영구
          보관이 필요하면 외부 DB(Supabase/Postgres) 연동이 필요해요.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`stat-tile accent-${accent}`}>
      <div className="stat-value">{value.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
