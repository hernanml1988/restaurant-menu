# Backend

API NestJS del proyecto `restaurant-menu`.

## Requisitos

- Node.js 20 o superior
- PostgreSQL accesible localmente
- Variables definidas en `backend/.env`

## Instalacion

```bash
npm install
```

## Configuracion local

El backend carga sus variables desde `backend/.env`.

Valores actuales esperados:

```env
PORT=3015
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=123456789
DATABASE_NAME=calendar
ALLOW_PUBLIC_BOOTSTRAP=true
```

Si tu PostgreSQL local usa otro puerto o credenciales, ajusta ese archivo antes de iniciar.
`ALLOW_PUBLIC_BOOTSTRAP` habilita los endpoints de bootstrap publico (`/user/init-data` y `/user/public-create`). En produccion debe quedar en `false`.

## Ejecucion

```bash
# desarrollo con recarga
npm run start:dev

# compilacion
npm run build

# produccion
npm run start:prod
```

## Pruebas

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Docker

La dockerizacion del backend es opcional y no reemplaza el flujo local con `npm`.

Desde la raiz del repositorio:

```bash
docker compose up --build backend db
```

Si quieres levantar el sistema completo con frontend incluido:

```bash
docker compose up --build
```

En Docker, el backend expone `http://localhost:3015` y se conecta al servicio `db` de PostgreSQL.
