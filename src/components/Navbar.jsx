import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getWishlistsByOwner, listenMessages } from "../utils/db";
import "./Navbar.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    if (!currentUser) { setMsgCount(0); return; }
    let unsubs = [];
    getWishlistsByOwner(currentUser.uid).then((wls) => {
      const counts = {};
      unsubs = wls.map((wl) =>
        listenMessages(wl.id, (msgs) => {
          counts[wl.id] = msgs.filter((m) => !m.isRead).length;
          setMsgCount(Object.values(counts).reduce((a, b) => a + b, 0));
        })
      );
    }).catch(() => {});
    return () => unsubs.forEach((u) => u && u());
  }, [currentUser]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          🎁 <span>Wishlist</span> & Gift Matcher
        </Link>
        <div className="navbar-actions">
          {currentUser ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
              <Link to="/messages" className="btn btn-ghost btn-sm navbar-msg-btn">
                💌 Pesan
                {msgCount > 0 && (
                  <span className="navbar-badge">{msgCount > 9 ? "9+" : msgCount}</span>
                )}
              </Link>
              <Link to="/profile" className="btn btn-ghost btn-sm">Profil</Link>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">Keluar</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Masuk</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
