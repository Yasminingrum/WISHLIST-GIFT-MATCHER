import { useState } from "react";
import { createItem, updateItem } from "../utils/db";

// Format angka dengan titik sebagai pemisah ribuan (format Indonesia)
function formatPrice(value) {
  const num = value.replace(/\./g, "").replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("id-ID");
}

function parsePrice(formatted) {
  return Number(formatted.replace(/\./g, "")) || 0;
}

export default function ItemForm({ existing, wishlistId, onClose }) {
  const [form, setForm] = useState({
    name: existing?.name || "",
    priceDisplay: existing?.price ? Number(existing.price).toLocaleString("id-ID") : "",
    shopUrl: existing?.shopUrl || "",
    priority: existing?.priority || "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "priceDisplay") {
      setForm((f) => ({ ...f, priceDisplay: formatPrice(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Nama item wajib diisi.");
    setLoading(true);
    setError("");
    try {
      const price = parsePrice(form.priceDisplay);
      if (existing) {
        await updateItem(existing.id, {
          name: form.name,
          price,
          shopUrl: form.shopUrl,
          priority: form.priority,
        });
      } else {
        await createItem(wishlistId, {
          name: form.name,
          price,
          shopUrl: form.shopUrl,
          priority: form.priority,
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
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "var(--ink-soft)", fontSize: "0.9rem", pointerEvents: "none",
                userSelect: "none",
              }}>
                Rp
              </span>
              <input
                name="priceDisplay"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={form.priceDisplay}
                onChange={handleChange}
                style={{ paddingLeft: 38 }}
              />
            </div>
            {form.priceDisplay && (
              <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 4 }}>
                Nilai: Rp {form.priceDisplay}
              </p>
            )}
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
