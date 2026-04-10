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
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });
    await sendEmailVerification(user);
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
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Cek apakah user sudah ada di database
    const snap = await get(ref(db, "users/" + user.uid));
    if (!snap.exists()) {
      // User baru via Google — simpan ke database
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

  async function updateUserProfile(uid, data) {
    await update(ref(db, "users/" + uid), data);
    if (data.displayName) {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
    }
  }

  async function getUserProfile(uid) {
    const snap = await get(ref(db, "users/" + uid));
    return snap.exists() ? snap.val() : null;
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
    logout,
    updateUserProfile,
    getUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
