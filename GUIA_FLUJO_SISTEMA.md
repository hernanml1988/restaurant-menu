# Guia de Flujo Completo del Sistema

Esta guia describe el flujo E2E real implementado entre cliente, cocina y administracion.

## 1. Vista general de flujo

1. Cliente escanea QR de mesa.
2. Backend resuelve mesa por QR y abre/reutiliza `DiningSession`.
3. Cliente navega menu, agrega items y confirma pedido.
4. Backend valida caja abierta, stock y crea pedido.
5. Cocina y administracion reciben cambios por SSE.
6. Cocina avanza estados operativos del pedido.
7. Cliente puede crear solicitudes de servicio (mesero, ayuda, cuenta).
8. Administracion registra pagos parciales o totales.
9. Con saldo en cero, administracion cierra sesion/cuenta.
10. Operaciones pueden emitir comprobante y documento fiscal interno.
11. Caja diaria se abre/cierra con conciliacion esperada vs real.

## 2. Flujo cliente QR a pedido

### 2.1 Apertura o reutilizacion de sesion

- Entrada:
  - URL QR hacia `/cliente/bienvenida?qr=<token-o-url>`.
- Frontend:
  - `ClientWelcome` consume `POST /dining-session/public/start`.
  - Si existe sesion local para la misma mesa, envia `existingSessionToken`.
- Backend (`DiningSessionService.start`):
  - Resuelve mesa activa por QR (`table/public/qr` + normalizacion de token).
  - Si recibe `existingSessionToken` valido y activo en mesa, lo reutiliza.
  - Si no, busca sesiones activas de mesa y reutiliza la mejor candidata.
  - Si no existe ninguna, crea nueva sesion.

### 2.2 Menu y carrito

- Frontend:
  - Categorias publicas: `GET /category/public`.
  - Productos publicos: `GET /product/public`.
  - Estado de carrito y sesion en `AppContext` + `localStorage`.

### 2.3 Confirmar pedido

- Frontend:
  - `ClientCart` llama `POST /order/public`.
- Backend (`OrderService.createPublicOrder`):
  - Requiere `items` no vacio.
  - Requiere `DiningSession` activa.
  - Requiere `CashSession` abierta.
  - Valida producto activo/disponible.
  - Valida stock si `trackStock=true`.
  - Valida extras pertenecientes al producto.
  - Genera correlativo transaccional (`OrderSequence`).
  - Descuenta stock si aplica.
  - Publica eventos SSE internos y por sesion.

## 3. Flujo de cocina

### 3.1 Carga de tablero

- Frontend cocina:
  - `GET /order/kitchen/board` (rol `kitchen` o `admin`).
  - SSE interno: `GET /realtime/internal`.

### 3.2 Gestion de estados

- Accion:
  - `PATCH /order/:id`.
- Estados operativos principales:
  - `received` -> `preparing` -> `ready` -> `delivered`.
- Efectos:
  - Actualiza campos de tiempo (`estimatedReadyAt`, `deliveredAt`).
  - Recalcula estado financiero de sesion.
  - Recalcula estado de mesa.
  - Publica SSE y registra auditoria.

## 4. Flujo de solicitudes de servicio

### 4.1 Cliente

- Endpoint publico:
  - `POST /service-request/public`.
- Tipos:
  - `waiter`, `help`, `bill`.

### 4.2 Regla especial de cuenta (`bill`)

- Frontend cliente (`ClientCallWaiter`):
  - Antes de solicitar cuenta, valida sesion cargada.
  - Bloquea si no hay pedidos.
  - Bloquea si hay pedidos no entregados.
- Backend:
  - Crea solicitud `pending`.
  - Si tipo `bill`, marca sesion `payment-pending` y mesa `pending-payment`.

### 4.3 Administracion

- Consulta/atencion:
  - `GET /service-request`
  - `PATCH /service-request/:id`

## 5. Flujo de cobro y cierre de cuenta

### 5.1 Registro de pagos

- Endpoint interno:
  - `POST /payment` (rol `admin`).
- Backend valida:
  - Sesion existente.
  - Sesion no cerrada.
  - Sesion con pedidos.
  - Monto pago <= saldo pendiente.
  - Monto recibido >= pago + propina.
  - Vuelto solo en metodo `cash`.
- Efectos:
  - Recalculo financiero de sesion.
  - Sincronizacion estado de mesa.
  - Registro en auditoria.

### 5.2 Cancelacion de pago

- Endpoint interno:
  - `DELETE /payment/:id`.
- Backend valida:
  - Pago no cancelado previamente.
  - Sesion no cerrada.

### 5.3 Cierre y reapertura de sesion

- Endpoints internos:
  - `PATCH /dining-session/:sessionToken/close`
  - `PATCH /dining-session/:sessionToken/reopen`
- Cierre valida:
  - Sesion activa.
  - Sesion con pedidos.
  - Saldo pendiente igual a cero.
- Reapertura valida:
  - Sesion cerrada.

## 6. Flujo de operaciones administrativas

### 6.1 Caja

- Abrir caja:
  - `POST /cash-session/open`
  - Rechaza si ya existe caja abierta.
- Cerrar caja:
  - `PATCH /cash-session/close`
  - Requiere caja abierta.
  - Calcula esperado con pagos `paid` del periodo.

### 6.2 Comprobantes

- Emitir comprobante:
  - `POST /receipt`
  - Snapshot persistido + HTML imprimible.

### 6.3 Documento fiscal interno

- Crear documento fiscal:
  - `POST /fiscal-document`
  - Snapshot de cuenta y referencias opcionales a pago/comprobante.

### 6.4 Reportes

- Endpoints:
  - `GET /report/dashboard-summary`
  - `GET /report/sales-by-day`
  - `GET /report/prep-times`
  - `GET /report/top-products`
  - `GET /report/weekly-summary`
- Filtros:
  - `days` o `startDate + endDate`.

## 7. Flujo en tiempo real (SSE)

### 7.1 Canal interno

- Endpoint: `GET /realtime/internal`
- Autenticado (cookie JWT) y rol `admin`/`kitchen`.
- Eventos: `order.*`, `service-request.*`.

### 7.2 Canal publico por sesion

- Endpoint: `GET /realtime/public/session/:sessionToken`
- Sin JWT.
- Orientado a actualizacion de tracking de cliente.

### 7.3 Recuperacion tras reconexion

- Ambos canales usan `last-event-id` para recuperar eventos pendientes.

## 8. Flujo de autenticacion interna

1. Usuario ingresa credenciales en `/login`.
2. Frontend llama `POST /auth/login`.
3. Backend valida usuario + password + rol interno compatible.
4. Backend setea cookies `jwt` y `refresh_token`.
5. Frontend valida sesion con `GET /auth/validate-sesion`.
6. `ProtectedRoute` permite acceso segun rol (`admin` o `kitchen`).

## 9. Estados principales del dominio

- Mesa (`table.serviceStatus`):
  - `free`, `occupied`, `with-order`, `pending-payment`.
- Pedido (`order.orderStatus`):
  - `received`, `preparing`, `ready`, `delivered`.
- Cuenta (`dining_session.accountStatus`):
  - `open`, `payment-pending`, `paid`, `closed`.
- Pago (`payment.paymentStatus`):
  - `pending`, `paid`, `cancelled`.

## 10. Riesgos operativos actuales

- Modulos scaffold (`profile`, `profile_role`) no siguen el mismo nivel de madurez que modulos operativos.
- DTO de auth no tipado formalmente en controller (`body: any`), por lo que parte de la validacion descansa en servicio.
- En reportes, un rango invalido lanza error de negocio y debe manejarse en frontend.
