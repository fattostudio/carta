import { loginWithGoogle } from '../api';
import { Btn } from '../components/ui';

export default function Login() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--white)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{
          fontFamily: 'var(--font-sign)', fontSize: 32, fontWeight: 800,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
        }}>Carta</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 40,
        }}>
          Newsletter digest
        </div>
        <div style={{ borderTop: '2px solid var(--black)', marginBottom: 40 }} />
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--grey-mid)',
          letterSpacing: '0.06em', lineHeight: 1.7, marginBottom: 32,
        }}>
          Connect your Gmail account to start building your weekly reading digest from your Carta label.
        </p>
        <Btn primary onClick={loginWithGoogle}>
          Login with Google
        </Btn>
      </div>
    </div>
  );
}
