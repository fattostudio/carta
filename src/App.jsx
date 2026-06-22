import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import Sources from './pages/Sources';
import Triggers from './pages/Triggers';
import Design from './pages/Design';
import Digests from './pages/Digests';
import DigestView from './pages/DigestView';
import Login from './pages/Login';
import { getAuthStatus } from './api';
import { useMobile } from './hooks/useMobile';

export default function App() {
  const [auth, setAuth] = useState(null);
  const isMobile = useMobile();

  useEffect(() => {
    getAuthStatus()
      .then(({ authenticated }) => setAuth(authenticated))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-light)', letterSpacing: '0.1em' }}>
      Loading...
    </div>
  );

  if (!auth) return <Login />;

  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        {!isMobile && <Sidebar />}
        <main style={{
          marginLeft: isMobile ? 0 : 200,
          flex: 1,
          background: 'var(--white)',
          minHeight: '100vh',
          paddingBottom: isMobile ? 60 : 0,
        }}>
          <Routes>
            <Route path="/" element={<Navigate to="/digests" replace />} />
            <Route path="/digests"        element={<Digests />} />
            <Route path="/digests/:id"    element={<DigestView />} />
            <Route path="/sources"        element={<Sources />} />
            <Route path="/triggers"       element={<Triggers />} />
            <Route path="/design"         element={<Design />} />
          </Routes>
        </main>
        {isMobile && <TabBar />}
      </div>
    </BrowserRouter>
  );
}
