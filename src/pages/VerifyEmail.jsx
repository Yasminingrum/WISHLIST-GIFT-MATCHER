import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  async function resend() {
    try {
      await sendEmailVerification(currentUser);
      setSent(true);
    } catch {
      alert("Tunggu sebentar sebelum mengirim ulang.");
    }
  }

  async function checkVerification() {
    setChecking(true);
    await currentUser.reload();
    if (currentUser.emailVerified) {
      navigate("/dashboard");
    } else {
      alert("Email belum diverifikasi. Cek inbox atau folder spam-mu.");
    }
    setChecking(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-deco" aria-hidden />
      <div className="auth-card card slide-up" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>📧</div>
        <h1 className="auth-title">Cek Emailmu</h1>
        <p className="auth-sub" style={{ marginBottom: 12 }}>
          Kami mengirim link verifikasi ke<br />
          <strong style={{ color: "var(--rose)" }}>{currentUser?.email}</strong>
        </p>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: 28 }}>
          Klik link di email tersebut, lalu kembali ke sini.
        </p>

        {sent && (
          <div className="alert alert-success">Email verifikasi sudah dikirim ulang ✓</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn btn-primary btn-lg" onClick={checkVerification} disabled={checking}>
            {checking ? "Mengecek…" : "Sudah Verifikasi ✓"}
          </button>
          <button className="btn btn-secondary" onClick={resend}>
            Kirim Ulang Email
          </button>
          <button className="btn btn-ghost" onClick={() => { logout(); navigate("/login"); }}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
