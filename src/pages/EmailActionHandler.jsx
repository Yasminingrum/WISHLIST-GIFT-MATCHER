import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

export default function EmailActionHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | resetForm | success | error
  const [errorMsg, setErrorMsg] = useState("");

  // State untuk form reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [oobCodeState, setOobCodeState] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (!mode || !oobCode) {
      setStatus("error");
      setErrorMsg("Link tidak valid atau sudah kadaluarsa.");
      return;
    }

    if (mode === "verifyEmail") {
      handleVerifyEmail(oobCode);
    } else if (mode === "resetPassword") {
      handleResetPasswordInit(oobCode);
    } else {
      setStatus("error");
      setErrorMsg("Aksi tidak dikenali.");
    }
  }, []);

  // ── Verifikasi Email ──
  async function handleVerifyEmail(oobCode) {
    try {
      await applyActionCode(auth, oobCode);
      navigate("/login", {
        replace: true,
        state: {
          verifiedMessage: "Email berhasil diverifikasi! Silakan masuk dengan akunmu. 🎉",
        },
      });
    } catch (err) {
      if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
        setErrorMsg("Link verifikasi sudah digunakan atau kadaluarsa. Silakan minta link baru.");
      } else {
        setErrorMsg("Gagal memverifikasi email. Coba lagi.");
      }
      setStatus("error");
    }
  }

  // ── Reset Password: validasi kode dulu, tampilkan form ──
  async function handleResetPasswordInit(oobCode) {
    try {
      const email = await verifyPasswordResetCode(auth, oobCode);
      setResetEmail(email);
      setOobCodeState(oobCode);
      setStatus("resetForm");
    } catch (err) {
      if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
        setErrorMsg("Link reset password sudah kadaluarsa atau sudah digunakan. Silakan minta link baru.");
      } else {
        setErrorMsg("Link tidak valid. Silakan minta link reset password baru.");
      }
      setStatus("error");
    }
  }

  // ── Reset Password: submit password baru ──
  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetError("");
    if (newPassword.length < 6) return setResetError("Password minimal 6 karakter.");
    if (newPassword !== confirmPassword) return setResetError("Password tidak cocok.");

    setResetting(true);
    try {
      await confirmPasswordReset(auth, oobCodeState, newPassword);
      navigate("/login", {
        replace: true,
        state: {
          verifiedMessage: "Password berhasil direset! Silakan masuk dengan password barumu. 🔑",
        },
      });
    } catch (err) {
      if (err.code === "auth/weak-password") {
        setResetError("Password terlalu lemah. Gunakan minimal 6 karakter.");
      } else {
        setResetError("Gagal mereset password. Link mungkin sudah kadaluarsa.");
      }
    }
    setResetting(false);
  }

  // ── UI: Loading ──
  if (status === "loading") {
    return (
      <div className="auth-page">
        <div className="auth-card card slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>⏳</div>
          <h1 className="auth-title">Memproses…</h1>
          <p className="auth-sub">Mohon tunggu sebentar.</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <div style={{
              width: 36, height: 36,
              border: "3px solid var(--blush)",
              borderTopColor: "var(--rose)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── UI: Form Reset Password ──
  if (status === "resetForm") {
    return (
      <div className="auth-page">
        <div className="auth-deco" aria-hidden />
        <div className="auth-card card slide-up">
          <div className="auth-brand">🔑</div>
          <h1 className="auth-title">Password Baru</h1>
          <p className="auth-sub">
            Buat password baru untuk <strong style={{ color: "var(--rose)" }}>{resetEmail}</strong>
          </p>

          {resetError && <div className="alert alert-error">{resetError}</div>}

          <form onSubmit={handleResetSubmit}>
            <div className="form-group">
              <label>Password Baru</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: "1.1rem",
                    color: "var(--ink-soft)",
                  }}
                  tabIndex={-1}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Konfirmasi Password Baru</label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Password strength indicator */}
            {newPassword && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  height: 4, borderRadius: 4, background: "var(--blush)",
                  overflow: "hidden", marginBottom: 4,
                }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    transition: "width 0.3s ease, background 0.3s ease",
                    width: newPassword.length < 6 ? "33%" : newPassword.length < 10 ? "66%" : "100%",
                    background: newPassword.length < 6 ? "var(--rose)" : newPassword.length < 10 ? "var(--gold)" : "var(--mint)",
                  }} />
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  Kekuatan: {newPassword.length < 6 ? "Lemah" : newPassword.length < 10 ? "Sedang" : "Kuat"}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={resetting}
            >
              {resetting ? "Menyimpan…" : "Simpan Password Baru"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── UI: Error ──
  return (
    <div className="auth-page">
      <div className="auth-deco" aria-hidden />
      <div className="auth-card card slide-up" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>❌</div>
        <h1 className="auth-title">Link Tidak Valid</h1>
        <p className="auth-sub" style={{ marginBottom: 24 }}>{errorMsg}</p>
        <button
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          onClick={() => navigate("/login")}
        >
          Kembali ke Login
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => navigate("/forgot-password")}
        >
          Minta Link Baru
        </button>
      </div>
    </div>
  );
}
