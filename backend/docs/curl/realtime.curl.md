# Realtime Controller

Base URL:

```bash
http://localhost:3015
```

## Stream interno SSE

Mantiene un canal en tiempo real para vistas internas autenticadas como administracion o cocina.

```bash
curl -N http://localhost:3015/realtime/internal \
  -H "Accept: text/event-stream" \
  -b backend/docs/curl/.cookies.txt
```

## Stream publico SSE por sesion

Permite que el cliente reciba cambios de su sesion de pedidos en tiempo real.

```bash
curl -N http://localhost:3015/realtime/public/session/6d5a9e7d-6a8b-4b0a-a7bf-7b4e4a8a1f12 \
  -H "Accept: text/event-stream"
```
