import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const COOLDOWN_SECONDS = 60;
const POLL_INTERVAL_MS = 3000;

export default function VerifyEmail() {
  const { currentUser, logout, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const pollRef = useRef(null);
  const [checking, setChecking] = useState(false);

  // ── Polling otomatis tiap 3 detik ──
  useEffect(() => {
    if (!currentUser) return;

    // Sudah verified saat halaman dimuat
    if (currentUser.emailVerified) {
      redirectToLogin();
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          clearInterval(pollRef.current);
          redirectToLogin();
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function redirectToLogin() {
    logout().then(() => {
      navigate("/login", {
        state: {
          verifiedMessage: "Email berhasil diverifikasi! Silakan masuk dengan akunmu. 🎉",
        },
      });
    });
  }

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (cooldown > 0 || !currentUser) return;
    try {
      await resendVerificationEmail();
      startCooldown();
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        alert("Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.");
      } else {
        alert("Gagal mengirim ulang. Coba lagi.");
      }
    }
  }

  async function handleManualCheck() {
    setChecking(true);
    try {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        clearInterval(pollRef.current);
        redirectToLogin();
      } else {
        alert("Email belum diverifikasi. Cek inbox atau folder spam-mu.");
      }
    } catch (_) {
      alert("Gagal mengecek. Coba lagi.");
    }
    setChecking(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-deco" aria-hidden />
      <div className="auth-card card slide-up" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>📧</div>
        <h1 className="auth-title">Cek Emailmu</h1>
        <p className="auth-sub" style={{ marginBottom: 8 }}>
          Kami mengirim link verifikasi ke<br />
          <strong style={{ color: "var(--rose)" }}>{currentUser?.email}</strong>
        </p>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: 28 }}>
          Klik link di email tersebut — kamu akan otomatis diarahkan ke halaman login.
        </p>

        {/* Indikator polling aktif */}
        <div className="verify-polling-indicator">
          <span className="verify-pulse" />
          Menunggu verifikasi secara otomatis…
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>

          {/* Kirim ulang + cooldown */}
          <button
            className="btn btn-secondary"
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0
              ? `⏳ Kirim Ulang (${cooldown}d)`
              : "📨 Kirim Ulang Email Verifikasi"}
          </button>

          {cooldown > 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: -6 }}>
              Bisa kirim ulang lagi dalam {cooldown} detik
            </p>
          )}

          {/* Cek manual sebagai backup */}
          <button
            className="btn btn-ghost"
            onClick={handleManualCheck}
            disabled={checking}
          >
            {checking ? "Mengecek…" : "🔄 Cek Manual"}
          </button>

          <button
            className="btn btn-ghost"
            style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}
            onClick={() => { logout(); navigate("/login"); }}
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
