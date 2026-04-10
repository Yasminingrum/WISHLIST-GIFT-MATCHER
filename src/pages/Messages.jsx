import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getWishlistsByOwner, listenMessages, deleteMessage, replyMessage
} from "../utils/db";
import { sendReplyNotif } from "../utils/emailService";
import "./Messages.css";

export default function Messages() {
  const { currentUser } = useAuth();
  const [wishlists, setWishlists] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [displayName, setDisplayName] = useState("");

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
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [wishlists]);

  async function handleDeleteMessage(msgId) {
    if (!confirm("Hapus pesan ini?")) return;
    await deleteMessage(msgId);
    setAllMessages((prev) => prev.filter((m) => m.id !== msgId));
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
                    {msg.senderEmail && <span className="msg-email">📧 {msg.senderEmail}</span>}
                    {wl && (
                      <span className="msg-wishlist">untuk wishlist: {wl.title}</span>
                    )}
                    <span className="msg-time">
                      {new Date(msg.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMessage(msg.id)}>
                    Hapus
                  </button>
                </div>

                <p className="msg-content">"{msg.content}"</p>

                {msg.reply && (
                  <div className="msg-reply-box">
                    <span className="msg-reply-label">💬 Balasanmu:</span>
                    <p className="msg-reply-content">{msg.reply}</p>
                    {!isReplying && (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}
                        onClick={() => { setReplyingId(msg.id); setReplyText(msg.reply); }}>
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
                      <button className="btn btn-primary btn-sm"
                        onClick={() => handleReply(msg)}
                        disabled={sendingReply || !replyText.trim()}>
                        {sendingReply ? "Mengirim…" : "Kirim Balasan"}
                      </button>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => { setReplyingId(null); setReplyText(""); }}>
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  !msg.reply && (
                    <button className="btn btn-secondary btn-sm"
                      style={{ alignSelf: "flex-start", marginTop: 4 }}
                      onClick={() => { setReplyingId(msg.id); setReplyText(""); }}>
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
  );
}
