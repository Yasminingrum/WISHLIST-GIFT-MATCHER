import { useState } from "react";
import { createItem, updateItem } from "../utils/db";

export default function ItemForm({ existing, wishlistId, onClose }) {
  const [form, setForm] = useState({
    name: existing?.name || "",
    price: existing?.price || "",
    shopUrl: existing?.shopUrl || "",
    priority: existing?.priority || "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Nama item wajib diisi.");
    setLoading(true);
    setError("");
    try {
      if (existing) {
        await updateItem(existing.id, {
          name: form.name,
          price: Number(form.price) || 0,
          shopUrl: form.shopUrl,
          priority: form.priority,
        });
      } else {
        await createItem(wishlistId, {
          ...form,
          price: Number(form.price) || 0,
        });
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
            {existing ? "Edit Item Hadiah" : "Tambah Item Hadiah"}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Produk *</label>
            <input
              name="name"
              placeholder="Contoh: Sepatu Lari Nike Air Max"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Estimasi Harga (Rp)</label>
            <input
              name="price"
              type="number"
              placeholder="0"
              min="0"
              value={form.price}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Link Toko Online</label>
            <input
              name="shopUrl"
              type="url"
              placeholder="https://tokopedia.com/..."
              value={form.shopUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Prioritas</label>
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="high">🔴 Tinggi — Sangat diinginkan</option>
              <option value="medium">🟡 Sedang — Lumayan diinginkan</option>
              <option value="low">🟢 Rendah — Boleh juga kalau ada</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Menyimpan…" : existing ? "Simpan Perubahan" : "Tambah Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
