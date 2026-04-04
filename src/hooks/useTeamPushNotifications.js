import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchWaiterPushConfig,
  scheduleWaiterPushTest,
  subscribeWaiterPush,
  testWaiterPush,
  updateWaiterPushContext,
  unsubscribeWaiterPush,
} from '../services/tableService.js';
import {
  clearTeamPushSession,
  getTeamPushPermission,
  getTeamPushSubscription,
  isTeamPushSupported,
  requestTeamPushPermission,
  requestTeamPushSync,
  serializeTeamPushSubscription,
  subscribeBrowserToPush,
  syncTeamPushContext,
  syncTeamPushSession,
  unsubscribeBrowserFromPush,
} from '../utils/teamPush.js';
import { triggerTeamAttentionFeedback } from '../utils/teamNotifications.js';

function buildDeviceLabel(waiterName = '') {
  if (typeof navigator === 'undefined') {
    return waiterName ? `Tablet de ${waiterName}` : 'Tablet del equipo';
  }

  const platform = navigator.userAgentData?.platform || navigator.platform || 'Tablet';
  const base = String(platform).trim() || 'Tablet';

  return waiterName ? `${base} de ${waiterName}` : `${base} del equipo`;
}

function getFriendlyPushError(err) {
  const status = Number(err?.response?.status || err?.response?.data?.data?.status || 0);
  const rawCode = String(err?.response?.data?.code || '').trim();
  const rawMessage = String(err?.response?.data?.message || err?.message || '').trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    status === 404 ||
    rawCode === 'rest_no_route' ||
    normalizedMessage.includes('ninguna ruta') ||
    normalizedMessage.includes('no route was found')
  ) {
    return 'Los avisos todavía no están disponibles en este sitio. Actualiza el backend y vuelve a intentar.';
  }

  if (normalizedMessage.includes('network error') || normalizedMessage.includes('failed to fetch')) {
    return 'No se pudo conectar con los avisos en este momento. Revisa la conexión y vuelve a intentar.';
  }

  if (status === 409) {
    if (normalizedMessage.includes('activa primero los avisos')) {
      return 'Este equipo ya tiene permiso del navegador, pero el sitio todavía no lo terminó de registrar para avisos. Actualiza el backend y vuelve a intentar.';
    }

    return rawMessage || 'Primero activa los avisos en este equipo.';
  }

  if (status === 503) {
    return 'Los avisos todavía no están preparados en la configuración general.';
  }

  if (rawMessage === 'push_sw_timeout') {
    return 'Esta pantalla todavía no terminó de preparar los avisos. Recarga la página y vuelve a intentar.';
  }

  return rawMessage || 'No se pudo preparar los avisos en este equipo.';
}

