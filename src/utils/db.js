import {
  ref, push, get, set, update, remove, query,
  orderByChild, equalTo, onValue,
} from "firebase/database";
import { db } from "../firebase";

// ─── USERS (Profil Pengguna) ───────────────────────────────────

// CREATE - sudah di AuthContext (register)

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
    title: data.title,
    eventDate: data.eventDate,
    description: data.description,
    isPublic: data.isPublic || false,
    createdAt: Date.now(),
  };
  const newRef = push(ref(db, "wishlists"), wishlistData);
  return newRef.key;
}

// READ - all wishlists by owner
export async function getWishlistsByOwner(uid) {
  const q = query(ref(db, "wishlists"), orderByChild("ownerId"), equalTo(uid));
  const snap = await get(q);
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
}

// READ - single wishlist (for public page)
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
  // Delete wishlist, its items and messages
  await remove(ref(db, `wishlists/${wishlistId}`));
  // Clean up items
  const itemsSnap = await get(query(ref(db, "items"), orderByChild("wishlistId"), equalTo(wishlistId)));
  if (itemsSnap.exists()) {
    const deletes = Object.keys(itemsSnap.val()).map((id) => remove(ref(db, `items/${id}`)));
    await Promise.all(deletes);
  }
  // Clean up messages
  const msgsSnap = await get(query(ref(db, "messages"), orderByChild("wishlistId"), equalTo(wishlistId)));
  if (msgsSnap.exists()) {
    const deletes = Object.keys(msgsSnap.val()).map((id) => remove(ref(db, `messages/${id}`)));
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
  };
  const newRef = push(ref(db, "items"), itemData);
  return newRef.key;
}

// READ - realtime listener
export function listenItems(wishlistId, callback) {
  const q = query(ref(db, "items"), orderByChild("wishlistId"), equalTo(wishlistId));
  return onValue(q, (snap) => {
    if (!snap.exists()) return callback([]);
    const items = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
    callback(items);
  });
}

// READ - one-time fetch
export async function getItems(wishlistId) {
  const q = query(ref(db, "items"), orderByChild("wishlistId"), equalTo(wishlistId));
  const snap = await get(q);
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
}

// UPDATE - edit item or claim item
export async function updateItem(itemId, data) {
  return update(ref(db, `items/${itemId}`), data);
}

// CLAIM item (special update)
export async function claimItem(itemId, claimerName) {
  const snap = await get(ref(db, `items/${itemId}`));
  if (!snap.exists()) throw new Error("Item tidak ditemukan");
  if (snap.val().isClaimed) throw new Error("Item sudah diklaim");
  return update(ref(db, `items/${itemId}`), { isClaimed: true, claimedBy: claimerName });
}

// DELETE
export async function deleteItem(itemId) {
  return remove(ref(db, `items/${itemId}`));
}

// ─── MESSAGES (Pesan Ucapan) ──────────────────────────────────

// CREATE
export async function createMessage(wishlistId, senderName, content) {
  return push(ref(db, "messages"), {
    wishlistId,
    senderName,
    content,
    createdAt: Date.now(),
  });
}

// READ - realtime listener
export function listenMessages(wishlistId, callback) {
  const q = query(ref(db, "messages"), orderByChild("wishlistId"), equalTo(wishlistId));
  return onValue(q, (snap) => {
    if (!snap.exists()) return callback([]);
    const msgs = Object.entries(snap.val())
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.createdAt - a.createdAt);
    callback(msgs);
  });
}

// DELETE
export async function deleteMessage(messageId) {
  return remove(ref(db, `messages/${messageId}`));
}
