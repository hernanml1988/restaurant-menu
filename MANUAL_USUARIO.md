# Manual de Usuario - Restaurant Menu

Este manual explica como usar cada modulo del sistema en operacion diaria.

## 1. Perfiles de uso

- Cliente: usa el flujo QR desde su celular.
- Cocina: gestiona pedidos en tablero operativo.
- Administracion: controla operacion, cobros, caja y reportes.

## 2. Modulo Cliente

Ruta base: `/cliente`

### 2.1 Ingreso por QR

1. Escanear QR de la mesa.
2. Abrir pantalla de bienvenida.
3. Confirmar que se muestre la mesa correcta.

Resultado esperado:
- El QR de la mesa se mantiene fijo.
- Se abre o reutiliza una sesion activa de esa mesa.
- Si el enlace/token anterior ya no es valido, el sistema inicia una sesion operativa nueva para esa mesa.

### 2.2 Ver menu y productos

1. Entrar a "Ver menu".
2. Navegar categorias.
3. Abrir detalle de producto.
4. Elegir cantidad, extras y notas.
5. Agregar al carrito.

Resultado esperado:
- El item queda en carrito con su configuracion.

### 2.3 Confirmar pedido

1. Ir a carrito.
2. Revisar productos y total.
3. Agregar observaciones generales (opcional).
4. Confirmar pedido.

Resultado esperado:
- El pedido se envia a backend y pasa a cocina.

### 2.4 Seguimiento de pedido

1. Entrar a "Seguimiento".
2. Revisar estado actual del pedido.
3. Revisar historial de pedidos de la sesion.

Resultado esperado:
- El estado se actualiza en tiempo real.

### 2.5 Solicitar ayuda o cuenta

1. Entrar a "Ayuda".
2. Elegir: "Llamar mesero", "Necesito ayuda" o "Solicitar cuenta".

Regla para "Solicitar cuenta":
- Solo disponible si hay pedidos y todos estan entregados.

Resultado esperado:
- Se crea solicitud visible para administracion.

## 3. Modulo Cocina

Ruta: `/cocina` (requiere login con rol `kitchen`)

### 3.1 Ingresar al panel

1. Iniciar sesion con usuario cocina.
2. Abrir panel cocina.

Resultado esperado:
- Se muestran columnas: Pendiente, Preparando, Listo.

### 3.2 Gestionar estados de pedido

1. Tomar pedido en "Pendiente".
2. Marcar "Comenzar" para pasar a "Preparando".
3. Marcar "Listo" cuando termina.
4. Marcar "Entregar" para cerrar flujo operativo en cocina.

Resultado esperado:
- Cambios persistidos y visibles para cliente/admin.

### 3.3 Marcar prioridad

1. Abrir detalle del pedido.
2. Activar o quitar prioridad alta.

Resultado esperado:
- Pedido queda destacado para atencion preferente.

## 4. Modulo Administracion

Ruta: `/admin` (requiere login con rol `admin`)

### 4.1 Dashboard

1. Abrir "Dashboard".
2. Revisar KPIs principales.
3. Revisar productos top.

Resultado esperado:
- Vista resumida de operacion diaria.

### 4.2 Mesas

1. Ir a "Mesas".
2. Crear o editar mesas.
3. Revisar estado de ocupacion.

Resultado esperado:
- Mesas disponibles para flujo QR/sesion.

### 4.3 Menu

1. Ir a "Menu".
2. Crear/editar categorias.
3. Crear/editar productos.
4. Definir disponibilidad y stock (si aplica).

Resultado esperado:
- Catalogo publico actualizado para cliente.

### 4.4 Pedidos y solicitudes

1. Ir a "Pedidos".
2. Filtrar y buscar pedidos.
3. Editar estado, prioridad, estacion u observaciones.
4. Atender solicitudes de servicio.

Resultado esperado:
- Operacion centralizada entre cliente, cocina y admin.

### 4.5 Cobro y cierre de cuenta

Desde pedido o solicitud de cuenta:

1. Abrir dialogo de cobro.
2. Registrar pago (parcial o total).
3. Repetir pagos hasta saldo cero.
4. Al quedar saldo cero, la cuenta se cierra automaticamente.
5. Reabrir cuenta solo si negocio lo requiere.

Resultado esperado:
- Cuenta queda saldada y con trazabilidad.
- Sesiones pagadas/cerradas no aceptan nuevos pedidos o solicitudes publicas con tokens anteriores.

### 4.6 Operaciones (caja, comprobantes, fiscal)

1. Abrir caja al inicio del turno.
2. Cerrar caja al final del turno.
3. Emitir comprobantes cuando corresponda.
4. Registrar documento fiscal interno.
5. Revisar bitacora reciente.

Resultado esperado:
- Control operativo y auditoria diaria.

### 4.7 Reservas

1. Crear reserva con fecha/hora y party size.
2. Asignar mesa (opcional).
3. Cambiar estado segun avance.
4. Desactivar si se cancela.

Resultado esperado:
- Agenda de reservas mantenida y actualizada.

### 4.8 Reportes

1. Abrir "Reportes".
2. Definir rango de fechas o dias.
3. Revisar ventas, tiempos y ranking de productos.

Resultado esperado:
- Informacion para decisiones operativas.

## 5. Reglas operativas recomendadas

- No usar cuentas compartidas entre perfiles.
- No cerrar cuenta con saldo pendiente.
- Registrar motivo en anulaciones y cierres especiales.
- Mantener caja abierta solo durante turno activo.

## 6. Errores comunes y acciones

### "No se pudo iniciar sesion"
- Verificar usuario/clave.
- Confirmar rol del usuario (`admin` o `kitchen`).

### "No se pudo cargar informacion"
- Revisar que backend este activo.
- Confirmar `VITE_API_URL` correcto en frontend.

### Cliente no puede pedir cuenta
- Verificar que existan pedidos.
- Verificar que todos esten en estado entregado.

### "La sesion ya no esta disponible para esta mesa"
- Ocurre cuando el cliente intenta usar un token anterior de una cuenta pagada/cerrada.
- Solicitar reescanear el mismo QR fisico de la mesa para iniciar sesion vigente.

### Cocina no recibe pedidos
- Revisar conexion SSE y sesion activa.
- Verificar que existan pedidos en estado operativo.

## 7. Cierre diario sugerido

1. Validar que no queden pedidos activos sin atencion.
2. Cerrar cuentas pendientes.
3. Cerrar caja y revisar diferencia.
4. Emitir comprobantes/documentos pendientes.
5. Revisar bitacora y reportes del dia.
