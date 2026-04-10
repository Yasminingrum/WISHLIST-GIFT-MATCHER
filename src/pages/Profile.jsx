import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, updateUserProfile, getWishlistsByOwner, listenMessages, deleteMessage, replyMessage } from "../utils/db";
import "./Profile.css";

export default function Profile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ displayName: "", bio: "", photoURL: "" });
  const [wishlists, setWishlists] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Reply state
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

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

  useEffect(() => {
    if (wishlists.length === 0) return;
    const unsubs = wishlists.map((wl) =>
      listenMessages(wl.id, (msgs) => {
        setAllMessages((prev) => {
          const filtered = prev.filter((m) => m.wishlistId !== wl.id);
          return [...filtered, ...msgs].sort((a, b) => b.createdAt - a.createdAt);
        });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [wishlists]);

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

  async function handleDeleteMessage(msgId) {
    if (!confirm("Hapus pesan ini?")) return;
    await deleteMessage(msgId);
    setAllMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function handleReply(msgId) {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyMessage(msgId, replyText.trim());
      setReplyingId(null);
      setReplyText("");
    } catch {
      alert("Gagal mengirim balasan.");
    }
    setSendingReply(false);
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
        <p>Kelola informasi akunmu dan baca pesan ucapan</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          👤 Profil
        </button>
        <button className={`profile-tab ${activeTab === "messages" ? "active" : ""}`} onClick={() => setActiveTab("messages")}>
          💌 Pesan Ucapan
          {allMessages.length > 0 && <span className="tab-badge">{allMessages.length}</span>}
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

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="profile-content fade-in">
          <h3 style={{ marginBottom: 20 }}>Pesan Ucapan Masuk</h3>
          {allMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💌</div>
              <h3>Belum ada pesan</h3>
              <p>Pesan ucapan dari pemberi hadiah akan muncul di sini.</p>
            </div>
          ) : (
            <div className="messages-list">
              {allMessages.map((msg) => {
                const wl = wishlists.find((w) => w.id === msg.wishlistId);
                const isReplying = replyingId === msg.id;
                return (
                  <div key={msg.id} className="message-card card">
                    <div className="msg-header">
                      <div className="msg-avatar">{msg.senderName[0]?.toUpperCase()}</div>
                      <div className="msg-meta">
                        <strong>{msg.senderName}</strong>
                        {msg.senderEmail && (
                          <span className="msg-email">📧 {msg.senderEmail}</span>
                        )}
                        {wl && <span className="msg-wishlist">untuk wishlist: {wl.title}</span>}
                        <span className="msg-time">
                          {new Date(msg.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMessage(msg.id)}>
                        Hapus
                      </button>
                    </div>

                    {/* Pesan asli */}
                    <p className="msg-content">"{msg.content}"</p>

                    {/* Balasan yang sudah ada */}
                    {msg.reply && (
                      <div className="msg-reply-box">
                        <span className="msg-reply-label">💬 Balasanmu:</span>
                        <p className="msg-reply-content">{msg.reply}</p>
                        {!isReplying && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: 6 }}
                            onClick={() => { setReplyingId(msg.id); setReplyText(msg.reply); }}
                          >
                            ✏️ Edit Balasan
                          </button>
                        )}
                      </div>
                    )}

                    {/* Form balas */}
                    {isReplying ? (
                      <div className="msg-reply-form">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tulis balasanmu…"
                          rows={2}
                          autoFocus
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReply(msg.id)}
                            disabled={sendingReply || !replyText.trim()}
                          >
                            {sendingReply ? "Mengirim…" : "Kirim Balasan"}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setReplyingId(null); setReplyText(""); }}
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      !msg.reply && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ alignSelf: "flex-start", marginTop: 4 }}
                          onClick={() => { setReplyingId(msg.id); setReplyText(""); }}
                        >
                          💬 Balas Pesan
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
            <div className="stat-card card">
              <div className="stat-icon">💌</div>
              <div className="stat-num">{allMessages.length}</div>
              <div className="stat-desc">Pesan Masuk</div>
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
