import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '@/shared/lib/constants';
import styles from '../components/AuthForm.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await register({ email, password, username, display_name: displayName || undefined, bio });
      navigate(ROUTES.HOME);
    } catch {
      // El toast global muestra el error.
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Register</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={styles.input}
        />
        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className={styles.input}
        />
        <button type="submit" disabled={isLoading} className={styles.submitButton}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className={styles.footer}>
        Already have one? <Link to={ROUTES.LOGIN}>Sign in</Link>
      </p>
    </div>
  );
}
