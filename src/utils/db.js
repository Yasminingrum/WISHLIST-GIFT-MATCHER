import {
  ref, push, get, set, update, remove, onValue,
} from "firebase/database";
import { db } from "../firebase";
 
// ─── USERS (Profil Pengguna) ───────────────────────────────────
 
// READ
export async function getUserProfile(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? { id: uid, ...snap.val() } : null;
}
 
// UPDATE
export async function updateUserProfile(uid, data) {
  return update(ref(db, `users/${uid}`), data);
}
 
// DELETE
export async function deleteUserData(uid) {
  return remove(ref(db, `users/${uid}`));
}
 
// ─── WISHLISTS (Daftar Hadiah per Event) ──────────────────────
 
// CREATE
export async function createWishlist(uid, data) {
  const wishlistData = {
    ownerId: uid,
    ownerEmail: data.ownerEmail || "",
    title: data.title,
    eventDate: data.eventDate || "",
    description: data.description || "",
    isPublic: data.isPublic || false,
    createdAt: Date.now(),
  };
  const newRef = push(ref(db, "wishlists"), wishlistData);
  return newRef.key;
}
 
// READ - all wishlists by owner
export async function getWishlistsByOwner(uid) {
  const snap = await get(ref(db, "wishlists"));
  if (!snap.exists()) return [];
  const all = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
  return all.filter((wl) => wl.ownerId === uid);
}
 
// READ - single wishlist
export async function getWishlist(wishlistId) {
  const snap = await get(ref(db, `wishlists/${wishlistId}`));
  return snap.exists() ? { id: wishlistId, ...snap.val() } : null;
}
 
// UPDATE
export async function updateWishlist(wishlistId, data) {
  return update(ref(db, `wishlists/${wishlistId}`), data);
}
 
// DELETE
export async function deleteWishlist(wishlistId) {
  await remove(ref(db, `wishlists/${wishlistId}`));
 
  const itemsSnap = await get(ref(db, "items"));
  if (itemsSnap.exists()) {
    const deletes = Object.entries(itemsSnap.val())
      .filter(([, val]) => val.wishlistId === wishlistId)
      .map(([id]) => remove(ref(db, `items/${id}`)));
    await Promise.all(deletes);
  }
 
  const msgsSnap = await get(ref(db, "messages"));
  if (msgsSnap.exists()) {
    const deletes = Object.entries(msgsSnap.val())
      .filter(([, val]) => val.wishlistId === wishlistId)
      .map(([id]) => remove(ref(db, `messages/${id}`)));
    await Promise.all(deletes);
  }
}
 
// ─── ITEMS (Hadiah dalam Wishlist) ────────────────────────────
 
// CREATE
export async function createItem(wishlistId, data) {
  const itemData = {
    wishlistId,
    name: data.name,
    price: data.price || 0,
    shopUrl: data.shopUrl || "",
    priority: data.priority || "medium",
    isClaimed: false,
    claimedBy: null,
    claimedByEmail: null,
  };
  const newRef = push(ref(db, "items"), itemData);
  return newRef.key;
}
 
// READ - realtime listener
export function listenItems(wishlistId, callback) {
  return onValue(ref(db, "items"), (snap) => {
    if (!snap.exists()) return callback([]);
    const items = Object.entries(snap.val())
      .map(([id, val]) => ({ id, ...val }))
      .filter((item) => item.wishlistId === wishlistId);
    callback(items);
  });
}
 
// READ - one-time fetch
export async function getItems(wishlistId) {
  const snap = await get(ref(db, "items"));
  if (!snap.exists()) return [];
  return Object.entries(snap.val())
    .map(([id, val]) => ({ id, ...val }))
    .filter((item) => item.wishlistId === wishlistId);
}
 
// UPDATE - edit detail item
export async function updateItem(itemId, data) {
  return update(ref(db, `items/${itemId}`), data);
}
 
// CLAIM item — wajib isi nama + email
export async function claimItem(itemId, claimerName, claimerEmail) {
  const snap = await get(ref(db, `items/${itemId}`));
  if (!snap.exists()) throw new Error("Item tidak ditemukan");
  if (snap.val().isClaimed) throw new Error("Item sudah diklaim orang lain");
  return update(ref(db, `items/${itemId}`), {
    isClaimed: true,
    claimedBy: claimerName,
    claimedByEmail: claimerEmail,
  });
}
 
// DELETE
export async function deleteItem(itemId) {
  return remove(ref(db, `items/${itemId}`));
}
 
// ─── MESSAGES (Pesan Ucapan) ──────────────────────────────────
 
// CREATE
export async function createMessage(wishlistId, senderName, senderEmail, content) {
  return push(ref(db, "messages"), {
    wishlistId,
    senderName,
    senderEmail,
    content,
    reply: null,
    repliedAt: null,
    isRead: false,
    createdAt: Date.now(),
  });
}

// MARK AS READ — tandai pesan sebagai sudah dibaca (batch update)
export async function markMessagesAsRead(messageIds) {
  const updates = {};
  messageIds.forEach((id) => {
    updates[`messages/${id}/isRead`] = true;
  });
  return update(ref(db, "/"), updates);
}
 
// READ - realtime listener
export function listenMessages(wishlistId, callback) {
  return onValue(ref(db, "messages"), (snap) => {
    if (!snap.exists()) return callback([]);
    const msgs = Object.entries(snap.val())
      .map(([id, val]) => ({ id, ...val }))
      .filter((msg) => msg.wishlistId === wishlistId)
      .sort((a, b) => b.createdAt - a.createdAt);
    callback(msgs);
  });
}
 
// UPDATE — pemilik balas pesan (ini adalah operasi Update untuk entitas Messages)
export async function replyMessage(messageId, replyContent) {
  return update(ref(db, `messages/${messageId}`), {
    reply: replyContent,
    repliedAt: Date.now(),
  });
}
 
// DELETE
export async function deleteMessage(messageId) {
  return remove(ref(db, `messages/${messageId}`));
}
 