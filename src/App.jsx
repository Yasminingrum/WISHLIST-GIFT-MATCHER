import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import EmailActionHandler from "./pages/EmailActionHandler";
import Dashboard from "./pages/Dashboard";
import WishlistDetail from "./pages/WishlistDetail";
import Profile from "./pages/Profile";
import PublicWishlist from "./pages/PublicWishlist";
import Messages from "./pages/Messages";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/action" element={<EmailActionHandler />} />
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
      </ThemeProvider>
    </BrowserRouter>
  );
}
