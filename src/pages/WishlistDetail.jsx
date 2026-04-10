import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getWishlist, listenItems, createItem, updateItem, deleteItem } from "../utils/db";
import ItemForm from "../components/ItemForm";
import "./WishlistDetail.css";

const PRIORITY_LABEL = { high: "🔴 Tinggi", medium: "🟡 Sedang", low: "🟢 Rendah" };
const PRIORITY_CLASS = { high: "badge-rose", medium: "badge-gold", low: "badge-mint" };

export default function WishlistDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    getWishlist(id).then((wl) => {
      setWishlist(wl);
      setLoading(false);
    });
    const unsub = listenItems(id, setItems);
    return unsub;
  }, [id]);

  async function handleDelete(itemId) {
    if (!confirm("Hapus item ini?")) return;
    await deleteItem(itemId);
  }

  function handleEdit(item) {
    setEditItem(item);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditItem(null);
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!wishlist) return <div className="container"><p>Wishlist tidak ditemukan.</p></div>;

  const claimedCount = items.filter((i) => i.isClaimed).length;

  return (
    <div className="container fade-in">
      <div className="page-header">
        <Link to="/dashboard" className="back-link">← Dashboard</Link>
        <h1>{wishlist.title}</h1>
        <div className="wl-meta">
          {wishlist.eventDate && <span>📅 {wishlist.eventDate}</span>}
          <span className={`badge ${wishlist.isPublic ? "badge-mint" : "badge-soft"}`}>
            {wishlist.isPublic ? "🌍 Publik" : "🔒 Privat"}
          </span>
          {wishlist.isPublic && (
            <button className="btn btn-ghost btn-sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/w/${id}`);
              alert("Link disalin!");
            }}>🔗 Salin Link</button>
          )}
        </div>
        {wishlist.description && <p className="wl-detail-desc">{wishlist.description}</p>}
      </div>

      <div className="items-header">
        <div className="items-stats">
          <span className="stat-pill">{items.length} item</span>
          <span className="stat-pill stat-claimed">{claimedCount} diklaim</span>
          <span className="stat-pill">{items.length - claimedCount} tersedia</span>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>
          + Tambah Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>Belum ada item hadiah</h3>
          <p>Tambahkan hadiah yang kamu inginkan!</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className={`item-card card ${item.isClaimed ? "item-claimed" : ""}`}>
              <div className="item-card-top">
                <h4 className="item-name">{item.name}</h4>
                <span className={`badge ${PRIORITY_CLASS[item.priority]}`}>
                  {PRIORITY_LABEL[item.priority]}
                </span>
              </div>

              {item.price > 0 && (
                <p className="item-price">
                  Rp {Number(item.price).toLocaleString("id-ID")}
                </p>
              )}

              {item.shopUrl && (
                <a href={item.shopUrl} target="_blank" rel="noreferrer" className="item-link">
                  🛒 Lihat di Toko
                </a>
              )}

              <div className="item-status">
                {item.isClaimed ? (
                  <span className="badge badge-mint">✓ Sudah Diklaim</span>
                ) : (
                  <span className="badge badge-soft">Tersedia</span>
                )}
              </div>

              <div className="item-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ItemForm
          existing={editItem}
          wishlistId={id}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
