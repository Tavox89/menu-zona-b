import { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import { OP_CARD_RADIUS, OP_CONTROL_RADIUS, OP_INNER_RADIUS } from '../../theme/operationalRadii.js';

const QUICK_SUGGESTIONS = [
  'Necesito al mesero',
  '¿Cómo va mi pedido?',
  'Necesito la cuenta',
  'Quiero pedir algo más',
];

function formatTimeLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMessageTone(message) {
  const role = String(message?.sender_role || '').trim();

  if (role === 'waiter') {
    return {
      align: 'flex-end',
      bg: 'linear-gradient(135deg, rgba(230, 189, 23, 0.18) 0%, rgba(230, 189, 23, 0.08) 100%)',
      color: 'text.primary',
      borderColor: 'rgba(230, 189, 23, 0.22)',
    };
  }

  if (role === 'system') {
    return {
      align: 'center',
      bg: 'rgba(89, 197, 112, 0.12)',
      color: 'success.light',
      borderColor: 'rgba(89, 197, 112, 0.24)',
    };
  }

  return {
    align: 'flex-start',
    bg: 'rgba(255,255,255,0.05)',
    color: 'text.primary',
    borderColor: 'rgba(255,255,255,0.08)',
  };
}

export default function TableWaiterRequestDialog({
  open,
  onClose,
  messages = [],
  loading = false,
  error = '',
  pendingCount = 0,
  onRefresh,
  onSend,
  submitting = false,
  ownerDisplayName = '',
  sharedMode = false,
}) {
  const [draft, setDraft] = useState('');
  const messagesContainerRef = useRef(null);

  const helperLabel = useMemo(() => {
    if (sharedMode) {
      return 'Tu mensaje llegará al equipo de servicio que está atendiendo esta cuenta.';
    }

    if (ownerDisplayName) {
      return `Tu mensaje llegará a ${ownerDisplayName}.`;
    }

    return 'Tu mensaje llegará al equipo de servicio disponible.';
  }, [ownerDisplayName, sharedMode]);

  async function handleSend(messageText, messageType = 'free_text') {
    const trimmed = String(messageText || '').trim();
    if (!trimmed || typeof onSend !== 'function') {
      return;
    }

    const result = await onSend(trimmed, messageType);
    if (result !== false) {
      setDraft('');
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [messages, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
          background: (theme) => theme.appBrand.dialogBackground,
          boxShadow: '0 28px 64px rgba(0,0,0,0.32)',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1.2,
          background:
            'radial-gradient(circle at top right, rgba(230, 189, 23, 0.12) 0%, transparent 48%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.4}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Avatar
              variant="rounded"
              sx={{
                width: 52,
                height: 52,
                bgcolor: 'rgba(230, 189, 23, 0.18)',
                color: 'primary.main',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <SupportAgentRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Solicitar al mesero
              </Typography>
              <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>
                Envía un mensaje breve o usa una sugerencia rápida.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {ownerDisplayName ? (
              <Chip
                variant="outlined"
                icon={<BadgeRoundedIcon />}
                label={`Atiende ${ownerDisplayName}`}
              />
            ) : null}
            {sharedMode ? (
              <Chip variant="outlined" color="warning" icon={<GroupsRoundedIcon />} label="Mesa compartida" />
            ) : null}
            <Chip variant="outlined" color={pendingCount > 0 ? 'warning' : 'default'} label={`${pendingCount} pendientes`} />
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.6 }}>
        <Stack spacing={1.5}>
          <Alert severity="info">{helperLabel}</Alert>
          {error ? <Alert severity="warning">{error}</Alert> : null}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <Chip
                key={suggestion}
                clickable
                onClick={() => handleSend(suggestion, 'preset')}
                icon={<ChatBubbleOutlineRoundedIcon />}
                label={suggestion}
                sx={{ borderRadius: 999 }}
              />
            ))}
          </Stack>

          <Box
            ref={messagesContainerRef}
            sx={{
              maxHeight: 340,
              overflowY: 'auto',
              p: 1.1,
              borderRadius: OP_CARD_RADIUS,
              border: (theme) => `1px solid ${theme.appBrand.softBorderColor}`,
              background: (theme) => theme.appBrand.frostedPanel,
            }}
          >
            <Stack spacing={1}>
              {!messages.length && !loading ? (
                <Alert severity="info">Todavía no hay mensajes en esta mesa.</Alert>
              ) : null}

              {messages.map((message, index) => {
                const tone = getMessageTone(message);

                return (
                  <Stack
                    key={message.id || `${message.created_at}-${index}`}
                    spacing={0.6}
                    alignItems={tone.align}
                  >
                    <Box
                      sx={{
                        width: tone.align === 'center' ? '100%' : 'auto',
                        maxWidth: '86%',
                        p: 1.2,
                        borderRadius: OP_INNER_RADIUS,
                        border: '1px solid',
                        borderColor: tone.borderColor,
                        background: tone.bg,
                        color: tone.color,
                        boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
                      }}
                    >
                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                          {message.sender_label || (message.sender_role === 'customer' ? 'Tú' : 'Equipo')}
                        </Typography>
                        <Stack direction="row" spacing={0.6} alignItems="center">
                          <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {formatTimeLabel(message.created_at)}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography sx={{ mt: 0.6, whiteSpace: 'pre-wrap' }}>
                        {message.message_text}
                      </Typography>
                    </Box>
                    {index < messages.length - 1 ? <Divider sx={{ width: '100%', borderColor: 'divider' }} /> : null}
                  </Stack>
                );
              })}
            </Stack>
          </Box>

          <TextField
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe un mensaje breve para el mesero"
            multiline
            minRows={3}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
            <Button variant="outlined" onClick={onRefresh} disabled={loading} sx={{ borderRadius: OP_CONTROL_RADIUS }}>
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<SendRoundedIcon />}
              onClick={() => handleSend(draft, 'free_text')}
              disabled={submitting || !draft.trim()}
              sx={{ borderRadius: OP_CONTROL_RADIUS }}
            >
              Enviar mensaje
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
