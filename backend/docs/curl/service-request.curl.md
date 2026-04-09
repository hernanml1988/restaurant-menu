# Service Request Controller

Base URL:

```bash
http://localhost:3015
```

## Crear solicitud publica de servicio

Permite que el cliente solicite mesero, cuenta o ayuda desde una sesion activa.

```bash
curl -X POST http://localhost:3015/service-request/public \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "6d5a9e7d-6a8b-4b0a-a7bf-7b4e4a8a1f12",
    "type": "bill",
    "notes": "Solicitamos la cuenta para dividir entre dos personas"
  }'
```

## Listado interno de solicitudes

Requiere cookie `jwt` valida.

```bash
curl http://localhost:3015/service-request \
  -b backend/docs/curl/.cookies.txt
```

## Actualizar estado de solicitud

Requiere cookie `jwt` valida. Reemplaza `SERVICE_REQUEST_ID` por un UUID real.

```bash
curl -X PATCH http://localhost:3015/service-request/SERVICE_REQUEST_ID \
  -H "Content-Type: application/json" \
  -b backend/docs/curl/.cookies.txt \
  -d '{
    "requestStatus": "attended",
    "notes": "Mesero asignado y solicitud atendida en sala"
  }'
```
