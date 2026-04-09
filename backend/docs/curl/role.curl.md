# Role Controller

Estos endpoints usan validacion por cookie `jwt`. Antes de probarlos, inicia sesion y reutiliza el archivo de cookies.

## Crear rol

```bash
curl -X POST http://localhost:3015/role \
  -H "Content-Type: application/json" \
  -b backend/docs/curl/.cookies.txt \
  -d '{
    "name": "Supervisor",
    "description": "Supervisa operacion de sala, cocina y caja",
    "state": true
  }'
```

## Listar roles

```bash
curl http://localhost:3015/role \
  -b backend/docs/curl/.cookies.txt
```

## Obtener rol por id

```bash
curl http://localhost:3015/role/550e8400-e29b-41d4-a716-446655440210 \
  -b backend/docs/curl/.cookies.txt
```

## Actualizar rol

```bash
curl -X PATCH http://localhost:3015/role/550e8400-e29b-41d4-a716-446655440210 \
  -H "Content-Type: application/json" \
  -b backend/docs/curl/.cookies.txt \
  -d '{
    "name": "Supervisor General",
    "description": "Supervisa operacion integral del restaurante",
    "state": true
  }'
```

## Desactivar rol

```bash
curl -X DELETE http://localhost:3015/role/550e8400-e29b-41d4-a716-446655440210 \
  -b backend/docs/curl/.cookies.txt
```
