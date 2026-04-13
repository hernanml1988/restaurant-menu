# Restaurant Menu - Documentacion Tecnica Integral

Sistema web para operacion integral de restaurante, con experiencias separadas por rol:
- Cliente (flujo publico por QR)
- Cocina (panel operativo interno)
- Administracion (gestion operativa, cobro, caja y analitica)

## 1. Objetivo del sistema

Centralizar la operacion del restaurante en una plataforma unica:
- Apertura/reutilizacion de sesion por QR de mesa.
- Toma de pedidos desde cliente.
- Orquestacion de estados en cocina.
- Atencion de solicitudes de servicio.
- Cobro parcial/total por sesion.
- Cierre y reapertura de cuenta.
- Control de caja diaria.
- Emision de comprobantes y documentos fiscales internos.
- Reportes operativos.

## 2. Arquitectura

Monorepo con dos aplicaciones principales:
- `mesa-magica`: frontend SPA (React 18 + Vite + TypeScript).
- `backend`: API REST/SSE (NestJS 10 + TypeORM + PostgreSQL).

### 2.1 Estilo arquitectonico

- Frontend:
  - Ruteo por modulo (`/cliente`, `/cocina`, `/admin`).
  - Capa de servicios HTTP en `mesa-magica/src/services`.
  - Estado cliente publico centralizado en `AppContext`.
  - Estado auth interno centralizado en `AuthContext`.
  - Cache e invalidacion con `@tanstack/react-query`.

- Backend:
  - Arquitectura modular NestJS (`module/controller/service/entity/dto`).
  - Persistencia con repositorios TypeORM.
  - Validacion de entrada con `ValidationPipe` global + `class-validator` en DTO.
  - Seguridad interna con JWT en cookie (`jwt`) + `RolesGuard`.
  - Sincronizacion en tiempo real via SSE (`/realtime/internal`, `/realtime/public/session/:sessionToken`).

## 3. Modulos backend implementados

- Core y acceso: `auth`, `user`, `role`, `profile`, `profile_role`.
- Dominio operativo restaurante:
  - `restaurant`
  - `table`
  - `category`
  - `product`
  - `dining_session`
  - `order`
  - `service_request`
  - `payment`
  - `cash_session`
  - `receipt`
  - `fiscal_document`
  - `reservation`
  - `report`
  - `realtime`
  - `audit_log`

## 4. Modulos frontend implementados

- Cliente publico:
  - `/cliente/bienvenida`
  - `/cliente/menu`
  - `/cliente/producto/:id`
  - `/cliente/carrito`
  - `/cliente/confirmacion`
  - `/cliente/seguimiento`
  - `/cliente/ayuda`

- Cocina (rol `kitchen`):
  - `/cocina`

- Administracion (rol `admin`):
  - `/admin` (dashboard)
  - `/admin/mesas`
  - `/admin/menu`
  - `/admin/pedidos`
  - `/admin/usuarios`
  - `/admin/reportes`
  - `/admin/reservas`
  - `/admin/operaciones`
  - `/admin/mis-datos`

## 5. Seguridad y autorizacion

### 5.1 Acceso interno

- Login interno: `POST /auth/login`.
- El backend setea cookies `jwt` y `refresh_token`.
- Rutas internas usan `AuthGuard('jwt')` + `RolesGuard` + `@InternalRoles(...)`.
- Roles internos soportados por sistema: `admin`, `kitchen`.

### 5.2 Endpoints publicos (sin JWT)

- Flujo cliente QR y sesion:
  - `GET /table/public/qr`
  - `POST /dining-session/public/start`
  - `GET /dining-session/public/:sessionToken`
- Pedido publico:
  - `POST /order/public`
- Solicitudes publicas:
  - `POST /service-request/public`
- Streaming publico por sesion:
  - `SSE /realtime/public/session/:sessionToken`

### 5.3 Bootstrap publico de usuarios (solo dev/test)

- `POST /user/init-data`
- `POST /user/public-create`

Ambos se bloquean cuando `ALLOW_PUBLIC_BOOTSTRAP=false`.

## 6. Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (recomendado 16)

## 7. Estructura del repositorio

```text
restaurant-menu/
  backend/
  mesa-magica/
  docker-compose.yml
  skills.md
  README.md
  MANUAL_USUARIO.md
  GUIA_FLUJO_SISTEMA.md
  GUIA_MODULOS_VALIDACIONES.md
```

## 8. Variables de entorno

### 8.1 Backend (`backend/.env`)

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

### 8.2 Frontend (`mesa-magica/.env`)

```env
VITE_API_URL=http://localhost:3015
```

## 9. Instalacion y ejecucion local (modo recomendado)

### 9.1 Instalar dependencias

```bash
cd backend
npm install

cd ../mesa-magica
npm install
```

### 9.2 Levantar backend

```bash
cd backend
npm run start:dev
```

### 9.3 Levantar frontend

```bash
cd mesa-magica
npm run dev
```

URLs por defecto:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3015`

## 10. Pruebas y build

### 10.1 Frontend

```bash
cd mesa-magica
npm run test
npm run build
```

### 10.2 Backend

```bash
cd backend
npm run test
npm run test:e2e
npm run build
```

## 11. Docker (opcional)

El repositorio incluye `docker-compose.yml` como alternativa.

```bash
docker compose up --build
```

Servicios esperados:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3015`
- PostgreSQL: `localhost:5433`

## 12. Convenciones operativas relevantes

- Eliminaciones administrativas: borrado logico (`state=false`) en recursos operativos.
- Cliente QR:
  - El QR de mesa permanece fijo y no cambia por cada cliente.
  - El backend reutiliza sesion activa si existe y sigue operativa.
  - Si hay varias sesiones activas, prioriza la mas reciente con actividad.
  - Si el token previo del cliente ya no es valido, el inicio publico cae a sesion activa o crea una nueva.
- Pedidos publicos:
  - Requieren caja abierta (`cash_session` en estado `open`).
  - Descuentan stock cuando `trackStock=true`.
  - Se bloquean cuando la sesion ya fue pagada o cerrada y se solicita reescanear QR.
- Solicitudes publicas:
  - Se bloquean cuando la sesion ya fue pagada o cerrada y se solicita reescanear QR.
- Cobro:
  - Pago no puede exceder saldo pendiente.
  - Solo efectivo admite vuelto.
- Cierre de cuenta:
  - Requiere pedidos existentes.
  - Requiere saldo en cero.
  - Al llegar a saldo cero por pagos, la sesion se cierra automaticamente.

## 13. Documentacion complementaria

- Flujo integral del sistema:
  - `GUIA_FLUJO_SISTEMA.md`
- Guia por modulo y validaciones:
  - `GUIA_MODULOS_VALIDACIONES.md`
- Manual funcional de uso:
  - `MANUAL_USUARIO.md`
- Curl por recurso backend:
  - `backend/docs/curl/*.curl.md`

## 14. Estado actual

- Integracion frontend-backend activa.
- Seguridad por JWT cookie + rol interno en rutas administrativas/operativas.
- Sincronizacion en tiempo real por SSE.
- Flujos principales de cliente, cocina y administracion implementados.
- Persistencia y evolucion de esquema mediante TypeORM + migraciones.
