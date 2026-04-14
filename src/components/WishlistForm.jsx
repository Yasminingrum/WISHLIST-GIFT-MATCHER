import { useState } from "react";
import { createWishlist, updateWishlist } from "../utils/db";

export default function WishlistForm({ existing, onClose, uid, ownerEmail }) {
  const [form, setForm] = useState({
    title: existing?.title || "",
    eventDate: existing?.eventDate || "",
    description: existing?.description || "",
    isPublic: existing?.isPublic || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Nama event wajib diisi.");
    setLoading(true);
    setError("");
    try {
      if (existing) {
        await updateWishlist(existing.id, form);
      } else {
        await createWishlist(uid, { ...form, ownerEmail: ownerEmail || '' });
      }
      onClose();
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="modal-header">
          <h2 className="modal-title">
            {existing ? "Edit Wishlist" : "Buat Wishlist Baru"}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Event *</label>
            <input name="title" placeholder="Contoh: Ulang Tahun ke-22" value={form.title}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Tanggal Perayaan</label>
            <input name="eventDate" type="date" value={form.eventDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Deskripsi</label>
            <textarea name="description" placeholder="Ceritakan eventmu…" value={form.description}
              onChange={handleChange} rows={3} />
          </div>

          <div className="toggle-row">
            <span className="toggle-label">
              {form.isPublic ? "🌍 Publik — bisa diakses siapa saja" : "🔒 Privat — hanya kamu"}
            </span>
            <label className="toggle-switch">
              <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Menyimpan…" : existing ? "Simpan Perubahan" : "Buat Wishlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
