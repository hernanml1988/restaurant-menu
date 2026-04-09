# Restaurant Controller

## Obtener perfil publico del restaurante actual

```bash
curl http://localhost:3015/restaurant/public/current
```

## Obtener perfil actual del restaurante desde administracion

```bash
curl http://localhost:3015/restaurant/current \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Actualizar perfil del restaurante

```bash
curl -X PATCH http://localhost:3015/restaurant/current \
  -H "Cookie: jwt=TU_JWT_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mesa Viva Providencia",
    "tagline": "Sabores que conectan con tu mesa",
    "phone": "+56 9 9988 7766",
    "email": "contacto@mesaviva.cl",
    "address": "Av. Providencia 2450, Santiago",
    "description": "Restaurante orientado a una experiencia moderna de sala, pedidos digitales y operacion coordinada entre cliente, cocina y administracion.",
    "logoDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }'
```

## Restaurar datos por defecto del restaurante

```bash
curl -X POST http://localhost:3015/restaurant/current/reset \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```
