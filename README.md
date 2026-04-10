# 🎁 Wishlist & Gift Matcher

Platform web berbasis cloud untuk membuat dan mengelola wishlist hadiah.

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
npm install -g firebase-tools
```

### 2. Konfigurasi Firebase
Buka `src/firebase.js` → ganti semua nilai placeholder dengan firebaseConfig milikmu.

Cara dapat firebaseConfig:
1. Buka https://console.firebase.google.com
2. Project Settings → Your apps → tambah Web App
3. Salin firebaseConfig yang muncul

### 3. Aktifkan di Firebase Console
- Authentication → Email/Password ✓
- Realtime Database → buat database (mode test)
- Hosting → aktifkan

### 4. Jalankan Development
```bash
npm run dev
```

## 📦 Deploy ke Firebase Hosting

```bash
# Login ke Firebase
firebase login

# Inisialisasi project (pilih Hosting, public dir: dist, SPA: yes)
firebase init

# Build project
npm run build

# Deploy!
firebase deploy
```

Website akan live di: `https://wishlist-gift-matcher.web.app`

## 🔄 CI/CD dengan GitHub Actions
Push ke GitHub → GitHub Actions otomatis menjalankan `firebase deploy`
