import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useState } from 'react';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt.js';
import { useClientPlatformInfo } from '../../hooks/useClientPlatformInfo.js';
import { getTeamPushPermission, isTeamPushSupported } from '../../utils/teamPush.js';
import { OP_CARD_RADIUS, OP_CONTROL_RADIUS, OP_INNER_RADIUS } from '../../theme/operationalRadii.js';

export default function TabletSetupCard({
  showInstallStep = true,
  showPushStep = false,
  pushEnabled = false,
  pushActive = false,
  pushLoading = false,
  pushSupported = null,
  pushPermission = '',
  pushScopeLabel = '',
  onActivatePush = null,
  onTestPush = null,
}) {
  const { isInstalled, canPromptInstall, promptInstall } = usePwaInstallPrompt();
  const {
    formFactor,
    formFactorLabel,
    osLabel,
    browser,
    browserLabel,
    isDesktop,
    isAndroid,
    isIOS,
  } = useClientPlatformInfo();
  const [installNotice, setInstallNotice] = useState('');
  const detectedPushSupported = isTeamPushSupported();
  const effectivePushSupported = typeof pushSupported === 'boolean' ? pushSupported : detectedPushSupported;
  const effectivePushPermission = pushPermission || getTeamPushPermission();

  const isPreferredDesktopBrowser = browser === 'chrome' || browser === 'edge';
  const isPreferredAndroidBrowser = isAndroid && (browser === 'chrome' || browser === 'edge');
  const isPreferredIOSBrowser = isIOS && browser === 'safari';
  const installOptional = false;
  const installComplete = !showInstallStep || isInstalled;

  const handleInstall = async () => {
    const accepted = await promptInstall();

    if (!accepted) {
      setInstallNotice(
        isDesktop
          ? `Si no ves el botón del sistema, abre el menú de ${browserLabel} y busca "Instalar app" o "Aplicaciones".`
          : `Si no ves el botón del sistema, abre el menú de ${browserLabel} y toca "Instalar app".`
      );
      return;
    }

    setInstallNotice(
      isDesktop
        ? 'La instalación quedó en marcha. Si el sistema lo pide, confirma para dejar la app disponible en este equipo.'
        : 'La instalación quedó en marcha. Si el sistema lo pide, confirma para dejar la app en la pantalla principal.'
    );
  };

  const isReady = showPushStep ? installComplete && (!pushEnabled || pushActive) : installComplete;
  const installTitle =
    formFactor === 'desktop'
      ? 'Deja este equipo listo'
      : formFactor === 'phone'
        ? 'Deja este teléfono listo'
        : 'Deja esta tablet lista';
  const installStepLabel = installOptional ? 'Paso 1 opcional: instala la app' : 'Paso 1: instala la app';
  const installHelp = canPromptInstall
    ? isDesktop
      ? `Instala la app en ${browserLabel} sobre ${osLabel} para abrirla más rápido y dejarla separada del resto del navegador.`
      : `Instala la app desde ${browserLabel} para abrirla rápido y recibir mejor los avisos en ${formFactorLabel.toLowerCase()}.`
    : isPreferredDesktopBrowser
      ? `En ${browserLabel} sobre ${osLabel}, busca "Instalar app" en la barra o en el menú para dejar esta pantalla como app separada.`
      : isPreferredAndroidBrowser
        ? `En ${browserLabel} sobre Android, abre el menú del navegador y toca "Instalar app".`
        : isPreferredIOSBrowser
          ? 'En Safari, usa compartir y luego "Agregar a pantalla principal".'
          : isAndroid
            ? 'Para una instalación más clara en Android, abre esta misma pantalla en Google Chrome o Microsoft Edge.'
            : isIOS
              ? 'Para una instalación más clara en iPhone o iPad, abre esta misma pantalla en Safari.'
              : 'Para la mejor compatibilidad de avisos en PC, usa Google Chrome o Microsoft Edge.';
  const pushSupportLabel = effectivePushSupported ? 'Avisos compatibles aquí' : 'Avisos no disponibles aquí';
  const pushSupportColor = effectivePushSupported ? 'success' : 'warning';
  const pushPermissionLabel =
    effectivePushPermission === 'granted'
      ? 'Permiso concedido'
      : effectivePushPermission === 'denied'
        ? 'Permiso bloqueado'
        : 'Permiso pendiente';
  const environmentSummary = effectivePushSupported
    ? isDesktop
      ? `Esta PC con ${browserLabel} puede recibir avisos del sistema.`
      : `Este ${formFactorLabel.toLowerCase()} con ${browserLabel} puede recibir avisos del sistema.`
    : isDesktop
      ? `En esta PC con ${browserLabel} los avisos no están disponibles.`
      : `En este ${formFactorLabel.toLowerCase()} con ${browserLabel} los avisos no están disponibles.`;

  if (isReady) {
    return null;
  }

  return (
    <Box
      sx={{
        borderRadius: OP_CARD_RADIUS,
        border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
        background: (theme) => theme.appBrand.dialogBackground,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 24 }}>
            {installTitle}
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
            {`Estás en ${formFactorLabel.toLowerCase()} usando ${browserLabel} sobre ${osLabel}. Sigue estos pasos para abrir rápido la app y dejar los avisos bien configurados.`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" variant="outlined" label={`Equipo: ${formFactorLabel}`} />
          <Chip size="small" variant="outlined" label={`Sistema: ${osLabel}`} />
          <Chip size="small" variant="outlined" label={`Navegador: ${browserLabel}`} />
          <Chip size="small" variant="outlined" color={pushSupportColor} label={pushSupportLabel} />
          {showPushStep ? (
            <Chip
              size="small"
              variant="outlined"
              color={effectivePushPermission === 'granted' ? 'success' : effectivePushPermission === 'denied' ? 'warning' : 'default'}
              label={pushPermissionLabel}
            />
          ) : null}
        </Stack>

        <Alert severity={effectivePushSupported ? 'success' : 'warning'}>{environmentSummary}</Alert>

        {showInstallStep ? (
          <Box
            sx={{
              p: 1.4,
              borderRadius: OP_INNER_RADIUS,
              border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
              background: (theme) => theme.appBrand.frostedPanel,
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  color={isInstalled ? 'success' : installOptional ? 'default' : 'warning'}
                  variant="outlined"
                  icon={isInstalled ? <CheckCircleOutlineRoundedIcon /> : <DownloadRoundedIcon />}
                  label={isInstalled ? 'App instalada' : installStepLabel}
                />
                {!isInstalled ? (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={handleInstall}
                    sx={{ borderRadius: OP_CONTROL_RADIUS }}
                  >
                    Instalar app
                  </Button>
                ) : null}
              </Stack>
              <Typography sx={{ color: 'text.secondary' }}>
                {isInstalled
                  ? isDesktop
                    ? 'La app ya está lista en este equipo.'
                    : 'La app ya está lista en la pantalla principal de este dispositivo.'
                  : installHelp}
              </Typography>
            </Stack>
          </Box>
        ) : null}

        {showPushStep ? (
          <Box
            sx={{
              p: 1.4,
              borderRadius: OP_INNER_RADIUS,
              border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
              background: (theme) => theme.appBrand.frostedPanel,
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  color={pushActive ? 'success' : pushEnabled ? 'warning' : 'default'}
                  variant="outlined"
                  icon={<NotificationsActiveOutlinedIcon />}
                  label={pushActive ? 'Paso 2 listo: avisos activos' : 'Paso 2: activa los avisos'}
                />
                {!pushActive && pushEnabled && typeof onActivatePush === 'function' ? (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<NotificationsActiveOutlinedIcon />}
                    disabled={pushLoading}
                    onClick={onActivatePush}
                    sx={{ borderRadius: OP_CONTROL_RADIUS }}
                  >
                    Activar avisos
                  </Button>
                ) : null}
                {pushActive && typeof onTestPush === 'function' ? (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={pushLoading}
                    onClick={onTestPush}
                    sx={{ borderRadius: OP_CONTROL_RADIUS }}
                  >
                    Probar aviso
                  </Button>
                ) : null}
              </Stack>
              <Typography sx={{ color: 'text.secondary' }}>
                {!effectivePushSupported
                  ? isDesktop
                    ? `En ${browserLabel} sobre ${osLabel} los avisos no están disponibles aquí. Para esta PC, usa Google Chrome o Microsoft Edge.`
                    : isIOS
                      ? 'Para recibir avisos en iPhone o iPad, abre esta pantalla en Safari y agrega la app a la pantalla principal.'
                      : 'Para recibir avisos en este dispositivo, usa Google Chrome o Microsoft Edge.'
                  : pushActive
                    ? `Esta pantalla ya puede avisarte sobre ${pushScopeLabel || 'tu área de trabajo'}.`
                    : pushEnabled
                      ? effectivePushPermission === 'denied'
                        ? 'El navegador bloqueó los avisos. Permítelos en la configuración del sitio y vuelve a intentar.'
                        : isDesktop
                          ? 'Activa los avisos para que esta PC te avise aunque la app no esté al frente.'
                          : 'Activa los avisos para que este dispositivo te avise aunque la app no esté abierta.'
                      : 'Los avisos todavía no están activados en la configuración general del sitio.'}
              </Typography>
            </Stack>
          </Box>
        ) : null}

        {showInstallStep && !isInstalled ? (
          <Alert severity="info">
            {isPreferredDesktopBrowser
              ? `En ${browserLabel}, busca "Instalar app" en la barra de direcciones o en el menú del navegador.`
              : isPreferredAndroidBrowser
                ? `En ${browserLabel}, abre el menú de arriba a la derecha y toca Instalar app.`
                : isPreferredIOSBrowser
                  ? 'En Safari, usa compartir y luego Agregar a pantalla principal.'
                  : isDesktop
                    ? 'Si quieres avisos y una instalación más clara en PC, abre esta pantalla en Google Chrome o Microsoft Edge.'
                    : 'Si este navegador no te da la opción de instalar, abre esta pantalla en Google Chrome o Microsoft Edge.'}
          </Alert>
        ) : null}

        {installNotice ? <Alert severity="success">{installNotice}</Alert> : null}
      </Stack>
    </Box>
  );
}
