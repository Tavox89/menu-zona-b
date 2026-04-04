import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useWaiterSession } from '../context/WaiterSessionContext.jsx';
import {
  getPreferredStandaloneEntry,
  isAllowedAppEntry,
  rememberTeamLaunchPath,
} from '../utils/appLaunchPreference.js';
import { OP_CONTROL_RADIUS, OP_PANEL_RADIUS } from '../theme/operationalRadii.js';

function resolveTeamLoginTarget(location) {
  const requestedPath = String(location?.state?.from?.pathname || '').trim();
  const requestedSearch = String(location?.state?.from?.search || '').trim();

  if (requestedPath && requestedPath !== '/equipo' && isAllowedAppEntry(requestedPath)) {
    return `${requestedPath}${requestedSearch}`;
  }

  const standalonePath = getPreferredStandaloneEntry();
  if (standalonePath) {
    return standalonePath;
  }

  return '/equipo/pedidos';
}

function getTeamLoginCopy(targetPath) {
  if (String(targetPath || '').startsWith('/equipo/cocina')) {
    return {
      title: 'Acceso a cocina',
      subtitle: 'Ingresa tu PIN para operar la estación de cocina.',
    };
  }

  if (String(targetPath || '').startsWith('/equipo/horno')) {
    return {
      title: 'Acceso a horno',
      subtitle: 'Ingresa tu PIN para operar la estación de horno.',
    };
  }

  if (String(targetPath || '').startsWith('/equipo/barra')) {
    return {
      title: 'Acceso a barra',
      subtitle: 'Ingresa tu PIN para operar la estación de barra.',
    };
  }

  return {
    title: 'Acceso del equipo',
    subtitle: 'Ingresa tu PIN para ver pedidos y mesas.',
  };
}

export default function WaiterLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, submitting, error, clearError, isAuthenticated } = useWaiterSession();
  const [form, setForm] = useState({
    pin: '',
  });
  const targetPath = resolveTeamLoginTarget(location);
  const loginCopy = getTeamLoginCopy(targetPath);

  useEffect(() => {
    rememberTeamLaunchPath(targetPath);
  }, [targetPath]);

  if (isAuthenticated) {
    return <Navigate to={targetPath} replace />;
  }

  const handleChange = (field) => (event) => {
    clearError();
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login({
        pin: form.pin,
        deviceLabel:
          typeof navigator !== 'undefined' && navigator.userAgent
            ? navigator.userAgent.slice(0, 80)
            : 'Panel del equipo',
      });
      navigate(targetPath, { replace: true });
    } catch {
      // handled by context error state
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', py: 3 }}>
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: OP_PANEL_RADIUS,
            border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
            background: (theme) => theme.appBrand.dialogBackground,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at top right, rgba(230, 189, 23, 0.14) 0%, transparent 40%)',
              pointerEvents: 'none',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {loginCopy.title}
                </Typography>
                <Typography sx={{ mt: 0.8, color: 'text.secondary' }}>
                  {loginCopy.subtitle}
                </Typography>
              </Box>

              {error ? <Alert severity="error">{error}</Alert> : null}

              <TextField
                label="PIN"
                value={form.pin}
                onChange={handleChange('pin')}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                autoComplete="one-time-code"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: OP_CONTROL_RADIUS,
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{ borderRadius: OP_CONTROL_RADIUS }}
              >
                {submitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
