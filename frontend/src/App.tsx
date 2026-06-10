import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/shared/components/Layout';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';
import { ROUTES } from '@/shared/lib/constants';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PlaceholderPage title="music-social" />} />
        <Route path={ROUTES.ALBUMS} element={<PlaceholderPage title="Albums" />} />
        <Route path={ROUTES.ARTISTS} element={<PlaceholderPage title="Artists" />} />
        <Route path={ROUTES.REVIEWS} element={<PlaceholderPage title="Reviews" />} />
        <Route path={ROUTES.MESSAGES} element={<PlaceholderPage title="Messages" />} />
        <Route path={ROUTES.USERS} element={<PlaceholderPage title="Users" />} />
        <Route path={ROUTES.LOGIN} element={<PlaceholderPage title="Login" />} />
      </Route>
    </Routes>
  );
}
