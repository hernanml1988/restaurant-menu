# Dining Session Controller

## Crear una nueva sesion desde QR

```bash
curl -X POST http://localhost:3015/dining-session/public/start \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "http://localhost:5173/cliente/bienvenida?qr=table%3A550e8400-e29b-41d4-a716-446655440000%3A12%3Amesa-12%3A3f53d3c4-ff4d-4938-a086-2b6d0f9f19e0"
  }'
```

## Reutilizar una sesion existente en la misma mesa

```bash
curl -X POST http://localhost:3015/dining-session/public/start \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "http://localhost:5173/cliente/bienvenida?qr=table%3A550e8400-e29b-41d4-a716-446655440000%3A12%3Amesa-12%3A3f53d3c4-ff4d-4938-a086-2b6d0f9f19e0",
    "existingSessionToken": "d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144"
  }'
```

## Consultar una sesion activa

```bash
curl http://localhost:3015/dining-session/public/d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144
```

## Cerrar sesion al finalizar la cuenta

```bash
curl -X PATCH http://localhost:3015/dining-session/public/d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144/close \
  -H "Content-Type: application/json" \
  -d '{
    "closedBy": "cashier-terminal-01"
  }'
```

## Obtener cuenta interna consolidada

```bash
curl http://localhost:3015/dining-session/d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144/account \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Marcar cuenta por cobrar

```bash
curl -X PATCH http://localhost:3015/dining-session/d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144/payment-pending \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Cerrar cuenta interna

```bash
curl -X PATCH http://localhost:3015/dining-session/d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144/close \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "closedBy": "admin@restaurant.local",
    "notes": "Cuenta cerrada desde caja"
  }'
```

## Reabrir cuenta

```bash
curl -X PATCH http://localhost:3015/dining-session/d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144/reopen \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "reopenedBy": "admin@restaurant.local",
    "reason": "Cliente agrego un pedido despues del cierre"
  }'
```
