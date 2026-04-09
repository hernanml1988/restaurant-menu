# Payment

## Registrar pago parcial o total

```bash
curl -X POST http://localhost:3015/payment \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "sessionToken": "8a5b6ef1-1f6d-4b2d-a2db-1b74c9879ef0",
    "method": "cash",
    "amount": 24000,
    "tipAmount": 3000,
    "receivedAmount": 30000,
    "payerName": "Carlos Mesa 4",
    "reference": "caja-001",
    "notes": "Primer pago de cuenta dividida"
  }'
```

## Listar pagos de una sesion

```bash
curl http://localhost:3015/payment/session/8a5b6ef1-1f6d-4b2d-a2db-1b74c9879ef0 \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Cancelar un pago

```bash
curl -X DELETE http://localhost:3015/payment/<PAYMENT_ID> \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "notes": "Pago anulado por error de digitacion"
  }'
```
