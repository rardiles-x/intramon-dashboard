import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

type LocalUser = {
  username: string;
  passwordHash: string;
  name: string;
  role: string;
  active: boolean;
};

type AuthSession = {
  username: string;
  name: string;
  role: string;
  expiresAt: number;
};

const SESSION_KEY = "monster-local-auth-session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const USERS: readonly LocalUser[] = [
  {
    username: "admin",
    passwordHash:
      "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
    name: "Administrator",
    role: "admin",
    active: true,
  },
  {
    username: "tamu",
    passwordHash:
      "3b8cd3da133887e38bcdaf4f098c701567f6e4e8460197bf8537ced9c3507f7f",
    name: "Operator",
    role: "tamu",
    active: true,
  },
];

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (
      typeof parsed.username !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    const user = USERS.find(
      (candidate) =>
        candidate.username === parsed.username &&
        candidate.active,
    );

    if (!user) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return {
      username: parsed.username,
      name: parsed.name,
      role: parsed.role,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(user: LocalUser): AuthSession {
  const session: AuthSession = {
    username: user.username,
    name: user.name,
    role: user.role,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  window.sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session),
  );

  return session;
}

export default function LocalAuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<AuthSession | null>(() => readSession());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const currentUser = useMemo(() => {
    if (!session) {
      return null;
    }

    return USERS.find(
      (user) =>
        user.username === session.username &&
        user.active,
    ) ?? null;
  }, [session]);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setChecking(true);
    setError("");

    try {
      const passwordHash = await sha256Hex(password);
      const user = USERS.find(
        (candidate) =>
          candidate.active &&
          candidate.username.toLowerCase() === normalizedUsername &&
          candidate.passwordHash === passwordHash,
      );

      if (!user) {
        setError("Username atau password salah.");
        return;
      }

      setSession(writeSession(user));
      setPassword("");
    } catch {
      setError(
        "Browser tidak dapat memproses autentikasi. Muat ulang halaman.",
      );
    } finally {
      setChecking(false);
    }
  };

  const logout = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  if (session && currentUser) {
    return (
      <>
        <div className="monster-local-session">
          <span className="monster-local-session-user">
            <strong>{session.name}</strong>
            <small>{session.role}</small>
          </span>

          <button
            type="button"
            onClick={logout}
            title="Keluar dari MONSTER"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>

        {children}
      </>
    );
  }

  return (
    <main className="monster-local-login-page">
      <section
        className="monster-local-login-card"
        aria-labelledby="monster-local-login-title"
      >
        <div className="monster-local-login-brand">
          <span className="monster-local-login-logo">
            <ShieldCheck size={30} />
          </span>

          <div>
            <span>MONSTER</span>
            <small>
              Monitoring Sistem Proteksi Terintegrasi
            </small>
          </div>
        </div>

        <div className="monster-local-login-copy">
          <h1 id="monster-local-login-title">
            Masuk ke Dashboard
          </h1>
          <p>Smart Monitoring for Reliable Protection</p>
        </div>

        <form
          className="monster-local-login-form"
          onSubmit={handleLogin}
        >
          <label>
            <span>Username</span>

            <div className="monster-local-login-input">
              <UserRound size={18} />

              <input
                autoComplete="username"
                autoFocus
                disabled={checking}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Masukkan username"
                type="text"
                value={username}
              />
            </div>
          </label>

          <label>
            <span>Password</span>

            <div className="monster-local-login-input">
              <LockKeyhole size={18} />

              <input
                autoComplete="current-password"
                disabled={checking}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Masukkan password"
                type={showPassword ? "text" : "password"}
                value={password}
              />

              <button
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
                className="monster-local-password-toggle"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                tabIndex={-1}
                type="button"
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </label>

          {error && (
            <div
              className="monster-local-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            className="monster-local-login-submit"
            disabled={checking}
            type="submit"
          >
            {checking ? (
              <>
                <LoaderCircle
                  className="monster-local-login-spinner"
                  size={18}
                />
                Memeriksa...
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Masuk
              </>
            )}
          </button>
        </form>

        <footer>
          Akses hanya untuk pengguna terdaftar.
        </footer>
      </section>
    </main>
  );
}