export function useTeamPushNotifications({ sessionToken, waiterName = '', scope = 'service' }) {
  const [pushState, setPushState] = useState({
    enabled: false,
    public_key: '',
    active: false,
    device_label: '',
    scope: 'service',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');
  const [checked, setChecked] = useState(false);
  const [permission, setPermission] = useState(getTeamPushPermission());
  const [scheduledTestSeconds, setScheduledTestSeconds] = useState(0);
  const supported = isTeamPushSupported();
  const scheduledTimeoutRef = useRef(0);
  const scheduledIntervalRef = useRef(0);
  const autoActivationKeyRef = useRef('');
  const deviceLabel = useMemo(() => buildDeviceLabel(waiterName), [waiterName]);

  const clearScheduledTest = useCallback(() => {
    if (scheduledTimeoutRef.current) {
      window.clearTimeout(scheduledTimeoutRef.current);
      scheduledTimeoutRef.current = 0;
    }

    if (scheduledIntervalRef.current) {
      window.clearInterval(scheduledIntervalRef.current);
      scheduledIntervalRef.current = 0;
    }

    setScheduledTestSeconds(0);
  }, []);

  const applyPushState = useCallback((nextState) => {
    const normalized = nextState && typeof nextState === 'object' ? nextState : {};
    setPushState({
      enabled: Boolean(normalized?.enabled),
      public_key: String(normalized?.public_key || ''),
      active: Boolean(normalized?.active),
      device_label: String(normalized?.device_label || ''),
      scope: String(normalized?.scope || 'service'),
    });
  }, []);

  const refreshPushState = useCallback(async () => {
    if (!sessionToken || !supported) {
      applyPushState({
        enabled: false,
        public_key: '',
        active: false,
        device_label: '',
        scope: 'service',
      });
      setStatusText('');
      setPermission(getTeamPushPermission());
      setChecked(true);
      return null;
    }

    const nextState = await fetchWaiterPushConfig({ sessionToken });
    applyPushState(nextState);
    setPermission(getTeamPushPermission());
    setChecked(true);

    return nextState;
  }, [applyPushState, sessionToken, supported]);

  useEffect(() => {
    if (!sessionToken || !supported) {
      clearTeamPushSession();
      clearScheduledTest();
      return;
    }

    syncTeamPushSession(sessionToken, { scope, deviceLabel }).catch(() => {});
  }, [clearScheduledTest, deviceLabel, scope, sessionToken, supported]);

  useEffect(() => clearScheduledTest, [clearScheduledTest]);

  useEffect(() => {
    if (!sessionToken || !supported) {
      return undefined;
    }

    let cancelled = false;

    refreshPushState().catch((err) => {
      if (cancelled) {
        return;
      }

      const message =
        getFriendlyPushError(err) ||
        'No se pudieron revisar los avisos de esta tablet.';

      setError(String(message));
      setChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshPushState, sessionToken, supported]);

  useEffect(() => {
    if (!sessionToken || !supported || !pushState.active) {
      return;
    }

    updateWaiterPushContext({ sessionToken, scope }).catch(() => {});
    syncTeamPushContext({ scope, deviceLabel }).catch(() => {});
  }, [deviceLabel, pushState.active, scope, sessionToken, supported]);

  const activatePush = useCallback(async (options = {}) => {
    if (!sessionToken) {
      return false;
    }

    const silent = Boolean(options && typeof options === 'object' && options.silent);

    if (!supported) {
      setError('Esta tablet no permite avisos desde el navegador actual.');
      return false;
    }

    setLoading(true);
    setError('');
    setStatusText(silent ? '' : 'Revisando la configuración de avisos...');

    try {
      const nextConfig = (await refreshPushState()) || {};
      const isEnabled = Boolean(nextConfig?.enabled);
      const publicKey = String(nextConfig?.public_key || '');

      if (!isEnabled || !publicKey) {
        throw new Error('Los avisos todavía no están listos en la configuración.');
      }

      const nextPermission =
        getTeamPushPermission() === 'granted'
          ? 'granted'
          : await requestTeamPushPermission();

      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        throw new Error('Permite los avisos de la tablet para recibir pedidos y productos listos.');
      }

      setStatusText(silent ? '' : 'Preparando los avisos en este equipo...');
      await syncTeamPushSession(sessionToken, { scope, deviceLabel });

      const browserSubscription = await subscribeBrowserToPush(publicKey);
      if (!browserSubscription) {
        throw new Error('No se pudo registrar esta tablet para recibir avisos.');
      }

      setStatusText(silent ? '' : 'Guardando este equipo para recibir avisos...');
      const subscribeResult = await subscribeWaiterPush({
        sessionToken,
        subscription: serializeTeamPushSubscription(browserSubscription),
        deviceLabel,
        scope,
      });

      const directState =
        subscribeResult?.push && typeof subscribeResult.push === 'object'
          ? subscribeResult.push
          : subscribeResult;
      applyPushState(directState);
      setPermission(getTeamPushPermission());

      setStatusText(silent ? '' : 'Terminando la activación...');
      await syncTeamPushContext({ scope, deviceLabel });
      const finalState =
        directState && typeof directState === 'object' && typeof directState.active !== 'undefined'
          ? directState
          : (await refreshPushState()) || {};
      requestTeamPushSync().catch(() => {});

      if (!finalState?.active) {
        throw new Error('Esta pantalla todavía no terminó de quedar registrada para recibir avisos. Recarga la página y vuelve a intentar.');
      }

      setStatusText('');

      return true;
    } catch (err) {
      const message =
        getFriendlyPushError(err) ||
        'No se pudieron activar los avisos de esta tablet.';

      setError(String(message));
      setStatusText('');
      return false;
    } finally {
      setLoading(false);
    }
  }, [applyPushState, deviceLabel, refreshPushState, scope, sessionToken, supported]);

  useEffect(() => {
    if (!sessionToken || !supported || loading || !pushState.enabled || pushState.active || permission !== 'granted') {
      return;
    }

    const autoKey = `${sessionToken}:${scope}`;
    if (autoActivationKeyRef.current === autoKey) {
      return;
    }

    autoActivationKeyRef.current = autoKey;
    activatePush({ silent: true }).then((ok) => {
      if (!ok) {
        autoActivationKeyRef.current = '';
      }
    });
  }, [
    activatePush,
    loading,
    permission,
    pushState.active,
    pushState.enabled,
    scope,
    sessionToken,
    supported,
  ]);

  const disablePush = useCallback(async () => {
    if (!sessionToken || !supported) {
      return false;
    }

    setLoading(true);
    setError('');
    setStatusText('Desactivando los avisos en este equipo...');

    try {
      await unsubscribeWaiterPush({ sessionToken });
      await unsubscribeBrowserFromPush();
      await clearTeamPushSession();
      await refreshPushState();
      setStatusText('');
      return true;
    } catch (err) {
      const message =
        getFriendlyPushError(err) ||
        'No se pudieron desactivar los avisos en esta tablet.';

      setError(String(message));
      setStatusText('');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshPushState, sessionToken, supported]);

  const sendTestPush = useCallback(async () => {
    if (!sessionToken || !supported) {
      return false;
    }

    setLoading(true);
    setError('');
    setStatusText('Enviando el aviso de prueba...');

    try {
      const existing = await getTeamPushSubscription();
      if (!existing || !pushState.active) {
        throw new Error('Activa primero los avisos en esta tablet.');
      }

      await testWaiterPush({ sessionToken });
      await requestTeamPushSync();
      await triggerTeamAttentionFeedback({
        soundEnabled: true,
        vibrationEnabled: true,
        force: true,
        profile:
          scope === 'kitchen' || scope === 'horno' || scope === 'bar' ? scope : 'test',
      });
      setStatusText('Aviso enviado. Revisa la notificación del navegador o del sistema.');
      return true;
    } catch (err) {
      const message =
        getFriendlyPushError(err) ||
        'No se pudo enviar el aviso de prueba.';

      setError(String(message));
      setStatusText('');
      return false;
    } finally {
      setLoading(false);
    }
  }, [pushState.active, scope, sessionToken, supported]);

  const scheduleTestPush = useCallback(
    async (delaySeconds = 10) => {
      if (!sessionToken || !supported) {
        return false;
      }

      const existing = await getTeamPushSubscription();
      if (!existing || !pushState.active) {
        setError('Activa primero los avisos en este equipo.');
        return false;
      }

      clearScheduledTest();
      setError('');
      setScheduledTestSeconds(delaySeconds);
      setStatusText(`Programando el aviso de prueba para ${delaySeconds} segundos...`);

      try {
        const result = await scheduleWaiterPushTest({ sessionToken, delaySeconds });
        const nextDelay = Math.max(3, Number(result?.delay_seconds || delaySeconds));
        setScheduledTestSeconds(nextDelay);
        setStatusText(`Minimiza esta pantalla ahora. El aviso de prueba saldrá en ${nextDelay} segundos.`);

        scheduledIntervalRef.current = window.setInterval(() => {
          setScheduledTestSeconds((current) => {
            if (current <= 1) {
              if (scheduledIntervalRef.current) {
                window.clearInterval(scheduledIntervalRef.current);
                scheduledIntervalRef.current = 0;
              }
              return 0;
            }

            return current - 1;
          });
        }, 1000);

        scheduledTimeoutRef.current = window.setTimeout(async () => {
          scheduledTimeoutRef.current = 0;
          if (scheduledIntervalRef.current) {
            window.clearInterval(scheduledIntervalRef.current);
            scheduledIntervalRef.current = 0;
          }

          try {
            await requestTeamPushSync();
            setStatusText('El aviso programado ya debería haberse enviado. Revisa el sistema.');
          } finally {
            setScheduledTestSeconds(0);
          }
        }, nextDelay * 1000 + 1000);

        return true;
      } catch (err) {
        const message =
          getFriendlyPushError(err) ||
          'No se pudo programar el aviso de prueba.';

        clearScheduledTest();
        setError(String(message));
        setStatusText('');
        return false;
      }
    },
    [clearScheduledTest, pushState.active, sessionToken, supported]
  );

  const clearPushError = useCallback(() => {
    setError('');
    setStatusText('');
  }, []);

  return useMemo(
    () => ({
      supported,
      permission,
      loading,
      error,
      statusText,
      checked,
      enabled: Boolean(pushState.enabled),
      active: Boolean(pushState.active),
      deviceLabel: pushState.device_label,
      scope: pushState.scope,
      scheduledTestSeconds,
      activatePush,
      disablePush,
      sendTestPush,
      scheduleTestPush,
      refreshPushState,
      clearPushError,
    }),
    [
      activatePush,
      clearPushError,
      disablePush,
      error,
      checked,
      statusText,
      loading,
      permission,
      pushState.active,
      pushState.device_label,
      pushState.enabled,
      pushState.scope,
      scheduledTestSeconds,
      refreshPushState,
      sendTestPush,
      scheduleTestPush,
      supported,
    ]
  );
}
