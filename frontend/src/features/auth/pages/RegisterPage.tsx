import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '@/shared/lib/constants';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await register({ email, password, username, display_name: displayName || undefined, bio });
    navigate(ROUTES.HOME);
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <input type="text" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <input type="text" placeholder="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        <textarea placeholder="Bio" value={bio} onChange={(event) => setBio(event.target.value)} />
        <button type="submit" disabled={isLoading}>{isLoading ? 'Creating account...' : 'Create account'}</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      <p>
        Already have one? <Link to={ROUTES.LOGIN}>Sign in</Link>
      </p>
    </div>
  );
}
