# Restaurant Menu - Implementacion del Sistema

Sistema web para operacion integral de restaurante con tres experiencias:
- Cliente (flujo QR y pedidos)
- Cocina (tablero operativo en tiempo real)
- Administracion (gestion operativa y analitica)

## 1. Objetivo del sistema

Permitir que un restaurante opere su ciclo completo de atencion desde una sola plataforma:
- Apertura de mesa por QR
- Toma y seguimiento de pedidos
- Gestion de solicitudes de servicio
- Cobro, cierre y reapertura de cuenta
- Operacion de caja
- Comprobantes y documentos fiscales internos
- Reservas y reportes

## 2. Arquitectura

Monorepo con dos aplicaciones principales:
- `mesa-magica`: frontend SPA en React + Vite + TypeScript
- `backend`: API NestJS + TypeORM + PostgreSQL

Patrones operativos principales:
- Frontend por vistas y servicios (`src/services`) con `react-query`
- Backend modular por dominio (`module/controller/service/entity/dto`)
- Tiempo real por SSE para sincronizar cliente/cocina/admin

## 3. Modulos funcionales

### Cliente (publico)
- Bienvenida por QR (`/cliente/bienvenida`)
- Menu y detalle de producto
- Carrito y envio de pedido
- Seguimiento de estado del pedido
- Solicitudes de servicio (mesero, ayuda, cuenta)

### Cocina (interno, rol `kitchen`)
- Tablero de pedidos por estado
- Cambio de estado operativo (`received -> preparing -> ready -> delivered`)
- Priorizacion de pedidos

### Administracion (interno, rol `admin`)
- Dashboard y KPI
- Mesas, menu, pedidos, usuarios
- Cobro y cierre de cuentas
- Caja diaria
- Comprobantes y documentos fiscales internos
- Reservas
- Reportes
- Bitacora

## 4. Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (recomendado 16)

## 5. Estructura de carpetas

```text
restaurant-menu/
  backend/
  mesa-magica/
  docker-compose.yml
  skills.md
  README.md
  MANUAL_USUARIO.md
  QA_E2E_CHECKLIST.md
```

## 6. Configuracion de entorno

### 6.1 Backend (`backend/.env`)

Variables minimas:

```env
PORT=3015
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=123456789
DATABASE_NAME=calendar

DATABASE_SYNCHRONIZE=false
DATABASE_MIGRATIONS_RUN=true

FRONTEND_PUBLIC_URL=http://localhost:5173
CORS_EXTRA_ORIGINS=

JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL=1h
JWT_REFRESH_TTL=7d

ALLOW_PUBLIC_BOOTSTRAP=true
FISCALIZATION_ENABLED=false
SENDGRID_API_KEY=
```

Notas:
- En produccion, `ALLOW_PUBLIC_BOOTSTRAP` debe quedar en `false`.
- En produccion, `JWT_SECRET` debe ser fuerte y privado.
- `FRONTEND_PUBLIC_URL` se usa para generar/normalizar enlaces de QR.

### 6.2 Frontend (`mesa-magica/.env`)

```env
VITE_API_URL=http://localhost:3015
```

## 7. Instalacion y ejecucion local

### 7.1 Instalar dependencias

```bash
cd backend
npm install

cd ../mesa-magica
npm install
```

### 7.2 Levantar backend

```bash
cd backend
npm run start:dev
```

API por defecto: `http://localhost:3015`

### 7.3 Levantar frontend

```bash
cd mesa-magica
npm run dev
```

UI por defecto: `http://localhost:5173`

## 8. Bootstrap inicial (solo dev/test)

Si necesitas usuario inicial desde endpoint publico:

```bash
curl -X POST http://localhost:3015/user/init-data
```

O crear un usuario publico controlado:

```bash
curl -X POST http://localhost:3015/user/public-create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@demo.cl",
    "password": "Admin123456",
    "name": "Admin",
    "lastname": "Demo"
  }'
```

Importante:
- Estos endpoints estan bloqueados en produccion por defecto.
- Solo habilitan con `ALLOW_PUBLIC_BOOTSTRAP=true` o entorno dev/test.

## 9. Pruebas y validacion

### 9.1 Frontend

```bash
cd mesa-magica
npm run test
npm run build
```

### 9.2 Backend

```bash
cd backend
npm run test
npm run test:e2e
npm run build
```

### 9.3 Cierre funcional por rol

Usar checklist:
- `QA_E2E_CHECKLIST.md`

## 10. Documentacion API

Ejemplos de consumo manual por recurso:
- `backend/docs/curl/*.curl.md`

Incluye modulos: auth, user, table, category, product, dining-session, order, service-request, payment, cash-session, receipt, fiscal-document, reservation, report, realtime, audit-log.

## 11. Despliegue con Docker (opcional)

Desde raiz:

```bash
docker compose up --build
```

Servicios:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3015`
- PostgreSQL: `localhost:5433`

## 12. Seguridad minima para produccion

Checklist minimo antes de salir a productivo:
- `ALLOW_PUBLIC_BOOTSTRAP=false`
- `JWT_SECRET` privado y robusto
- Variables de BD fuera de repositorio
- `DATABASE_SYNCHRONIZE=false`
- `DATABASE_MIGRATIONS_RUN=true`
- CORS ajustado a dominios reales
- Usuario admin validado y control de roles activo

## 13. Troubleshooting rapido

### Error de CORS
- Revisar `FRONTEND_PUBLIC_URL` y `CORS_EXTRA_ORIGINS` en backend.

### Error de login interno
- Verificar cookies en navegador y que el usuario tenga rol interno compatible (`admin` o `kitchen`).

### Error en `test:e2e`
- Validar conectividad y credenciales PostgreSQL.
- Confirmar que la BD este levantada y accesible desde backend.

### QR no abre mesa
- Verificar `FRONTEND_PUBLIC_URL` y formato del token QR.
- Validar que la mesa exista y este activa.

## 14. Estado actual de implementacion

- Integracion frontend-backend activa
- Tiempo real SSE activo
- Flujos principales de cliente, cocina y administracion implementados
- Hardening de bootstrap publico aplicado
- Documentacion tecnica y operativa disponible en repositorio
