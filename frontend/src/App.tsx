import { Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { AlbumPage, SearchPage } from '@/features/albums';
import { ArtistPage } from '@/features/artists/pages/ArtistPage';
import { ChartsPage } from '@/features/charts';
import { UserProfilePage } from '@/features/users/pages/UserProfilePage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { Layout } from '@/shared/components/Layout';
import { PlaceholderPage } from '@/shared/components/PlaceholderPage';
import { PrivateRoute } from '@/shared/components/PrivateRoute';
import { ROUTES } from '@/shared/lib/constants';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PlaceholderPage title="music-social" />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        <Route element={<PrivateRoute />}>
          <Route path={ROUTES.ALBUMS} element={<SearchPage />} />
          <Route path={`${ROUTES.ALBUMS}/:id`} element={<AlbumPage />} />
          <Route path={`${ROUTES.ARTISTS}/:mbid`} element={<ArtistPage />} />
          <Route path={ROUTES.ARTISTS} element={<PlaceholderPage title="Artists" />} />
          <Route path={ROUTES.REVIEWS} element={<PlaceholderPage title="Reviews" />} />
          <Route path={ROUTES.MESSAGES} element={<PlaceholderPage title="Messages" />} />
          <Route path={ROUTES.USERS} element={<UsersListPage />} />
          <Route path={`${ROUTES.USERS}/:username`} element={<UserProfilePage />} />
          <Route path={ROUTES.CHARTS} element={<ChartsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}