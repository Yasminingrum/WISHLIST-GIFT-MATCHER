// ============================================================
// FIREBASE CONFIGURATION
// Ganti nilai di bawah ini dengan firebaseConfig milikmu
// dari Firebase Console > Project Settings > Your Apps
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCjMfX31HfHvSR7byzLerQCKxjBztn4joo",

  authDomain: "wishlist-gift-matcher.firebaseapp.com",

  databaseURL: "https://wishlist-gift-matcher-default-rtdb.asia-southeast1.firebasedatabase.app/",

  projectId: "wishlist-gift-matcher",

  storageBucket: "wishlist-gift-matcher.firebasestorage.app",

  messagingSenderId: "160003220827",

  appId: "1:160003220827:web:8c0e4584cf5ff08935667e",

  measurementId: "G-VC597NZX9S"

};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
