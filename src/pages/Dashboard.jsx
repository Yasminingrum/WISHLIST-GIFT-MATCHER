import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getWishlistsByOwner, deleteWishlist } from "../utils/db";
import WishlistForm from "../components/WishlistForm";
import "./Dashboard.css";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getWishlistsByOwner(currentUser.uid);
      data.sort((a, b) => b.createdAt - a.createdAt);
      setWishlists(data);
    } catch (err) {
      console.error("Gagal load wishlist:", err);
      setError("Gagal memuat wishlist. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm("Hapus wishlist ini beserta semua item-nya?")) return;
    try {
      await deleteWishlist(id);
      load();
    } catch (err) {
      alert("Gagal menghapus wishlist. Coba lagi.");
    }
  }

  function handleEdit(wl) {
    setEditTarget(wl);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditTarget(null);
    load();
  }

  const greeting = currentUser?.displayName?.split(" ")[0] || "Kamu";

  return (
    <div className="container fade-in">
      <div className="page-header dashboard-header">
        <div>
          <h1>Halo, {greeting}! 👋</h1>
          <p>Kelola semua wishlist hadiahmu di sini</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          + Buat Wishlist
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          {error}
          <button
            onClick={load}
            style={{ marginLeft: 12, fontWeight: 600, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : wishlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎁</div>
          <h3>Belum ada wishlist</h3>
          <p>Mulai buat wishlist pertamamu!</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }}
            onClick={() => setShowForm(true)}>
            Buat Sekarang
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlists.map((wl) => (
            <div key={wl.id} className="wishlist-card card">
              <div className="wl-card-top">
                <div>
                  <h3 className="wl-title">{wl.title}</h3>
                  <p className="wl-date">📅 {wl.eventDate || "Tanggal belum diset"}</p>
                </div>
                <span className={`badge ${wl.isPublic ? "badge-mint" : "badge-soft"}`}>
                  {wl.isPublic ? "🌍 Publik" : "🔒 Privat"}
                </span>
              </div>

              {wl.description && (
                <p className="wl-desc">{wl.description}</p>
              )}

              {wl.isPublic && (
                <div className="wl-share-row">
                  <span className="wl-share-label">Link publik:</span>
                  <code className="wl-link">{window.location.origin}/w/{wl.id}</code>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/w/${wl.id}`);
                    alert("Link disalin!");
                  }}>Salin</button>
                </div>
              )}

              <div className="wl-actions">
                <Link to={`/wishlist/${wl.id}`} className="btn btn-primary btn-sm">
                  Kelola Item
                </Link>
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(wl)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(wl.id)}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <WishlistForm
          existing={editTarget}
          onClose={handleFormClose}
          uid={currentUser.uid}
          ownerEmail={currentUser.email}
        />
      )}
    </div>
  );
}
