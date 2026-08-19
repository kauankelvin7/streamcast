import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Falha no login: ' + err.message);
    }
  }

  async function handleGoogleLogin() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/');
    } catch (err: any) {
      setError('Falha no Google login: ' + err.message);
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0F0F0F', color: '#fff', padding: 20
    }}>
      <div style={{
        width: 360, background: '#1A1A1A', padding: 40, borderRadius: 16,
        border: '1px solid #2A2A2A'
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 24, textAlign: 'center' }}>Streamcast</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input 
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: 12, borderRadius: 8, background: '#2A2A2A', border: 'none', color: '#fff' }}
          />
          <input 
            type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: 12, borderRadius: 8, background: '#2A2A2A', border: 'none', color: '#fff' }}
          />
          <button type="submit" style={{
            padding: 12, borderRadius: 8, background: '#00A8E1', border: 'none',
            color: '#fff', fontWeight: 500, cursor: 'pointer'
          }}>
            Entrar
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', color: '#666', fontSize: 14 }}>OU</div>

        <button onClick={handleGoogleLogin} style={{
          width: '100%', padding: 12, borderRadius: 8, background: 'transparent',
          border: '1px solid #2A2A2A', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          Entrar com Google
        </button>

        {error && <p style={{ color: '#ff4d4d', fontSize: 13, marginTop: 16, textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
}
