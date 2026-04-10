import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="container hero-content">
          <div className="hero-eyebrow">✨ Platform Wishlist Hadiah #1</div>
          <h1 className="hero-title">
            Hadiah yang <em>benar-benar</em><br />
            diinginkan
          </h1>
          <p className="hero-sub">
            Buat daftar keinginan hadiahmu, bagikan ke orang-orang tercinta,
            dan biarkan mereka mengklaim — tanpa spoiler, tanpa hadiah ganda.
          </p>
          <div className="hero-cta">
            {currentUser ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Buka Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Mulai Gratis 🎁
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sudah punya akun
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Cara kerjanya</h2>
          <div className="features-grid">
            {[
              { icon: "📝", title: "Buat Wishlist", desc: "Tambah item hadiah dengan nama, harga, dan link toko online." },
              { icon: "🔗", title: "Bagikan Link", desc: "Set wishlist ke publik dan bagikan link ke teman & keluarga." },
              { icon: "🎁", title: "Klaim Hadiah", desc: "Pemberi hadiah mengklaim item — tidak ada pembelian ganda!" },
              { icon: "🤫", title: "Kejutan Terjaga", desc: "Pemilik tidak tahu siapa yang mengklaim apa. Rahasia aman!" },
            ].map((f) => (
              <div key={f.title} className="feature-card card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="cta-section">
        <div className="container cta-inner">
          <h2>Siap berbagi kebahagiaan? 🎉</h2>
          <p>Gratis selamanya. Tidak perlu kartu kredit.</p>
          {!currentUser && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Daftar Sekarang
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
