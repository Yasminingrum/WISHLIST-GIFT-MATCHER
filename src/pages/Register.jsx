import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Password tidak cocok.");
    if (form.password.length < 6) return setError("Password minimal 6 karakter.");
    setError("");
    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName);
      navigate("/verify-email");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("Email sudah terdaftar.");
      else if (err.code === "auth/invalid-email") setError("Format email tidak valid.");
      else setError("Gagal mendaftar. Coba lagi.");
    }
    setLoading(false);
  }

  async function handleGoogleRegister() {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Pendaftaran dibatalkan.");
      } else {
        setError("Gagal daftar dengan Google. Coba lagi.");
      }
    }
    setGoogleLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-deco" aria-hidden />
      <div className="auth-card card slide-up">
        <div className="auth-brand">🎁</div>
        <h1 className="auth-title">Buat Akun</h1>
        <p className="auth-sub">Mulai kelola wishlist hadiahmu</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Google Register Button */}
        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleRegister}
          disabled={googleLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? "Menghubungkan…" : "Daftar dengan Google"}
        </button>

        <div className="auth-divider">
          <span>atau daftar dengan email</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Tampilan</label>
            <input
              name="displayName"
              placeholder="Nama lengkapmu"
              value={form.displayName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="email@contoh.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Min. 6 karakter"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input
              name="confirm"
              type="password"
              placeholder="Ulangi password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Mendaftar…" : "Daftar Sekarang"}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
