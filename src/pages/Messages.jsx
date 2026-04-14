import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getWishlistsByOwner, listenMessages, deleteMessage, replyMessage, markMessagesAsRead
} from "../utils/db";
import { sendReplyNotif } from "../utils/emailService";
import "./Messages.css";

export default function Messages() {
  const { currentUser } = useAuth();
  const [wishlists, setWishlists] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const [selected, setSelected] = useState(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { getUserProfile } = await import("../utils/db");
        const [p, wls] = await Promise.all([
          getUserProfile(currentUser.uid),
          getWishlistsByOwner(currentUser.uid),
        ]);
        setWishlists(wls);
        setDisplayName(p?.displayName || currentUser.displayName || "");
      } catch (err) {
        console.error(err);
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
        const unread = msgs.filter((m) => !m.isRead).map((m) => m.id);
        if (unread.length > 0) markMessagesAsRead(unread).catch(() => {});
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [wishlists]);

  function toggleExpand(msgId) {
    setExpandedId((prev) => (prev === msgId ? null : msgId));
    if (expandedId === msgId) {
      setReplyingId(null);
      setReplyText("");
    }
  }

  function toggleSelect(msgId, e) {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === allMessages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allMessages.map((m) => m.id)));
    }
  }

  async function handleDeleteMessage(msgId, e) {
    e.stopPropagation();
    if (!confirm("Hapus pesan ini?")) return;
    await deleteMessage(msgId);
    setAllMessages((prev) => prev.filter((m) => m.id !== msgId));
    setSelected((prev) => { const n = new Set(prev); n.delete(msgId); return n; });
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Hapus ${selected.size} pesan yang dipilih?`)) return;
    setDeletingBulk(true);
    try {
      await Promise.all([...selected].map((id) => deleteMessage(id)));
      setAllMessages((prev) => prev.filter((m) => !selected.has(m.id)));
      setSelected(new Set());
    } catch {
      alert("Gagal menghapus beberapa pesan.");
    }
    setDeletingBulk(false);
  }

  async function handleReply(msg) {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyMessage(msg.id, replyText.trim());
      if (msg.senderEmail) {
        const wl = wishlists.find((w) => w.id === msg.wishlistId);
        sendReplyNotif({
          senderEmail: msg.senderEmail,
          senderName: msg.senderName,
          ownerName: displayName || "Pemilik Wishlist",
          wishlistTitle: wl?.title || "wishlist",
          replyContent: replyText.trim(),
        });
      }
      setReplyingId(null);
      setReplyText("");
    } catch {
      alert("Gagal mengirim balasan.");
    }
    setSendingReply(false);
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const allSelected = allMessages.length > 0 && selected.size === allMessages.length;
  const someSelected = selected.size > 0;

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>💌 Pesan Ucapan</h1>
        <p>Baca dan balas pesan dari para pemberi hadiah</p>
      </div>

      {allMessages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💌</div>
          <h3>Belum ada pesan</h3>
          <p>Pesan ucapan dari pemberi hadiah akan muncul di sini setelah mereka mengunjungi wishlist publikmu.</p>
        </div>
      ) : (
        <>
          <div className="msg-toolbar">
            <label className="msg-check-all" onClick={toggleSelectAll}>
              <input
                type="checkbox"
                readOnly
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
              />
              <span>{allSelected ? "Batal pilih semua" : "Pilih semua"}</span>
            </label>

            {someSelected && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteSelected}
                disabled={deletingBulk}
              >
                {deletingBulk ? "Menghapus…" : `🗑 Hapus (${selected.size})`}
              </button>
            )}
          </div>

          <div className="messages-list">
            {allMessages.map((msg) => {
              const wl = wishlists.find((w) => w.id === msg.wishlistId);
              const isExpanded = expandedId === msg.id;
              const isReplying = replyingId === msg.id;
              const isChecked = selected.has(msg.id);

              return (
                <div
                  key={msg.id}
                  className={`message-card card${isExpanded ? " expanded" : ""}${isChecked ? " selected" : ""}`}
                >
                  <div className="msg-header" onClick={() => toggleExpand(msg.id)}>
                    <input
                      type="checkbox"
                      className="msg-checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      onClick={(e) => toggleSelect(msg.id, e)}
                    />

                    <div className="msg-avatar">{msg.senderName[0]?.toUpperCase()}</div>

                    <div className="msg-meta">
                      <strong>{msg.senderName}</strong>
                      {msg.senderEmail && <span className="msg-email">📧 {msg.senderEmail}</span>}
                      {wl && <span className="msg-wishlist">untuk wishlist: {wl.title}</span>}
                      <span className="msg-time">
                        {new Date(msg.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </span>
                    </div>

                    <div className="msg-actions" onClick={(e) => e.stopPropagation()}>
                      {msg.reply && !isExpanded && (
                        <span className="msg-replied-badge">✓ Dibalas</span>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => handleDeleteMessage(msg.id, e)}
                      >
                        Hapus
                      </button>
                      <span className="msg-chevron">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="msg-body">
                      <p className="msg-content">"{msg.content}"</p>

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
                              onClick={() => handleReply(msg)}
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
                            style={{ alignSelf: "flex-start", marginTop: 8 }}
                            onClick={() => { setReplyingId(msg.id); setReplyText(""); }}
                          >
                            💬 Balas Pesan
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
