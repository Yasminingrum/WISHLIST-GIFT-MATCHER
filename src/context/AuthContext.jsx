import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { ref, set, get, update, remove } from "firebase/database";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AUTH_ERROR = {
  GOOGLE_USER_NOT_REGISTERED: "auth/google-user-not-registered",
};

const ACTION_CODE_SETTINGS = {
  url: import.meta.env.VITE_APP_URL
    ? `${import.meta.env.VITE_APP_URL}/login`
    : `${window.location.origin}/login`,
  handleCodeInApp: false,
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });
    await sendEmailVerification(user, ACTION_CODE_SETTINGS);
    await set(ref(db, "users/" + user.uid), {
      displayName,
      email,
      photoURL: "",
      bio: "",
      createdAt: Date.now(),
    });
    return userCredential;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;
    const snap = await get(ref(db, "users/" + uid));
    if (snap.exists() && !snap.val().email) {
      await update(ref(db, "users/" + uid), { email });
    }
    return result;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const snap = await get(ref(db, "users/" + user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      const err = new Error("Akun Google belum terdaftar. Silakan daftar terlebih dahulu.");
      err.code = AUTH_ERROR.GOOGLE_USER_NOT_REGISTERED;
      throw err;
    }
    return result;
  }

  async function registerWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const snap = await get(ref(db, "users/" + user.uid));
    if (!snap.exists()) {
      await set(ref(db, "users/" + user.uid), {
        displayName: user.displayName || "",
        email: user.email,
        photoURL: user.photoURL || "",
        bio: "",
        createdAt: Date.now(),
      });
    }
    return result;
  }

  async function logout() {
    return signOut(auth);
  }

  /**
   * Update profil: simpan ke Firebase Realtime DB + update Firebase Auth displayName/photoURL.
   * Setelah berhasil, paksa refresh currentUser state agar Dashboard langsung update.
   */
  async function updateUserProfile(uid, data) {
    const email = auth.currentUser?.email || "";
    // 1. Simpan ke Realtime Database
    await update(ref(db, "users/" + uid), { ...data, email });
    // 2. Update Firebase Auth profile (displayName & photoURL)
    const authUpdates = {};
    if (data.displayName !== undefined) authUpdates.displayName = data.displayName;
    if (data.photoURL !== undefined) authUpdates.photoURL = data.photoURL;
    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(auth.currentUser, authUpdates);
    }
    // 3. Refresh currentUser state — paksa React re-render dengan object baru
    setCurrentUser({ ...auth.currentUser });
  }

  async function getUserProfile(uid) {
    const snap = await get(ref(db, "users/" + uid));
    return snap.exists() ? snap.val() : null;
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser, ACTION_CODE_SETTINGS);
  }

  /**
   * Hapus akun: re-autentikasi dulu (keamanan Firebase), lalu hapus data DB, lalu hapus akun.
   * @param {string} password - password akun (untuk re-auth). Null jika Google user.
   */
  async function deleteAccount(password) {
    const user = auth.currentUser;
    if (!user) throw new Error("Tidak ada sesi aktif.");

    // Re-autentikasi (diperlukan Firebase untuk operasi sensitif)
    if (password) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }

    const uid = user.uid;
    // Hapus data user dari Realtime Database
    await remove(ref(db, "users/" + uid));
    // Hapus akun dari Firebase Auth
    await deleteUser(user);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    loginWithGoogle,
    registerWithGoogle,
    logout,
    updateUserProfile,
    getUserProfile,
    resendVerificationEmail,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
