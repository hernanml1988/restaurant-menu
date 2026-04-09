# User Controller

Estos endpoints usan validacion por cookie `jwt`. Antes de probarlos, inicia sesion y reutiliza el archivo de cookies.

## Bootstrap inicial

Disponible solo cuando `ALLOW_PUBLIC_BOOTSTRAP=true` o en entorno `development/test`.

```bash
curl -X POST http://localhost:3015/user/init-data
```

## Crear usuario sin cookie

Excepcion explicita para alta publica o bootstrap controlado, sin validacion de cookies.
Disponible solo cuando `ALLOW_PUBLIC_BOOTSTRAP=true` o en entorno `development/test`.

```bash
curl -X POST http://localhost:3015/user/public-create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "maria.torres@mesaviva.cl",
    "password": "Mesaviva2026",
    "name": "Maria",
    "lastname": "Torres",
    "secondLastname": "Rojas",
    "roleId": "550e8400-e29b-41d4-a716-446655440200",
    "state": true
  }'
```

## Crear usuario

```bash
curl -X POST http://localhost:3015/user \
  -H "Content-Type: application/json" \
  -b backend/docs/curl/.cookies.txt \
  -d '{
    "username": "maria.torres@mesaviva.cl",
    "password": "Mesaviva2026",
    "name": "Maria",
    "lastname": "Torres",
    "secondLastname": "Rojas",
    "roleId": "550e8400-e29b-41d4-a716-446655440200",
    "state": true
  }'
```

## Listar usuarios

```bash
curl http://localhost:3015/user \
  -b backend/docs/curl/.cookies.txt
```

## Obtener usuario por id

```bash
curl http://localhost:3015/user/550e8400-e29b-41d4-a716-446655440111 \
  -b backend/docs/curl/.cookies.txt
```

## Actualizar usuario

```bash
curl -X PATCH http://localhost:3015/user/550e8400-e29b-41d4-a716-446655440111 \
  -H "Content-Type: application/json" \
  -b backend/docs/curl/.cookies.txt \
  -d '{
    "name": "Maria Jose",
    "lastname": "Torres",
    "secondLastname": "Rojas",
    "password": "Mesaviva2026!",
    "roleId": "550e8400-e29b-41d4-a716-446655440201",
    "state": true
  }'
```

## Desactivar usuario

```bash
curl -X DELETE http://localhost:3015/user/550e8400-e29b-41d4-a716-446655440111 \
  -b backend/docs/curl/.cookies.txt
```
