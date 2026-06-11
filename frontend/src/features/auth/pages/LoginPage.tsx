import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '@/shared/lib/constants';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login({ email, password });
    navigate(ROUTES.HOME);
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button type="submit" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      <p>
        No account? <Link to={ROUTES.REGISTER}>Create one</Link>
      </p>
    </div>
  );
}
