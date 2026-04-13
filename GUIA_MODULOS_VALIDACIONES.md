# Guia por Modulo con Validaciones

Esta guia resume validaciones de entrada (DTO), validaciones de negocio en servicio y validaciones UI relevantes por modulo.

Convenciones usadas:
- Validacion DTO: reglas aplicadas por `ValidationPipe` + `class-validator`.
- Validacion negocio: reglas implementadas dentro de servicios.
- Validacion UI: restricciones implementadas en paginas frontend.
- Cuando una regla no es verificable en codigo actual: `No determinado`.

## 1. Auth (`auth`)

### Endpoints
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/request-password-reset`
- `POST /auth/verify-reset-token`
- `POST /auth/reset-password`
- `GET /auth/verify`
- `GET /auth/validate-sesion`
- `POST /auth/register-login`

### Validaciones DTO
- No determinado (controller usa `body: any` y `@Body('...')` sin DTO formal).

### Validaciones de negocio
- Credenciales invalidas -> `Unauthorized`.
- Usuario debe estar activo para login.
- Usuario debe mapear a rol interno compatible (`admin` o `kitchen`).
- Refresh requiere cookie `refresh_token` valida.
- Reset password requiere token vigente y hash valido.

### Validaciones UI
- Login bloquea submit durante peticion.
- Redireccion segun rol autenticado (`/admin` o `/cocina`).

## 2. Usuarios (`user`)

### Endpoints
- Public bootstrap: `POST /user/init-data`, `POST /user/public-create`.
- Internos (`admin`): `POST /user`, `GET /user`, `GET /user/:id`, `PATCH /user/:id`, `DELETE /user/:id`.

### Validaciones DTO
`CreateUserDto`:
- `username`: email obligatorio.
- `password`: string, minimo 6.
- `name`, `lastname`: requeridos.
- `secondLastname`: opcional string.
- `roleId`: opcional UUID.
- `state`: opcional boolean.

`UpdateUserDto`:
- Parcial de `CreateUserDto`.

### Validaciones de negocio
- Bootstrap publico solo habilitado con `ALLOW_PUBLIC_BOOTSTRAP=true` o entorno dev/test.
- `username` unico.
- `roleId` debe existir si se informa.
- Eliminacion es logica (`state=false`, `status=inactive`).

### Validaciones UI
- Crear usuario requiere `username`, `name`, `lastname`, `roleId` y password >= 6.
- Editar usuario permite password vacia (no cambia password).

## 3. Roles (`role`)

### Endpoints
- Todos internos con rol `admin`.

### Validaciones DTO
`CreateRoleDto`:
- `name`: string requerido.
- `description`: string requerida.
- `state`: opcional boolean.

`UpdateRoleDto`:
- Parcial.

### Validaciones de negocio
- `name` unico.
- `description` unica.
- Eliminacion logica (`state=false`).

### Validaciones UI
- No determinado (no hay modulo visual de gestion de roles aislado; se consume desde usuarios).

## 4. Restaurante (`restaurant`)

### Endpoints
- Publico: `GET /restaurant/public/current`.
- Internos `admin`: `GET /restaurant/current`, `PATCH /restaurant/current`, `POST /restaurant/current/reset`.

### Validaciones DTO
`UpdateRestaurantProfileDto`:
- `name` max 120.
- `tagline` max 160.
- `phone` max 50.
- `email` formato email, max 120.
- `address` max 255.
- `description` string opcional.
- `logoDataUrl` string opcional o `null`.

### Validaciones de negocio
- Resolucion single-tenant: si no existe restaurante activo, se bootstrapea uno por defecto.

### Validaciones UI
- `AdminMyData` valida carga de logo y estados de guardado/reset.

## 5. Mesas (`table`)

### Endpoints
- Publico: `GET /table/public/qr?value=...`.
- Internos `admin`: CRUD.

### Validaciones DTO
`CreateTableDto`:
- `restaurantId`: UUID requerido.
- `number`: entero >= 1.
- `name`: requerido.
- `capacity`: entero positivo.
- `zone`: requerido.
- `qrCode`: opcional no vacio.
- `serviceStatus`: enum opcional.
- `activeOrders`: entero >= 0 opcional.
- `state`: boolean opcional.

`UpdateTableDto`:
- Parcial.

### Validaciones de negocio
- `restaurantId` debe existir.
- `qrCode` unico.
- Si no viene QR, se genera URL usando `FRONTEND_PUBLIC_URL`.
- Busqueda QR normaliza token y acepta URL completa o token crudo.
- Eliminacion logica (`state=false`).

### Validaciones UI
- Formulario mesa exige `name`, `zone`, `number >= 1`, `capacity >= 1`.
- Requiere restaurante cargado para crear.

## 6. Categorias (`category`)

### Endpoints
- Publico: `GET /category/public`.
- Internos `admin`: CRUD.

### Validaciones DTO
`CreateCategoryDto`:
- `restaurantId` UUID.
- `name`, `emoji` requeridos.
- `state` opcional.

`UpdateCategoryDto`:
- Parcial.

### Validaciones de negocio
- Restaurante debe existir y estar activo.
- Nombre unico por restaurante (solo activas).
- Eliminacion bloqueada si tiene productos activos.
- Eliminacion logica.

### Validaciones UI
- Crear/editar exige `name` y `emoji`.

## 7. Productos (`product`)

### Endpoints
- Publicos: `GET /product/public`, `GET /product/public/:id`.
- Internos `admin`: CRUD.

### Validaciones DTO
`CreateProductDto`:
- `restaurantId`, `categoryId` UUID.
- `name`, `description` requeridos.
- `price` numero >= 0.
- `stockQuantity`, `stockAlertThreshold` enteros >= 0 opcionales.
- `allergens`: array string opcional.
- Flags boolean opcionales (`available`, `popular`, `promo`, `trackStock`, `state`).

`UpdateProductDto`:
- Parcial.

### Validaciones de negocio
- Restaurante y categoria deben existir y estar activos.
- Categoria debe pertenecer al restaurante.
- Nombre unico por restaurante.
- Si `trackStock=true` y stock <= 0, `available=false`.
- Eliminacion bloqueada si tiene extras activos.
- Eliminacion logica.

### Validaciones UI
- Crear producto exige categoria, nombre, descripcion y precio >= 0.
- Configuracion de stock visible cuando aplica control de stock.

## 8. Sesion de mesa/cuenta (`dining_session`)

### Endpoints
- Publicos: `POST /dining-session/public/start`, `GET /dining-session/public/:sessionToken`, `PATCH /dining-session/public/:sessionToken/close`.
- Internos `admin`: `GET account`, `PATCH payment-pending`, `PATCH close`, `PATCH reopen`.

### Validaciones DTO
`StartDiningSessionDto`:
- `qrCode` requerido.
- `existingSessionToken` opcional.

`CloseDiningSessionDto`:
- `closedBy`, `notes` opcionales.

`ReopenDiningSessionDto`:
- `reopenedBy`, `reason` opcionales.

### Validaciones de negocio
- Mesa debe existir y estar activa por QR.
- Reutiliza sesion activa existente por mesa antes de crear nueva.
- Si hay multiples sesiones activas, prioriza sesion con actividad.
- `payment-pending` requiere sesion activa con pedidos.
- Cierre de cuenta requiere:
  - sesion activa,
  - pedidos existentes,
  - saldo pendiente en cero.
- Reapertura solo sobre sesion cerrada.

### Validaciones UI
- `ClientWelcome` exige parametro `qr` valido.
- `AdminBillingDialog` habilita/bloquea acciones segun `accountStatus`.

## 9. Pedidos (`order`)

### Endpoints
- Publico: `POST /order/public`.
- Internos:
  - `GET /order` (`admin`)
  - `GET /order/kitchen/board` (`admin`, `kitchen`)
  - `GET /order/:id` (`admin`, `kitchen`)
  - `PATCH /order/:id` (`admin`, `kitchen`)
  - `DELETE /order/:id` (`admin`)

### Validaciones DTO
`CreatePublicOrderDto`:
- `sessionToken` requerido.
- `items` array requerido, cada item:
  - `productId` UUID,
  - `quantity` int >= 1,
  - extras opcionales con `productExtraId` UUID y `value` requerido.

`UpdateOrderDto`:
- `orderStatus`, `priority`, `station` como enum opcional.
- fechas opcionales (`estimatedReadyAt`, `deliveredAt`).
- descuentos opcionales (`discountType`, `discountValue >= 0`, `discountReason`).

`CancelOrderDto`:
- `reason` opcional, max 300.

### Validaciones de negocio
- Pedido publico requiere al menos 1 item.
- Sesion debe existir y estar activa.
- Caja del restaurante debe estar abierta.
- Producto debe existir, activo y disponible.
- Stock suficiente si `trackStock=true`.
- Extra debe existir y pertenecer al producto.
- Baja de pedido restaura stock y aplica borrado logico.
- Actualizacion maneja timestamps de `ready/delivered` y recalculo financiero.

### Validaciones UI
- `ClientCart` bloquea confirmacion si no hay sesion o carrito vacio.
- Cocina solo muestra estados accionables y bloquea acciones durante mutation.

## 10. Solicitudes de servicio (`service_request`)

### Endpoints
- Publico: `POST /service-request/public`.
- Internos `admin`: `GET /service-request`, `PATCH /service-request/:id`.

### Validaciones DTO
`CreatePublicServiceRequestDto`:
- `sessionToken` requerido.
- `type` enum requerido (`waiter`, `bill`, `help`).
- `notes` opcional.

`UpdateServiceRequestDto`:
- `requestStatus` enum opcional.
- `notes` opcional.

### Validaciones de negocio
- Sesion activa requerida para crear solicitud publica.
- Si `type=bill`, sesion pasa a `payment-pending` y mesa a `pending-payment`.

### Validaciones UI
- Cliente bloquea `Solicitar cuenta` si:
  - no hay pedidos,
  - o hay pedidos no entregados.

## 11. Pagos (`payment`)

### Endpoints
- Internos `admin`:
  - `POST /payment`
  - `GET /payment/session/:sessionToken`
  - `DELETE /payment/:id`

### Validaciones DTO
`CreatePaymentDto`:
- `sessionToken` requerido.
- `method` enum requerido.
- `amount` >= 0.01.
- `tipAmount` >= 0 opcional.
- `receivedAmount` >= 0 opcional.
- `payerName`, `reference`, `notes` con max length.

`CancelPaymentDto`:
- `notes` opcional max 500.

### Validaciones de negocio
- Sesion debe existir.
- No permite cobrar sesion cerrada.
- Sesion debe tener pedidos.
- Pago no puede exceder saldo.
- Monto recibido debe cubrir pago + propina.
- Vuelto solo en efectivo.
- Cancelacion no permitida si pago ya cancelado.
- Cancelacion no permitida sobre sesion cerrada.

### Validaciones UI
- `AdminBillingDialog` ajusta y valida monto/recibido segun metodo.

## 12. Caja (`cash_session`)

### Endpoints
- Internos `admin`:
  - `GET /cash-session/current`
  - `GET /cash-session/history`
  - `POST /cash-session/open`
  - `PATCH /cash-session/close`

### Validaciones DTO
`OpenCashSessionDto`:
- `openingAmount` >= 0.
- `notes` opcional.

`CloseCashSessionDto`:
- `closingAmount` >= 0.
- `notes` opcional.

### Validaciones de negocio
- No se puede abrir una nueva si ya hay caja abierta.
- No se puede cerrar si no hay caja abierta.
- Calcula `expectedAmount` desde apertura + pagos `paid` del periodo.
- Calcula `differenceAmount` al cierre.

### Validaciones UI
- En admin layout, badge visible cuando no hay caja abierta.
- Boton abrir deshabilitado si existe caja abierta.
- Boton cerrar deshabilitado si no existe caja abierta.

## 13. Comprobantes (`receipt`)

### Endpoints
- Internos `admin`:
  - `GET /receipt`
  - `POST /receipt`

### Validaciones DTO
`CreateReceiptDto`:
- `sessionToken` requerido.
- `type` enum (`prebill`, `payment`).
- `paymentId` UUID opcional.

### Validaciones de negocio
- Sesion debe existir.
- Si se informa `paymentId`, pago debe existir.
- Se genera snapshot persistido y `printableHtml`.

### Validaciones UI
- Emision desde dialogo de cobro con boton de impresion.

## 14. Documentos fiscales (`fiscal_document`)

### Endpoints
- Internos `admin`:
  - `GET /fiscal-document`
  - `POST /fiscal-document`

### Validaciones DTO
`CreateFiscalDocumentDto`:
- `sessionToken` requerido.
- `documentType` enum.
- `paymentId`, `receiptId` UUID opcionales.

### Validaciones de negocio
- Sesion debe existir.
- Genera folio interno y payload snapshot de cuenta.
- `paymentId`/`receiptId` son opcionales (si vienen, se asocian si existen).

### Validaciones UI
- Formulario en `AdminOperations` requiere `sessionToken` y `documentType`.

## 15. Reservas (`reservation`)

### Endpoints
- Internos `admin`: `GET`, `POST`, `PATCH`, `DELETE`.

### Validaciones DTO
`CreateReservationDto`:
- `guestName` requerido.
- `guestPhone` opcional.
- `guestEmail` opcional email.
- `partySize` int >= 1.
- `reservationAt` fecha ISO.
- `reservationStatus` enum opcional.
- `notes` opcional.
- `tableId` UUID opcional.

`UpdateReservationDto`:
- Parcial.

### Validaciones de negocio
- Si `tableId` viene informado, mesa debe existir y estar activa.
- Eliminacion logica (`state=false`).

### Validaciones UI
- Formulario exige `guestName` y `reservationAt`.

## 16. Reportes (`report`)

### Endpoints
- Internos `admin`:
  - `GET /report/dashboard-summary`
  - `GET /report/sales-by-day`
  - `GET /report/prep-times`
  - `GET /report/top-products`
  - `GET /report/weekly-summary`

### Validaciones DTO
`ReportRangeQueryDto`:
- `startDate` y `endDate` ISO opcionales.
- `days` int opcional entre 1 y 31.

`TopProductsQueryDto`:
- Hereda rango.
- `limit` int opcional entre 1 y 20.

### Validaciones de negocio
- Si se envia rango por fecha, `startDate` y `endDate` deben venir juntos.
- `startDate` no puede ser mayor que `endDate`.
- Restaurante activo debe existir.

### Validaciones UI
- Pantallas consumen reportes por query dedicada y muestran fallback ante error.

## 17. Realtime (`realtime`)

### Endpoints
- Interno autenticado: `SSE /realtime/internal` (`admin`, `kitchen`).
- Publico por sesion: `SSE /realtime/public/session/:sessionToken`.

### Validaciones DTO
- No aplica DTO.

### Validaciones de negocio
- Polling de eventos persistidos en DB (`realtime_event`).
- Recuperacion incremental por `last-event-id`.

### Validaciones UI
- Dashboard cocina/admin invalida cache cuando recibe `order.*` o `service-request.*`.
- Tracking cliente se refresca por eventos de sesion.

## 18. Auditoria (`audit_log`)

### Endpoints
- Interno `admin`: `GET /audit-log?limit=`.

### Validaciones DTO
- No DTO especifico; `limit` llega por query string.

### Validaciones de negocio
- `limit` maximo efectivo: 300.
- Se registran acciones sensibles: pedidos, pagos, caja, sesiones, reservas, comprobantes, fiscal.

### Validaciones UI
- `AdminOperations` muestra bitacora reciente.

## 19. Modulos scaffold (`profile`, `profile_role`)

### Estado
- Existen controllers/services base de scaffold.
- DTOs vacios (`CreateProfileDto`, `CreateProfileRoleDto`).
- Uso de `+id` numerico en controller.

### Validaciones
- DTO: No determinado / minima.
- Negocio: No determinado para flujo productivo.
- UI: No aplica (sin modulo visible en frontend).
