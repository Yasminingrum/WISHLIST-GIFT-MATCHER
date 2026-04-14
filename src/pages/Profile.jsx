import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateUserProfile, getWishlistsByOwner } from "../utils/db";
import "./Profile.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ displayName: "", bio: "", photoURL: "" });
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    async function load() {
      setLoadError("");
      try {
        const [p, wls] = await Promise.all([
          getUserProfile(currentUser.uid),
          getWishlistsByOwner(currentUser.uid),
        ]);
        setProfile(p);
        setWishlists(wls);
        setForm({
          displayName: p?.displayName || currentUser.displayName || "",
          bio: p?.bio || "",
          photoURL: p?.photoURL || "",
        });
      } catch (err) {
        console.error("Gagal load profil:", err);
        setLoadError("Gagal memuat data. Periksa koneksi dan coba lagi.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert("Gagal menyimpan profil.");
    }
    setSaving(false);
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  if (loadError) return (
    <div className="container fade-in">
      <div className="page-header"><h1>Profil Saya</h1></div>
      <div className="alert alert-error">{loadError}</div>
    </div>
  );

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Profil Saya</h1>
        <p>Kelola informasi akunmu</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          👤 Profil
        </button>
        <button className={`profile-tab ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
          📊 Statistik
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="profile-content fade-in">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {form.photoURL ? (
                <img src={form.photoURL} alt="Foto profil" />
              ) : (
                <span>{(form.displayName || "?")[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="profile-name">{form.displayName || "Pengguna"}</h2>
              <p className="profile-email">📧 {currentUser.email}</p>
              <span className={`badge ${currentUser.emailVerified ? "badge-mint" : "badge-rose"}`}>
                {currentUser.emailVerified ? "✓ Email Terverifikasi" : "⚠ Belum Diverifikasi"}
              </span>
            </div>
          </div>

          <div className="profile-form card">
            <h3 style={{ marginBottom: 24 }}>Edit Profil</h3>
            {saveSuccess && <div className="alert alert-success">Profil berhasil disimpan! ✓</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nama Tampilan</label>
                <input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} placeholder="Nama lengkapmu" required />
              </div>
              <div className="form-group">
                <label>URL Foto Profil</label>
                <input value={form.photoURL} onChange={(e) => setForm((f) => ({ ...f, photoURL: e.target.value }))} placeholder="https://..." type="url" />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Ceritakan sedikit tentang dirimu…" rows={3} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="profile-content fade-in">
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-icon">🎁</div>
              <div className="stat-num">{wishlists.length}</div>
              <div className="stat-desc">Total Wishlist</div>
            </div>
            <div className="stat-card card">
              <div className="stat-icon">🌍</div>
              <div className="stat-num">{wishlists.filter((w) => w.isPublic).length}</div>
              <div className="stat-desc">Wishlist Publik</div>
            </div>
          </div>
          {wishlists.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ marginBottom: 16 }}>Daftar Wishlistmu</h3>
              <div className="stats-wl-list">
                {wishlists.map((wl) => (
                  <div key={wl.id} className="stats-wl-row card">
                    <div>
                      <strong>{wl.title}</strong>
                      {wl.eventDate && <span className="wl-date"> — {wl.eventDate}</span>}
                    </div>
                    <span className={`badge ${wl.isPublic ? "badge-mint" : "badge-soft"}`}>
                      {wl.isPublic ? "Publik" : "Privat"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
