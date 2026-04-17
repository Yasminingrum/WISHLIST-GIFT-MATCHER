import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, getWishlistsByOwner } from "../utils/db";
import "./Profile.css";

export default function Profile() {
  const { currentUser, updateUserProfile, deleteAccount, logout } = useAuth();
  const [form, setForm] = useState({ displayName: "", bio: "", photoURL: "" });
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Hapus akun state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  // Apakah user login via Google (tidak punya password)
  const isGoogleUser = currentUser?.providerData?.some(
    (p) => p.providerId === "google.com"
  );

  useEffect(() => {
    async function load() {
      setLoadError("");
      try {
        const [p, wls] = await Promise.all([
          getUserProfile(currentUser.uid),
          getWishlistsByOwner(currentUser.uid),
        ]);
        setWishlists(wls);
        setForm({
          displayName: p?.displayName || currentUser.displayName || "",
          bio: p?.bio || "",
          photoURL: p?.photoURL || currentUser.photoURL || "",
        });
      } catch (err) {
        console.error("Gagal load profil:", err);
        setLoadError("Gagal memuat data. Periksa koneksi dan coba lagi.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser.uid]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Panggil updateUserProfile dari AuthContext (bukan db.js langsung)
      // agar Firebase Auth displayName ikut terupdate dan Dashboard langsung segar
      await updateUserProfile(currentUser.uid, form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Gagal simpan profil:", err);
      alert("Gagal menyimpan profil. Coba lagi.");
    }
    setSaving(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "HAPUS") {
      alert('Ketik "HAPUS" untuk mengonfirmasi penghapusan akun.');
      return;
    }
    if (!isGoogleUser && !deletePassword) {
      alert("Masukkan password untuk mengonfirmasi.");
      return;
    }
    if (!window.confirm("Yakin ingin menghapus akun? Semua data akan hilang permanen.")) return;

    setDeleting(true);
    try {
      await deleteAccount(isGoogleUser ? null : deletePassword);
      // Setelah deleteUser, onAuthStateChanged akan otomatis trigger logout
    } catch (err) {
      console.error("Gagal hapus akun:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        alert("Password salah. Coba lagi.");
      } else if (err.code === "auth/requires-recent-login") {
        alert("Sesi terlalu lama. Silakan logout lalu login ulang, kemudian coba hapus akun lagi.");
      } else {
        alert("Gagal menghapus akun: " + err.message);
      }
    }
    setDeleting(false);
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
        <p>Kelola informasi dan pengaturan akunmu</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          👤 Profil
        </button>
        <button className={`profile-tab ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
          📊 Statistik
        </button>
        <button className={`profile-tab ${activeTab === "guide" ? "active" : ""}`} onClick={() => setActiveTab("guide")}>
          📖 Panduan
        </button>
        <button className={`profile-tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
          ⚙️ Pengaturan
        </button>
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div className="profile-content fade-in">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {form.photoURL ? (
                <img src={form.photoURL} alt="Foto profil" />
              ) : (
                <span>{(form.displayName || currentUser.email || "?")[0].toUpperCase()}</span>
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
            {saveSuccess && (
              <div className="alert alert-success">
                ✓ Profil berhasil disimpan! Nama di dashboard sudah diperbarui.
              </div>
            )}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nama Tampilan</label>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Nama lengkapmu"
                  required
                />
              </div>
              <div className="form-group">
                <label>URL Foto Profil</label>
                <input
                  value={form.photoURL}
                  onChange={(e) => setForm((f) => ({ ...f, photoURL: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Ceritakan sedikit tentang dirimu…"
                  rows={3}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Stats Tab ── */}
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
            <div className="stat-card card">
              <div className="stat-icon">🔒</div>
              <div className="stat-num">{wishlists.filter((w) => !w.isPublic).length}</div>
              <div className="stat-desc">Wishlist Privat</div>
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

      {/* ── Guide Tab ── */}
      {activeTab === "guide" && (
        <div className="profile-content fade-in">
          <div className="guide-section">
            <h3 className="guide-title">📖 Panduan Penggunaan</h3>
            <p className="guide-subtitle">Pelajari cara memaksimalkan Wishlist &amp; Gift Matcher</p>

            <div className="guide-cards">
              <div className="guide-card card">
                <div className="guide-step">1</div>
                <div className="guide-card-body">
                  <h4>Buat Wishlist</h4>
                  <p>Pergi ke <strong>Dashboard</strong> → klik <em>"+ Buat Wishlist"</em>. Isi judul, tanggal acara (opsional), dan deskripsi. Pilih <em>Publik</em> agar orang lain bisa melihat dan mengklaim hadiah.</p>
                </div>
              </div>

              <div className="guide-card card">
                <div className="guide-step">2</div>
                <div className="guide-card-body">
                  <h4>Tambah Item Hadiah</h4>
                  <p>Buka wishlist → klik <em>"+ Tambah Item"</em>. Isi nama hadiah, estimasi harga, link toko (opsional), dan prioritas. Item akan langsung muncul di halaman publik.</p>
                </div>
              </div>

              <div className="guide-card card">
                <div className="guide-step">3</div>
                <div className="guide-card-body">
                  <h4>Bagikan Link Wishlist</h4>
                  <p>Klik tombol <em>"Salin Link"</em> di detail wishlist. Bagikan link tersebut ke keluarga atau teman. Mereka bisa mengklaim hadiah tanpa perlu login.</p>
                </div>
              </div>

              <div className="guide-card card">
                <div className="guide-step">4</div>
                <div className="guide-card-body">
                  <h4>Klaim Hadiah (untuk Pemberi Hadiah)</h4>
                  <p>Buka link wishlist → pilih hadiah yang ingin dibeli → klik <em>"Klaim"</em> → isi nama dan email. Identitas pengklaim disembunyikan agar kejutan tetap terjaga 🎉</p>
                </div>
              </div>

              <div className="guide-card card">
                <div className="guide-step">5</div>
                <div className="guide-card-body">
                  <h4>Pesan &amp; Ucapan</h4>
                  <p>Pemberi hadiah bisa meninggalkan pesan ucapan di halaman publik wishlist. Kamu bisa membaca dan membalas pesan di menu <strong>Pesan Ucapan</strong> di navbar.</p>
                </div>
              </div>

              <div className="guide-card card">
                <div className="guide-step">6</div>
                <div className="guide-card-body">
                  <h4>Update Profil</h4>
                  <p>Di halaman ini, tab <em>Profil</em>, kamu bisa mengubah nama tampilan, foto profil (via URL), dan bio. Perubahan nama akan langsung terlihat di Dashboard setelah disimpan.</p>
                </div>
              </div>
            </div>

            <div className="guide-tips card">
              <h4>💡 Tips &amp; Trik</h4>
              <ul>
                <li>Set prioritas item sebagai <em>Tinggi</em> untuk hadiah yang paling kamu inginkan.</li>
                <li>Gunakan field <em>Link Toko</em> agar pemberi hadiah tahu persis produk mana yang ingin dibeli.</li>
                <li>Buat beberapa wishlist untuk acara yang berbeda (ulang tahun, pernikahan, lebaran, dll).</li>
                <li>Wishlist <em>Privat</em> tidak akan muncul di pencarian publik, hanya bisa diakses via link langsung.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === "settings" && (
        <div className="profile-content fade-in">
          <div className="settings-section">

            {/* Info Akun */}
            <div className="settings-card card">
              <h4>ℹ️ Informasi Akun</h4>
              <div className="settings-info-row">
                <span className="settings-label">Email</span>
                <span className="settings-value">{currentUser.email}</span>
              </div>
              <div className="settings-info-row">
                <span className="settings-label">Metode Login</span>
                <span className="settings-value">{isGoogleUser ? "🌐 Google" : "📧 Email & Password"}</span>
              </div>
              <div className="settings-info-row">
                <span className="settings-label">Status Email</span>
                <span className={`badge ${currentUser.emailVerified ? "badge-mint" : "badge-rose"}`}>
                  {currentUser.emailVerified ? "✓ Terverifikasi" : "⚠ Belum Diverifikasi"}
                </span>
              </div>
            </div>

            {/* Logout */}
            <div className="settings-card card">
              <h4>🚪 Keluar Akun</h4>
              <p className="settings-desc">Keluar dari sesi ini. Kamu bisa login kembali kapan saja.</p>
              <button className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            </div>

            {/* Hapus Akun */}
            <div className="settings-card card settings-danger-zone">
              <h4>🗑️ Hapus Akun</h4>
              <p className="settings-desc">
                Menghapus akun akan menghilangkan semua data profilmu secara permanen. Wishlist dan item yang sudah dibuat <strong>tidak</strong> akan otomatis terhapus dari database publik.
              </p>

              {!showDeleteForm ? (
                <button
                  className="btn btn-danger"
                  onClick={() => setShowDeleteForm(true)}
                >
                  Hapus Akun Saya
                </button>
              ) : (
                <div className="delete-confirm-form">
                  {!isGoogleUser && (
                    <div className="form-group">
                      <label>Password saat ini</label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Masukkan passwordmu"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Ketik <strong>HAPUS</strong> untuk mengonfirmasi</label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="HAPUS"
                    />
                  </div>
                  <div className="delete-actions">
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== "HAPUS"}
                    >
                      {deleting ? "Menghapus…" : "Konfirmasi Hapus Akun"}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => { setShowDeleteForm(false); setDeletePassword(""); setDeleteConfirmText(""); }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
