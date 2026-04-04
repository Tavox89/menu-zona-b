import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WaiterShell from '../components/waiter/WaiterShell.jsx';
import { useWaiterSession } from '../context/WaiterSessionContext.jsx';
import useTableContext from '../hooks/useTableContext.js';
import useWaiterLiveStream from '../hooks/useWaiterLiveStream.js';
import Home from './Home.jsx';

export default function WaiterMenuPage() {
  const navigate = useNavigate();
  const { session } = useWaiterSession();
  const [searchParams] = useSearchParams();
  const tableToken = searchParams.get('table_token') || '';
  const {
    context,
    initialLoading,
    refreshing,
    error,
    lastUpdatedAt,
    refresh,
  } = useTableContext({
    tableToken,
    enabled: Boolean(tableToken),
    refreshIntervalMs: 12000,
  });

  useWaiterLiveStream({
    sessionToken: session?.session_token || '',
    scope: 'service',
    enabled: Boolean(session?.session_token && tableToken),
    onSync: refresh,
  });

  if (!tableToken) {
    return (
      <WaiterShell title="Tomar pedido" subtitle="Selecciona una mesa para empezar.">
        <Stack spacing={2}>
          <Alert severity="info">Elige una mesa para abrir la carta y cargar el pedido.</Alert>
          <Button variant="contained" onClick={() => navigate('/equipo/servicio')}>
            Ver servicio
          </Button>
        </Stack>
      </WaiterShell>
    );
  }

  if (initialLoading && !context) {
    return <Box sx={{ minHeight: '100dvh' }} />;
  }

  if (error || !context) {
    return (
      <WaiterShell title="Tomar pedido" subtitle="No pudimos abrir esta mesa.">
        <Stack spacing={2}>
          <Alert severity="error">
            {error || 'Esta mesa ya no está disponible en este momento.'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/equipo/servicio')}>
            Volver al servicio
          </Button>
        </Stack>
      </WaiterShell>
    );
  }

  return (
    <Home
      orderMode="waiter"
      tableContext={context}
      waiterSession={session}
      onWaiterDirectOrderSuccess={refresh}
      onServiceContextRefresh={refresh}
      serviceRefreshing={refreshing}
      serviceLastUpdatedAt={lastUpdatedAt}
    />
  );
}
