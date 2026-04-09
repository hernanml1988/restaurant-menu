# Table Controller

## Crear mesa

```bash
curl -X POST http://localhost:3015/table \
  -H "Cookie: jwt=TU_JWT_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
    "number": 12,
    "name": "Mesa 12",
    "capacity": 4,
    "zone": "Interior",
    "serviceStatus": "free",
    "activeOrders": 0,
    "state": true
  }'
```

Nota: `qrCode` ahora es opcional. Si no se envía, el backend genera automáticamente una URL pública hacia el frontend usando `FRONTEND_PUBLIC_URL` del archivo `.env`, por ejemplo `http://localhost:5173/cliente/bienvenida?qr=...`.

## Listar mesas

```bash
curl http://localhost:3015/table \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Obtener mesa por id

```bash
curl http://localhost:3015/table/550e8400-e29b-41d4-a716-446655440111 \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Obtener mesa por QR publico

```bash
curl "http://localhost:3015/table/public/qr?value=http%3A%2F%2Flocalhost%3A5173%2Fcliente%2Fbienvenida%3Fqr%3Dtable%253A550e8400-e29b-41d4-a716-446655440000%253A12%253Amesa-12%253A3f53d3c4-ff4d-4938-a086-2b6d0f9f19e0"
```

## Actualizar mesa

```bash
curl -X PATCH http://localhost:3015/table/550e8400-e29b-41d4-a716-446655440111 \
  -H "Cookie: jwt=TU_JWT_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mesa 12 Terraza",
    "zone": "Terraza",
    "serviceStatus": "with-order",
    "activeOrders": 1
  }'
```

## Desactivar mesa

```bash
curl -X DELETE http://localhost:3015/table/550e8400-e29b-41d4-a716-446655440111 \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```
