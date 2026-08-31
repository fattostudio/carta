import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import IntakeSubTabs from './components/IntakeSubTabs';
import Sources from './pages/Sources';
import Schedule from './pages/Schedule';
import Design from './pages/Design';
import Digests from './pages/Digests';
import DigestView from './pages/DigestView';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import { getAuthStatus } from './api';
import { isOnboarded } from './store';
import { useMobile } from './hooks/useMobile';

function Shell({ isMobile }) {
  const onIntake = useLocation().pathname.startsWith('/intake');
  return (
    <div style={{ display: 'flex' }}>
      {!isMobile && <Sidebar />}
      <main style={{
        marginLeft: isMobile ? 0 : 200,
        flex: 1,
        background: 'var(--white)',
        minHeight: '100vh',
        paddingBottom: isMobile ? (onIntake ? 104 : 60) : 0,
      }}>
        <Routes>
          <Route path="/" element={<Navigate to="/digests" replace />} />
          <Route path="/digests"        element={<Digests />} />
          <Route path="/digests/:id"    element={<DigestView />} />
          <Route path="/intake"         element={<Navigate to="/intake/sources" replace />} />
          <Route path="/intake/sources"  element={<Sources />} />
          <Route path="/intake/schedule" element={<Schedule />} />
          <Route path="/design"         element={<Design />} />
          {/* Legacy paths from before Sources + Schedule were grouped under Intake */}
          <Route path="/sources"  element={<Navigate to="/intake/sources" replace />} />
          <Route path="/triggers" element={<Navigate to="/intake/schedule" replace />} />
        </Routes>
      </main>
      {isMobile && onIntake && <IntakeSubTabs />}
      {isMobile && <TabBar />}
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(null);
  const [onboarded, setOnboarded] = useState(isOnboarded);
  const isMobile = useMobile();

  useEffect(() => {
    getAuthStatus()
      .then(({ authenticated }) => setAuth(authenticated))
      // No API runs under `vite dev`, so /api/auth/* always fails locally. When
      // developing, `localStorage.carta-dev-bypass = '1'` lets you through to the
      // gated pages. `import.meta.env.DEV` is false in any production build, so
      // this can never open the gate on the deployed site.
      .catch(() => setAuth(import.meta.env.DEV && localStorage.getItem('carta-dev-bypass') === '1'));
  }, []);

  if (auth === null) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-light)', letterSpacing: '0.1em' }}>
      Loading...
    </div>
  );

  if (!auth) return <Login />;

  if (!onboarded) return <Onboarding onComplete={() => setOnboarded(true)} />;

  return (
    <BrowserRouter>
      <Shell isMobile={isMobile} />
    </BrowserRouter>
  );
}
