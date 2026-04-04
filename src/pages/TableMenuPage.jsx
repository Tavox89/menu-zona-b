import { useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router-dom';
import TableWaiterRequestDialog from '../components/table/TableWaiterRequestDialog.jsx';
import useTableContext from '../hooks/useTableContext.js';
import useTableMessages from '../hooks/useTableMessages.js';
import { postTableMessage } from '../services/tableService.js';
import Home from './Home.jsx';

export default function TableMenuPage() {
  const [searchParams] = useSearchParams();
  const [requestOpen, setRequestOpen] = useState(false);
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [messageError, setMessageError] = useState('');
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
    refreshIntervalMsVisible: 4000,
    refreshIntervalMsHidden: 12000,
    liveEnabled: false,
  });
  const {
    messages,
    pendingCount,
    refreshing: messagesRefreshing,
    error: messagesError,
    lastUpdatedAt: messagesLastUpdatedAt,
    refresh: refreshMessages,
  } = useTableMessages({
    tableToken,
    enabled: Boolean(tableToken),
    refreshIntervalMsVisible: 4000,
    refreshIntervalMsHidden: 12000,
    liveEnabled: false,
  });

  async function handleSendMessage(text, type = 'free_text') {
    setMessageSubmitting(true);
    setMessageError('');

    try {
      await postTableMessage({
        tableToken,
        messageText: text,
        messageType: type,
      });

      await Promise.all([refresh(), refreshMessages()]);
      return true;
    } catch (err) {
      setMessageError(
        String(err?.response?.data?.message || err?.message || 'No se pudo enviar el mensaje.')
      );
      return false;
    } finally {
      setMessageSubmitting(false);
    }
  }

  if (initialLoading && !context) {
    return <Box sx={{ minHeight: '100dvh' }} />;
  }

  if (!tableToken || error || !context) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              No pudimos abrir el menú de mesa
            </Typography>
            <Alert severity="error">
              {error || 'No pudimos abrir esta mesa. Escanea de nuevo el código y vuelve a intentarlo.'}
            </Alert>
            <Button variant="contained" onClick={refresh}>
              Reintentar
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <>
      <Home
        orderMode="table"
        tableContext={context}
        onTableRequestSuccess={refresh}
        onOpenTableWaiterRequest={() => setRequestOpen(true)}
        tableMessagesPendingCount={pendingCount}
        serviceRefreshing={refreshing || messagesRefreshing}
        serviceLastUpdatedAt={Math.max(
          Number(lastUpdatedAt || 0),
          Number(messagesLastUpdatedAt || 0)
        )}
      />
      <TableWaiterRequestDialog
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        messages={messages}
        pendingCount={pendingCount}
        error={messagesError || messageError}
        onRefresh={() => {
          refresh();
          refreshMessages();
        }}
        onSend={handleSendMessage}
        submitting={messageSubmitting}
        ownerDisplayName={String(context?.owner_display_name || '').trim()}
        sharedMode={Boolean(context?.shared_mode)}
      />
    </>
  );
}
