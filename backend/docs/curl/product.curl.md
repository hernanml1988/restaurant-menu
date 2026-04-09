# Product Controller

Base URL:

```bash
http://localhost:3015
```

## Listado publico de productos

Entrega el catalogo activo del restaurante actual para la experiencia cliente.

```bash
curl http://localhost:3015/product/public
```

## Detalle publico de producto

Reemplaza `PRODUCT_ID` por un UUID real obtenido del listado publico.

```bash
curl http://localhost:3015/product/public/PRODUCT_ID
```
