import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RequestChat from './pages/RequestChat';

function App({ darkMode, setDarkMode }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('zpv_user');
      const token = localStorage.getItem('zpv_token');
      return stored && token ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('zpv_token');
    localStorage.removeItem('zpv_user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/chat" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/chat"
          element={
            user
              ? <ChatPage darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/request"
          element={
            user
              ? <RequestChat />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="*"
          element={<Navigate to={user ? '/chat' : '/login'} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;