# Frontend

SPA React + Vite del proyecto `restaurant-menu`.

## Requisitos

- Node.js 20 o superior

## Instalacion

```bash
npm install
```

## Ejecucion local

```bash
npm run dev
```

La aplicacion levanta por defecto con Vite en el puerto que este disponible localmente.

## Scripts utiles

```bash
npm run build
npm run preview
npm run test
```

## Docker

La dockerizacion del frontend es opcional y convive con el flujo local basado en `npm`.

Desde la raiz del repositorio:

```bash
docker compose up --build frontend
```

Para levantar frontend, backend y PostgreSQL juntos:

```bash
docker compose up --build
```

En Docker, el frontend queda disponible en `http://localhost:8080`.
