# Fiscal Document

## Listar documentos fiscales internos

```bash
curl http://localhost:3015/fiscal-document \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Registrar documento fiscal interno

```bash
curl -X POST http://localhost:3015/fiscal-document \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "sessionToken": "8a5b6ef1-1f6d-4b2d-a2db-1b74c9879ef0",
    "documentType": "receipt",
    "paymentId": "5d1f7c43-0d36-4e1f-a42e-18be6f504d88",
    "receiptId": "f5b845a0-a2a7-4df2-b885-3520646b0b15"
  }'
```
