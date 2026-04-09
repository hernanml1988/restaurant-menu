# Order Controller

## Listar pedidos administrativos

```bash
curl http://localhost:3015/order \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Listar tablero operativo de cocina

```bash
curl http://localhost:3015/order/kitchen/board \
  -H "Cookie: jwt=TU_JWT_COCINA"
```

## Obtener pedido por id

```bash
curl http://localhost:3015/order/550e8400-e29b-41d4-a716-446655440444 \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Actualizar pedido

```bash
curl -X PATCH http://localhost:3015/order/550e8400-e29b-41d4-a716-446655440444 \
  -H "Cookie: jwt=TU_JWT_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderStatus": "preparing",
    "priority": "high",
    "station": "cocina",
    "observations": "Priorizar por solicitud de la mesa",
    "estimatedReadyAt": "2026-03-26T18:45:00.000Z"
  }'
```

## Desactivar pedido

```bash
curl -X DELETE http://localhost:3015/order/550e8400-e29b-41d4-a716-446655440444 \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Crear pedido inicial o extras dentro de la misma sesion

```bash
curl -X POST http://localhost:3015/order/public \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144",
    "priority": "normal",
    "station": "cocina",
    "observations": "Sin cilantro en la hamburguesa",
    "items": [
      {
        "productId": "f16f0a35-3281-4c3e-b9bf-c31e93728b79",
        "quantity": 2,
        "notes": "Una coccion tres cuartos",
        "extras": [
          {
            "productExtraId": "1e8adbe3-6487-4f44-a2f7-2db5bbab1242",
            "value": "Queso cheddar extra"
          }
        ]
      },
      {
        "productId": "c8381ee5-f7e7-4a6b-aaf5-4129a2a78fc8",
        "quantity": 1,
        "notes": "Sin hielo"
      }
    ]
  }'
```

## Crear un extra posterior como nuevo pedido en la misma cuenta

```bash
curl -X POST http://localhost:3015/order/public \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "d7ee4d32-0a4f-4bcd-a8b2-7607f0d42144",
    "priority": "normal",
    "station": "postres",
    "observations": "Extra solicitado despues del pedido inicial",
    "items": [
      {
        "productId": "569a1de0-e289-48d1-ac3d-97379575a641",
        "quantity": 1,
        "notes": "Agregar dos cucharas"
      }
    ]
  }'
```
