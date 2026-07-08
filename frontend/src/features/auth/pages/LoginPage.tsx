import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '@/shared/lib/constants';
import styles from '../components/AuthForm.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login({ email, password });
      navigate(ROUTES.HOME);
    } catch {
      // El toast global muestra el error.
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Login</h1>
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
        <button type="submit" disabled={isLoading} className={styles.submitButton}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className={styles.footer}>
        No account? <Link to={ROUTES.REGISTER}>Create one</Link>
      </p>
    </div>
  );
}
