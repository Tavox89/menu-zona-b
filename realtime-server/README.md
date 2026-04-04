# Realtime Server

Sidecar Node para el panel del equipo.

## Flujo

1. El frontend del staff abre una sola conexión WebSocket a `wss://realtime.zonabclub.com/socket`.
2. El servidor Node valida `session_token` llamando a WordPress en:
   - `POST /wp-json/tavox/v1/realtime/waiter-auth`
3. WordPress sigue siendo la fuente de verdad y publica invalidaciones pequeñas a:
   - `POST http://127.0.0.1:4100/publish`
4. El socket sólo redistribuye eventos como:
   - `queue.sync`
   - `service.sync`
   - `production.sync`
   - `notifications.sync`
   - `table.message.new`
   - `table.message.reply`
   - `table.message.resolved`

## Variables

Usa `.env.example` como base:

- `PORT`
- `HOST`
- `SOCKET_PATH`
- `WP_AUTH_URL`
- `PUBLISH_SECRET`
- `ALLOWED_ORIGINS`

## Notas de despliegue

- Montarlo en el mismo servidor bajo un subdominio dedicado, por ejemplo `realtime.zonabclub.com`.
- Proxear `/socket` por nginx hacia este proceso Node.
- Mantener `PUBLISH_SECRET` sincronizado con el ajuste `Secreto compartido` del plugin.
- Supervisarlo con `systemd` o `pm2`.
