import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import WishlistDetail from "./pages/WishlistDetail";
import Profile from "./pages/Profile";
import PublicWishlist from "./pages/PublicWishlist";
import Messages from "./pages/Messages";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/w/:id" element={<PublicWishlist />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/wishlist/:id" element={
            <ProtectedRoute><WishlistDetail /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
              <h2 style={{ fontSize: "2rem", marginBottom: 12 }}>404 — Halaman tidak ditemukan</h2>
              <a href="/" className="btn btn-primary">Kembali ke Beranda</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
