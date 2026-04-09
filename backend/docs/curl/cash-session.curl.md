# Cash Session

## Consultar caja actual

```bash
curl http://localhost:3015/cash-session/current \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Consultar historial de cajas

```bash
curl http://localhost:3015/cash-session/history \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Abrir caja

```bash
curl -X POST http://localhost:3015/cash-session/open \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "openingAmount": 50000,
    "notes": "Apertura de turno manana"
  }'
```

## Cerrar caja

```bash
curl -X PATCH http://localhost:3015/cash-session/close \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "closingAmount": 286500,
    "notes": "Cierre con cuadratura de ventas y propinas"
  }'
```
