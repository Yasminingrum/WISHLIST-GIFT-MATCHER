import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getWishlist, listenItems, claimItem, createMessage, listenMessages } from "../utils/db";
import { sendClaimNotifToOwner, sendClaimConfirmToClaimer } from "../utils/emailService";
import "./PublicWishlist.css";

const PRIORITY_LABEL = { high: "🔴 Tinggi", medium: "🟡 Sedang", low: "🟢 Rendah" };
const PRIORITY_CLASS = { high: "badge-rose", medium: "badge-gold", low: "badge-mint" };

export default function PublicWishlist() {
  const { id } = useParams();
  const [wishlist, setWishlist] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Claim modal state
  const [claimTarget, setClaimTarget] = useState(null);
  const [claimerName, setClaimerName] = useState("");
  const [claimerEmail, setClaimerEmail] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");

  // Message form state
  const [msgName, setMsgName] = useState("");
  const [msgEmail, setMsgEmail] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");

  useEffect(() => {
    async function init() {
      const wl = await getWishlist(id);
      if (!wl || !wl.isPublic) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setWishlist(wl);

      // Ambil profil owner untuk dapat email-nya
      try {
        const { getUserProfile } = await import("../utils/db");
        const profile = await getUserProfile(wl.ownerId);
        setOwnerProfile(profile);
      } catch (_) {}

      setLoading(false);
    }
    init();

    const unsubItems = listenItems(id, setItems);
    const unsubMsgs = listenMessages(id, () => {}); // keep listener aktif
    return () => { unsubItems(); unsubMsgs(); };
  }, [id]);

  async function handleClaim(e) {
    e.preventDefault();
    if (!claimerName.trim()) return setClaimError("Masukkan namamu.");
    if (!claimerEmail.trim()) return setClaimError("Masukkan emailmu.");
    setClaiming(true);
    setClaimError("");
    try {
      await claimItem(claimTarget.id, claimerName.trim(), claimerEmail.trim());

      // Kirim email notifikasi (tidak blocking — berjalan di background)
      // Prioritas: ownerEmail dari node wishlist → profil owner → fallback fetch
      let ownerEmail = wishlist.ownerEmail || ownerProfile?.email || "";
      let ownerName  = ownerProfile?.displayName || "Pemilik Wishlist";

      if (!ownerEmail) {
        try {
          const fresh = await getUserProfile(wishlist.ownerId);
          ownerEmail = fresh?.email || "";
          ownerName  = fresh?.displayName || ownerName;
        } catch (_) {}
      }

      console.log("[Claim] ownerEmail:", ownerEmail);

      sendClaimNotifToOwner({
        ownerEmail,
        ownerName,
        claimerName: claimerName.trim(),
        itemName: claimTarget.name,
        wishlistTitle: wishlist.title,
      });

      sendClaimConfirmToClaimer({
        claimerEmail: claimerEmail.trim(),
        claimerName: claimerName.trim(),
        itemName: claimTarget.name,
        wishlistTitle: wishlist.title,
      });

      setClaimSuccess(`Kamu berhasil mengklaim "${claimTarget.name}"! 🎉 Cek emailmu untuk konfirmasi.`);
      setClaimTarget(null);
      setClaimerName("");
      setClaimerEmail("");
    } catch (err) {
      setClaimError(err.message || "Gagal mengklaim. Coba lagi.");
    }
    setClaiming(false);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!msgName.trim() || !msgEmail.trim() || !msgContent.trim()) return;
    setSendingMsg(true);
    try {
      await createMessage(id, msgName.trim(), msgEmail.trim(), msgContent.trim());
      setMsgName("");
      setMsgEmail("");
      setMsgContent("");
      setMsgSuccess("Pesan ucapan terkirim! 💌");
      setTimeout(() => setMsgSuccess(""), 3000);
    } catch {
      alert("Gagal mengirim pesan.");
    }
    setSendingMsg(false);
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  if (notFound) return (
    <div className="public-not-found">
      <div style={{ fontSize: "4rem", marginBottom: 16 }}>🔒</div>
      <h2>Wishlist Tidak Ditemukan</h2>
      <p>Link ini mungkin sudah tidak aktif atau bersifat privat.</p>
    </div>
  );

  const available = items.filter((i) => !i.isClaimed);
  const claimed = items.filter((i) => i.isClaimed);

  return (
    <div className="public-page">
      <div className="public-hero">
        <div className="public-hero-deco" aria-hidden />
        <div className="container">
          <p className="public-eyebrow">✨ Wishlist Hadiah</p>
          <h1 className="public-title">{wishlist.title}</h1>
          {wishlist.eventDate && <p className="public-date">📅 {wishlist.eventDate}</p>}
          {wishlist.description && <p className="public-desc">{wishlist.description}</p>}
          <div className="public-stats">
            <div className="pub-stat">
              <span className="pub-stat-num">{items.length}</span>
              <span className="pub-stat-label">Total Item</span>
            </div>
            <div className="pub-stat-divider" />
            <div className="pub-stat">
              <span className="pub-stat-num">{available.length}</span>
              <span className="pub-stat-label">Tersedia</span>
            </div>
            <div className="pub-stat-divider" />
            <div className="pub-stat">
              <span className="pub-stat-num">{claimed.length}</span>
              <span className="pub-stat-label">Diklaim</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {claimSuccess && (
          <div className="alert alert-success" style={{ marginTop: 24 }}>{claimSuccess}</div>
        )}

        <section className="pub-section">
          <h2 className="pub-section-title">🎁 Daftar Hadiah</h2>
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛍️</div>
              <h3>Belum ada item</h3>
              <p>Wishlist masih kosong.</p>
            </div>
          ) : (
            <div className="pub-items-grid">
              {items.map((item) => (
                <div key={item.id} className={`pub-item-card card ${item.isClaimed ? "pub-item-claimed" : ""}`}>
                  <div className="pub-item-top">
                    <h3 className="pub-item-name">{item.name}</h3>
                    <span className={`badge ${PRIORITY_CLASS[item.priority]}`}>
                      {PRIORITY_LABEL[item.priority]}
                    </span>
                  </div>
                  {item.price > 0 && (
                    <p className="pub-item-price">≈ Rp {Number(item.price).toLocaleString("id-ID")}</p>
                  )}
                  {item.shopUrl && !item.isClaimed && (
                    <a href={item.shopUrl} target="_blank" rel="noreferrer" className="pub-shop-link">
                      🛒 Lihat di Toko
                    </a>
                  )}
                  <div className="pub-item-footer">
                    {item.isClaimed ? (
                      <span className="pub-claimed-badge">✓ Sudah Diklaim</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => { setClaimTarget(item); setClaimError(""); }}>
                        Klaim Hadiah Ini
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pub-section pub-msg-section">
          <h2 className="pub-section-title">💌 Kirim Pesan Ucapan</h2>
          <div className="pub-msg-form card">
            {msgSuccess && <div className="alert alert-success">{msgSuccess}</div>}
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Namamu *</label>
                <input placeholder="Masukkan namamu" value={msgName} onChange={(e) => setMsgName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Emailmu *</label>
                <input type="email" placeholder="email@contoh.com" value={msgEmail} onChange={(e) => setMsgEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Pesan Ucapan *</label>
                <textarea placeholder="Tulis ucapan spesialmu di sini…" value={msgContent} onChange={(e) => setMsgContent(e.target.value)} rows={4} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sendingMsg}>
                {sendingMsg ? "Mengirim…" : "Kirim Pesan 💌"}
              </button>
            </form>
          </div>
        </section>
      </div>

      {claimTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setClaimTarget(null)}>
          <div className="modal slide-up">
            <div className="modal-header">
              <h2 className="modal-title">Klaim Hadiah</h2>
              <button className="modal-close" onClick={() => setClaimTarget(null)}>✕</button>
            </div>
            <p style={{ color: "var(--ink-mid)", marginBottom: 20 }}>
              Kamu akan mengklaim: <strong>{claimTarget.name}</strong>
            </p>
            {claimError && <div className="alert alert-error">{claimError}</div>}
            <form onSubmit={handleClaim}>
              <div className="form-group">
                <label>Namamu *</label>
                <input placeholder="Masukkan namamu" value={claimerName} onChange={(e) => setClaimerName(e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label>Emailmu *</label>
                <input type="email" placeholder="email@contoh.com" value={claimerEmail} onChange={(e) => setClaimerEmail(e.target.value)} required />
              </div>
              <p className="claim-note">
                💡 Nama dan emailmu tidak ditampilkan ke pemilik wishlist — kejutan tetap terjaga! Email hanya untuk konfirmasi klaim.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setClaimTarget(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={claiming}>
                  {claiming ? "Mengklaim…" : "Konfirmasi Klaim 🎁"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
