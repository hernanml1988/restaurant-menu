# Receipt

## Listar comprobantes

```bash
curl http://localhost:3015/receipt \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Emitir comprobante de una sesion

```bash
curl -X POST http://localhost:3015/receipt \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "sessionToken": "8a5b6ef1-1f6d-4b2d-a2db-1b74c9879ef0",
    "type": "prebill",
    "paymentId": "5d1f7c43-0d36-4e1f-a42e-18be6f504d88"
  }'
```
