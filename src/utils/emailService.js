import emailjs from "@emailjs/browser";

// ─── Ganti dengan ID dari akun EmailJS-mu ───────────────────
const SERVICE_ID = "service_znv602m";           // contoh: "service_abc123"
const TEMPLATE_CLAIM_OWNER = "template_ez46jr5";   // notif ke pemilik wishlist
const TEMPLATE_CLAIM_CLAIMER = "template_4z2huaf"; // konfirmasi ke pengklaim
const TEMPLATE_REPLY = "template_65vpwd4"; // notif balasan pesan ke pengirim
const PUBLIC_KEY = "S-wsNyo4X_dRJ_Z2U";           // di Account → General
// ────────────────────────────────────────────────────────────

/**
 * Kirim notifikasi ke PEMILIK wishlist saat ada item diklaim
 */
export async function sendClaimNotifToOwner({
  ownerEmail,
  ownerName,
  claimerName,
  itemName,
  wishlistTitle,
}) {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_CLAIM_OWNER,
      {
        owner_email: ownerEmail,
        owner_name: ownerName,
        claimer_name: claimerName,
        item_name: itemName,
        wishlist_title: wishlistTitle,
      },
      PUBLIC_KEY
    );
  } catch (err) {
    // Jangan crash app kalau email gagal — log saja
    console.warn("Gagal kirim email notif ke owner:", err);
  }
}

/**
 * Kirim konfirmasi ke PENGKLAIM setelah berhasil klaim item
 */
export async function sendClaimConfirmToClaimer({
  claimerEmail,
  claimerName,
  itemName,
  wishlistTitle,
}) {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_CLAIM_CLAIMER,
      {
        claimer_email: claimerEmail,
        claimer_name: claimerName,
        item_name: itemName,
        wishlist_title: wishlistTitle,
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.warn("Gagal kirim email konfirmasi ke claimer:", err);
  }
}

/**
 * Kirim notifikasi ke PENGIRIM PESAN saat pemilik membalas
 */
export async function sendReplyNotif({
  senderEmail,
  senderName,
  ownerName,
  wishlistTitle,
  replyContent,
}) {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_REPLY,
      {
        sender_email: senderEmail,
        sender_name: senderName,
        owner_name: ownerName,
        wishlist_title: wishlistTitle,
        reply_content: replyContent,
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.warn("Gagal kirim email notif balasan:", err);
  }
}
