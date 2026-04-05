import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import TableLanding from '../pages/TableLanding.jsx';
import TableMenuPage from '../pages/TableMenuPage.jsx';
import WaiterLoginPage from '../pages/WaiterLoginPage.jsx';
import WaiterQueuePage from '../pages/WaiterQueuePage.jsx';
import WaiterTablesPage from '../pages/WaiterTablesPage.jsx';
import WaiterMenuPage from '../pages/WaiterMenuPage.jsx';
import TeamProductionPage from '../pages/TeamProductionPage.jsx';
import { useWaiterSession } from '../context/WaiterSessionContext.jsx';
import { getPreferredStandaloneEntry, getRequestedAppEntry } from '../utils/appLaunchPreference.js';
import { getWaiterDefaultPath, isWaiterPathAllowed } from '../utils/waiterAccess.js';

function WaiterProtectedRoutes() {
  const { isAuthenticated, session } = useWaiterSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/equipo" replace state={{ from: location }} />;
  }

  if (!isWaiterPathAllowed(session, location.pathname)) {
    return (
      <Navigate
        to={{ pathname: getWaiterDefaultPath(session), search: location.search }}
        replace
      />
    );
  }

  return <Outlet />;
}

function LegacyTeamRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={{ pathname: to, search: location.search }} replace />;
}

function RootEntry() {
  const location = useLocation();
  const requestedPath = getRequestedAppEntry(location.search);

  if (requestedPath) {
    return <Navigate to={requestedPath} replace />;
  }

  const nextPath = getPreferredStandaloneEntry();

  if (nextPath) {
    return <Navigate to={nextPath} replace />;
  }

  return <Home />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootEntry />} />
        <Route path="/mesa" element={<TableLanding />} />
        <Route path="/mesa/menu" element={<TableMenuPage />} />
        <Route path="/equipo" element={<WaiterLoginPage />} />
        <Route element={<WaiterProtectedRoutes />}>
          <Route path="/equipo/pedidos" element={<WaiterQueuePage />} />
          <Route path="/equipo/servicio" element={<WaiterTablesPage />} />
          <Route path="/equipo/menu" element={<WaiterMenuPage />} />
          <Route path="/equipo/cocina" element={<TeamProductionPage station="kitchen" />} />
          <Route path="/equipo/horno" element={<TeamProductionPage station="horno" />} />
          <Route path="/equipo/barra" element={<TeamProductionPage station="bar" />} />
        </Route>
        <Route path="/mesero" element={<Navigate to="/equipo" replace />} />
        <Route path="/mesero/cola" element={<LegacyTeamRedirect to="/equipo/pedidos" />} />
        <Route path="/mesero/mesas" element={<LegacyTeamRedirect to="/equipo/servicio" />} />
        <Route path="/mesero/menu" element={<LegacyTeamRedirect to="/equipo/menu" />} />
      </Routes>
    </BrowserRouter>
  );
}
