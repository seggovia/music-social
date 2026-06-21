import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUsersStore } from '../stores/usersStore';
import styles from './UsersListPage.module.css';

export function UsersListPage() {
  const { list, isLoading, error, fetchList } = useUsersStore();

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  if (isLoading) return <p className={styles.page}>Loading users...</p>;
  if (error) return <p className={styles.page} role="alert">{error}</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Users</h1>
      {list.length === 0 ? (
        <p className={styles.empty}>No users found.</p>
      ) : (
        <div className={styles.grid}>
          {list.map((user) => {
            const initial = user.username.charAt(0).toUpperCase();
            return (
              <Link key={user.id} to={`/users/${user.username}`} className={styles.card}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>{initial}</div>
                )}
                <div>
                  <p className={styles.username}>{user.username}</p>
                  {user.display_name && <p className={styles.displayName}>{user.display_name}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}