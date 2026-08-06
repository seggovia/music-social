import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import { AuthFormLayout } from '../components/AuthFormLayout';
import { useAuthStore } from '../stores/authStore';
import styles from '../components/AuthForm.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    try {
      await login({ email, password });
      navigate(ROUTES.HOME);
    } catch {
      // El error del store se muestra dentro de la Card.
    }
  }

  return (
    <AuthFormLayout
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para volver a tus álbumes, reseñas y conversaciones."
      error={hasSubmitted ? error : null}
      alternatePrompt="¿No tienes cuenta?"
      alternateLabel="Regístrate"
      alternateTo={ROUTES.REGISTER}
    >
      <form className={styles.form} onSubmit={handleSubmit} aria-busy={isLoading}>
        <div className={styles.field}>
          <label htmlFor="login-email" className={styles.label}>Email</label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            surface="secondary"
            className={styles.control}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="login-password" className={styles.label}>Contraseña</label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            surface="secondary"
            className={styles.control}
            required
          />
        </div>

        <Button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
          {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </Button>
      </form>
    </AuthFormLayout>
  );
}
