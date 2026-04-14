import emailjs from "@emailjs/browser";

const SERVICE_ID  = "service_znv602m";
const TEMPLATE_CLAIM_OWNER   = "template_ez46jr5";
const TEMPLATE_CLAIM_CLAIMER = "template_4z2huaf";
const TEMPLATE_REPLY         = "template_65vpwd4";
const PUBLIC_KEY  = "S-wsNyo4X_dRJ_Z2U";

emailjs.init(PUBLIC_KEY);

// ─── helper: kirim + log detail ──────────────────────────────
async function sendEmail(templateId, params, label) {
  console.log(`[EmailJS] ▶ Mengirim "${label}"`, { templateId, params });
  try {
    const res = await emailjs.send(SERVICE_ID, templateId, params, PUBLIC_KEY);
    console.log(`[EmailJS] ✅ Berhasil "${label}"`, res);
    return res;
  } catch (err) {
    console.error(`[EmailJS] ❌ Gagal "${label}"`, err);
    // Tampilkan detail: status & teks error dari server EmailJS
    if (err && typeof err === "object") {
      console.error("  status :", err.status);
      console.error("  text   :", err.text);
    }
    throw err; // biarkan caller tahu
  }
}

/**
 * Kirim notifikasi ke PEMILIK wishlist saat ada item diklaim.
 * Template variable yang harus ada di EmailJS:
 *   {{to_email}}  {{owner_name}}  {{claimer_name}}
 *   {{item_name}} {{wishlist_title}}
 */
export async function sendClaimNotifToOwner({
  ownerEmail, ownerName, claimerName, itemName, wishlistTitle,
}) {
  try {
    await sendEmail(TEMPLATE_CLAIM_OWNER, {
      to_email:       ownerEmail,      // ← "To Email" di template harus: {{to_email}}
      owner_name:     ownerName,
      claimer_name:   claimerName,
      item_name:      itemName,
      wishlist_title: wishlistTitle,
    }, "notif ke owner");
  } catch {
    // Sudah di-log di sendEmail; jangan crash app
  }
}

/**
 * Kirim konfirmasi ke PENGKLAIM setelah berhasil klaim item.
 * Template variable yang harus ada di EmailJS:
 *   {{to_email}}  {{claimer_name}}  {{item_name}}  {{wishlist_title}}
 */
export async function sendClaimConfirmToClaimer({
  claimerEmail, claimerName, itemName, wishlistTitle,
}) {
  try {
    await sendEmail(TEMPLATE_CLAIM_CLAIMER, {
      to_email:       claimerEmail,    // ← "To Email" di template harus: {{to_email}}
      claimer_name:   claimerName,
      item_name:      itemName,
      wishlist_title: wishlistTitle,
    }, "konfirmasi ke claimer");
  } catch {
    // Sudah di-log di sendEmail; jangan crash app
  }
}

/**
 * Kirim notifikasi ke PENGIRIM PESAN saat pemilik membalas.
 * Template variable yang harus ada di EmailJS:
 *   {{to_email}}  {{sender_name}}  {{owner_name}}
 *   {{wishlist_title}}  {{reply_content}}
 */
export async function sendReplyNotif({
  senderEmail, senderName, ownerName, wishlistTitle, replyContent,
}) {
  try {
    await sendEmail(TEMPLATE_REPLY, {
      to_email:       senderEmail,     // ← "To Email" di template harus: {{to_email}}
      sender_name:    senderName,
      owner_name:     ownerName,
      wishlist_title: wishlistTitle,
      reply_content:  replyContent,
    }, "notif balasan ke sender");
  } catch {
    // Sudah di-log di sendEmail; jangan crash app
  }
}