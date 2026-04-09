# Reservation

## Listar reservas

```bash
curl http://localhost:3015/reservation \
  -H "Cookie: jwt=<JWT_COOKIE>"
```

## Crear reserva

```bash
curl -X POST http://localhost:3015/reservation \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "guestName": "Maria Gonzalez",
    "guestPhone": "+56998765432",
    "guestEmail": "maria.gonzalez@example.com",
    "partySize": 4,
    "reservationAt": "2026-04-15T21:00:00.000Z",
    "reservationStatus": "booked",
    "notes": "Celebracion de aniversario. Requiere silla para nino.",
    "tableId": "2fca2f30-7ca7-4f88-9fd6-f9f3fb4f0f8c"
  }'
```

## Actualizar estado de reserva

```bash
curl -X PATCH http://localhost:3015/reservation/<RESERVATION_ID> \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=<JWT_COOKIE>" \
  -d '{
    "reservationStatus": "confirmed",
    "notes": "Cliente confirmo por telefono."
  }'
```

## Desactivar reserva

```bash
curl -X DELETE http://localhost:3015/reservation/<RESERVATION_ID> \
  -H "Cookie: jwt=<JWT_COOKIE>"
```
