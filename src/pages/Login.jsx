import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
        || err.code === "auth/invalid-credential") {
        setError("Email atau password salah.");
      } else {
        setError("Gagal masuk. Coba lagi.");
      }
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-deco" aria-hidden />
      <div className="auth-card card slide-up">
        <div className="auth-brand">🎁</div>
        <h1 className="auth-title">Selamat Datang</h1>
        <p className="auth-sub">Masuk ke akunmu</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" placeholder="email@contoh.com" value={form.email}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="Password" value={form.password}
              onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}
            disabled={loading}>
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <p className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar gratis</Link>
        </p>
      </div>
    </div>
  );
}
