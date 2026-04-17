import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

const COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = { current: null };

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);

    // actionCodeSettings agar link reset redirect ke halaman kita
    const actionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    };

    try {
      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
      setSent(true);
      startCooldown();
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        // Tetap tampilkan pesan sukses demi keamanan (tidak bocorkan apakah email terdaftar)
        setSent(true);
        startCooldown();
      } else if (err.code === "auth/too-many-requests") {
        setError("Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.");
        startCooldown();
      } else {
        setError("Gagal mengirim email. Coba lagi.");
      }
    }
    setLoading(false);
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setSent(false);
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-deco" aria-hidden />
      <div className="auth-card card slide-up">
        <div className="auth-brand">🔑</div>
        <h1 className="auth-title">Lupa Password</h1>
        <p className="auth-sub">
          {sent
            ? "Cek emailmu untuk link reset password"
            : "Masukkan emailmu dan kami akan kirim link untuk reset password"}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {sent ? (
          /* State: email sudah terkirim */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📬</div>
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              ✅ Link reset password sudah dikirim ke <strong>{email}</strong>.<br />
              Cek inbox atau folder spam-mu.
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: 20 }}>
              Link akan kadaluarsa dalam 1 jam. Klik link tersebut untuk membuat password baru.
            </p>

            {/* Kirim ulang dengan cooldown */}
            <button
              className="btn btn-secondary"
              style={{ width: "100%", marginBottom: 8 }}
              onClick={handleResend}
              disabled={cooldown > 0}
            >
              {cooldown > 0
                ? `⏳ Kirim Ulang (${cooldown}d)`
                : "📨 Kirim Ulang"}
            </button>

            {cooldown > 0 && (
              <div className="verify-cooldown-bar-wrap" style={{ marginBottom: 16 }}>
                <div
                  className="verify-cooldown-bar"
                  style={{ width: `${(cooldown / COOLDOWN_SECONDS) * 100}%` }}
                />
                <span className="verify-cooldown-label">
                  Bisa kirim ulang dalam {cooldown} detik
                </span>
              </div>
            )}
          </div>
        ) : (
          /* State: form input email */
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Terdaftar</label>
              <input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Mengirim…" : "Kirim Link Reset Password"}
            </button>
          </form>
        )}

        <p className="auth-footer" style={{ marginTop: 20 }}>
          <Link to="/login">← Kembali ke Login</Link>
        </p>
      </div>
    </div>
  );
}
