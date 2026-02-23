import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ContributorDashboard from "./pages/ContributorDashboard";
import { Navbar } from "./components/Navbar";

// Wrapper to conditionally hide Navbar on full-page layouts
function AppLayout({ isAuthenticated, userRole, onLogout, children }) {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/contributor');
  return (
    <>
      {!hideNavbar && <Navbar isAuthenticated={isAuthenticated} userRole={userRole} onLogout={onLogout} />}
      {children}
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserRole(parsed.role || null);
      } catch { setUserRole(null); }
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserRole(parsed.role || null);
      } catch { setUserRole(null); }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout isAuthenticated={isAuthenticated} userRole={userRole} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/about" /> : <Home />} />
          <Route path="/about" element={<About />} />
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/about" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/about" /> : <Register onLogin={handleLogin} />} 
          />
          <Route 
            path="/profile" 
            element={isAuthenticated ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={isAuthenticated && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/contributor" 
            element={isAuthenticated && (userRole === 'contributor' || userRole === 'admin') ? <ContributorDashboard onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;