# Report Controller

## Obtener resumen de dashboard

```bash
curl "http://localhost:3015/report/dashboard-summary?days=1&limit=5" \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Obtener ventas por dia de la ultima semana

```bash
curl http://localhost:3015/report/sales-by-day \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Obtener ventas por dia en un rango explicito

```bash
curl "http://localhost:3015/report/sales-by-day?startDate=2026-03-20&endDate=2026-03-26" \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Obtener tiempos promedio de preparacion

```bash
curl "http://localhost:3015/report/prep-times?days=7" \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Obtener productos mas pedidos

```bash
curl "http://localhost:3015/report/top-products?days=7&limit=5" \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```

## Obtener resumen semanal

```bash
curl "http://localhost:3015/report/weekly-summary?days=7" \
  -H "Cookie: jwt=TU_JWT_ADMIN"
```
