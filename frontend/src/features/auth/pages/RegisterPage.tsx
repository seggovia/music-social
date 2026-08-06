import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/shared/components/ui';
import { ROUTES } from '@/shared/lib/constants';
import { AuthFormLayout } from '../components/AuthFormLayout';
import { useAuthStore } from '../stores/authStore';
import styles from '../components/AuthForm.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    try {
      await register({ email, password, username, display_name: displayName || undefined, bio });
      navigate(ROUTES.HOME);
    } catch {
      // El error del store se muestra dentro de la Card.
    }
  }

  return (
    <AuthFormLayout
      title="Crea tu cuenta"
      subtitle="Únete a la comunidad y empieza a compartir la música que te mueve."
      error={hasSubmitted ? error : null}
      alternatePrompt="¿Ya tienes cuenta?"
      alternateLabel="Inicia sesión"
      alternateTo={ROUTES.LOGIN}
    >
      <form className={styles.form} onSubmit={handleSubmit} aria-busy={isLoading}>
        <div className={styles.field}>
          <label htmlFor="register-email" className={styles.label}>Email</label>
          <Input
            id="register-email"
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
          <label htmlFor="register-password" className={styles.label}>Contraseña</label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Crea una contraseña"
            autoComplete="new-password"
            surface="secondary"
            className={styles.control}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="register-username" className={styles.label}>Username</label>
          <Input
            id="register-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="tu_username"
            autoComplete="username"
            surface="secondary"
            className={styles.control}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="register-display-name" className={styles.label}>Nombre visible</label>
          <Input
            id="register-display-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Cómo quieres que te llamen"
            autoComplete="name"
            surface="secondary"
            className={styles.control}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="register-bio" className={styles.label}>Bio</label>
          <textarea
            id="register-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Cuéntanos un poco sobre tus gustos musicales"
            className={styles.textarea}
            rows={3}
          />
        </div>

        <Button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
          {isLoading ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthFormLayout>
  );
}
