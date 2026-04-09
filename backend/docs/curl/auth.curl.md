# Auth Controller

Base URL:

```bash
http://localhost:3015
```

Archivo de cookies para pruebas locales:

```bash
backend/docs/curl/.cookies.txt
```

## Login

Guarda las cookies `jwt` y `refresh_token` en un archivo reutilizable.

```bash
curl -X POST http://localhost:3015/auth/login \
  -H "Content-Type: application/json" \
  -c backend/docs/curl/.cookies.txt \
  -d '{
    "email": "hmiranda@thimkti.cl",
    "password": "thinkti080"
  }'
```

## Validar sesion

```bash
curl http://localhost:3015/auth/validate-sesion \
  -b backend/docs/curl/.cookies.txt
```

## Verificar autenticacion

```bash
curl http://localhost:3015/auth/verify \
  -b backend/docs/curl/.cookies.txt
```

## Refrescar token

```bash
curl -X POST http://localhost:3015/auth/refresh \
  -b backend/docs/curl/.cookies.txt \
  -c backend/docs/curl/.cookies.txt
```

## Logout

```bash
curl -X POST http://localhost:3015/auth/logout \
  -b backend/docs/curl/.cookies.txt \
  -c backend/docs/curl/.cookies.txt
```

## Solicitar reseteo de password

```bash
curl -X POST http://localhost:3015/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.torres@mesaviva.cl"
  }'
```

## Verificar token de reseteo

```bash
curl -X POST http://localhost:3015/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DE_RESETEO_RECIBIDO"
  }'
```

## Restablecer password

```bash
curl -X POST http://localhost:3015/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DE_RESETEO_RECIBIDO",
    "newPassword": "Mesaviva2026!"
  }'
```

## Register login

```bash
curl -X POST http://localhost:3015/auth/register-login \
  -H "Content-Type: application/json" \
  -c backend/docs/curl/.cookies.txt \
  -d '{
    "email": "maria.torres@mesaviva.cl"
  }'
```
