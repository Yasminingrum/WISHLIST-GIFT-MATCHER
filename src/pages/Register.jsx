import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

  return (
    <div className="auth-page">
      <div className="auth-deco" aria-hidden />
      <div className="auth-card card slide-up">
        <div className="auth-brand">🎁</div>
        <h1 className="auth-title">Buat Akun</h1>
        <p className="auth-sub">Mulai kelola wishlist hadiahmu</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Tampilan</label>
            <input name="displayName" placeholder="Nama lengkapmu" value={form.displayName}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" placeholder="email@contoh.com" value={form.email}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="Min. 6 karakter" value={form.password}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input name="confirm" type="password" placeholder="Ulangi password" value={form.confirm}
              onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}
            disabled={loading}>
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
