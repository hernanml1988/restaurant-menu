# Proyecto - Lineamientos Tecnicos

## 1. Arquitectura General
- Tipo de aplicacion: Monorepo liviano con frontend web separado en `mesa-magica` y backend API separado en `backend`.
- Dominio funcional detectado: Gestion operativa de restaurante con vistas diferenciadas para cliente, cocina y administracion.
- Patron arquitectonico:
  Frontend: SPA con enrutamiento por secciones y uso intensivo de componentes UI reutilizables.
  Backend: Arquitectura modular de NestJS basada en `module/controller/service/entity`, con persistencia directa sobre repositorios TypeORM.
- Organizacion por capas:
  Frontend: `pages`, `components`, `context`, `data`, `hooks`, `lib`.
  Backend: `main` para bootstrap, `app.module` para composicion, modulos de dominio (`user`, `role`, `profile`, `profile_role`, `auth`), `entities`, `dto`, `utils`, `config`.
- Nivel de modularizacion:
  Frontend: Medio. La separacion por vistas es clara, pero el estado y los datos siguen centralizados y locales.
  Backend: Medio a alto. La estructura modular existe y el dominio operativo principal del restaurante ya esta implementado en multiples modulos.
- Integracion entre frontend y backend: Activa. El frontend consume endpoints HTTP reales del backend mediante una capa `services`, usa `credentials: 'include'` para sesion interna por cookies y resuelve actualizacion operativa con `react-query` y SSE.
- Infraestructura detectada: existe soporte dual. El desarrollo local principal sigue resolviendose con ejecucion directa de `backend` y `mesa-magica` mediante Node.js, pero el repositorio tambien incluye `docker-compose.yml`, `Dockerfile` por aplicacion y configuracion `nginx` para despliegue del frontend como SPA.

## 2. Lineamientos Frontend
- Framework: React 18 + TypeScript + Vite.
- Librerias principales detectadas:
  `react-router-dom`, `@tanstack/react-query`, `tailwindcss`, `shadcn/ui`, `radix-ui`, `lucide-react`, `react-hook-form`, `zod`, `vitest`, `playwright`.
- Organizacion de componentes:
  Las pantallas viven en `src/pages`.
  Los componentes compartidos viven en `src/components`.
  La UI base generada/reutilizada desde `shadcn/ui` vive en `src/components/ui`.
  Las vistas estan segmentadas por contexto de uso: `client`, `kitchen`, `admin`.
- Manejo de estado:
  Existe un contexto global `AppContext` para carrito y estado de pedido.
  El estado de interfaz se maneja principalmente con `useState`.
  `react-query` esta configurado en `App.tsx` y se usa activamente con `useQuery` y `useMutation` en vistas administrativas, cocina, cliente y configuracion transversal.
- Fuente de datos actual:
  Conviven datos mock heredados con integraciones reales.
  El frontend administrativo e interno ya consume backend real para autenticacion, mesas, menu, pedidos, cobro, reportes, reservas y operacion.
- Convenciones de nombres:
  Componentes y paginas en PascalCase.
  Hooks con prefijo `use`.
  Alias `@` apuntando a `src`.
  Rutas organizadas por dominio funcional y no por feature package avanzada.
- Consumo de APIs:
  Patron activo mediante `fetch` encapsulado en `src/services`.
  Se detectan servicios dedicados por dominio, por ejemplo autenticacion, restaurant, category, product, table, order, dining session, payment, report, realtime, reservation, cash session, receipt, fiscal document y audit log.
- Manejo de errores:
  La integracion de red existe y los servicios frontend convierten respuestas no exitosas en `Error`.
  Los errores de contexto se manejan con `throw new Error` en hooks como `useApp`.
  La UX se apoya en `Toaster` y `Sonner`, con manejo de errores localizado por vista y mutation.
- Reglas de diseno detectadas:
  Uso consistente de Tailwind con variables CSS semanticas.
  Tipografia principal `DM Sans` y tipografia de display `DM Serif Display`.
  Paleta calida en cliente/admin y tema oscuro especifico para cocina mediante override de variables.
  Predominio de tarjetas, bordes suaves, radios medianos/altos y microanimaciones (`fade-in`, `slide-up`, `scale-in`).
- Buenas practicas detectadas:
  Separacion clara de shells por experiencia (`ClientLayout`, `AdminLayout`).
  Modelado de datos mock tipado mediante interfaces exportadas.
  Uso de alias y configuracion coherente entre Vite y Vitest.
  Reutilizacion intensiva de componentes base.
- Restricciones operativas para futuras modificaciones en frontend:
  Mantener React + TypeScript + Vite como stack base.
  Reutilizar `src/components/ui` y estilos existentes antes de introducir nuevas librerias visuales.
  Si se incorpora integracion real con backend, crear capa de servicios/API dedicada antes de dispersar `fetch` en paginas.
  No sustituir `AppContext` por otro patron global sin justificacion arquitectonica.
  Registrar en este archivo cualquier nuevo patron estable de consumo de API, formularios o estado global.

## 3. Lineamientos Backend
- Framework y lenguaje: NestJS 10 + TypeScript + TypeORM + PostgreSQL.
- Organizacion interna:
  Se utiliza el patron estandar de NestJS por modulo.
  Cada modulo de dominio contiene `controller`, `service`, `dto` y `entities` cuando aplica.
  No se detecto capa repository personalizada ni casos de uso/application layer.
- Modulos detectados:
  `auth`, `user`, `role`, `profile`, `profile_role`, `restaurant`, `table`, `category`, `product`, `dining_session`, `order`, `service_request`, `payment`, `report`, `realtime`, `audit_log`, `cash_session`, `receipt`, `reservation`, `fiscal_document`.
- Modelado de datos:
  Entidades TypeORM decoradas en clases.
  Uso de `uuid` como PK en las entidades revisadas.
  Campos transversales repetidos en entidades: `state`, `status`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `modifiedBy`.
  La logica de auditoria y timestamps se repite con `@BeforeInsert` y `@BeforeUpdate` en cada entidad, sin clase base abstracta compartida.
- Manejo de validaciones:
  Existe `ValidationPipe` global con `transform`, `whitelist` y `forbidNonWhitelisted`.
  Sin embargo, los DTO revisados estan vacios o sin decoradores de `class-validator`, por lo que la validacion efectiva actual es minima o nula.
- Seguridad:
  CORS configurado manualmente con lista blanca en `origins.ts`.
  Uso de `helmet`.
  `cookie-parser` habilitado.
  Autenticacion JWT con cookies `jwt` y `refresh_token`.
  Hash de password con `bcrypt`.
  La clave JWT debe resolverse desde configuracion/env.
  Los endpoints internos administrativos y operativos deben combinar autenticacion por cookie JWT y autorizacion explicita por rol interno en backend, sin depender solo de restricciones del frontend.
- Manejo de errores:
  Se usa una utilidad `Utils.errorResponse(error)` que relanza `HttpException`.
  El patron no es uniforme en todos los servicios/controladores.
  Existen `try/catch` locales y respuestas manuales con `res.status(...).send(...)`.
- Logs:
  Existe logging puntual con `Logger` de Nest en flujos criticos como QR y sesion.
  Existe modulo dedicado de auditoria operativa (`audit_log`) para registrar acciones sensibles.
- Principios SOLID aplicados:
  S: Parcial. Hay separacion controller/service, pero algunas responsabilidades de respuesta HTTP y autenticacion siguen acopladas.
  O: Parcial.
  L: No determinado.
  I: No determinado.
  D: Bajo a medio. La aplicacion depende directamente de repositorios TypeORM y configuraciones concretas.
- Estado funcional real del backend:
  El dominio operativo del restaurante esta implementado en backend y conectado con el frontend.
  Existen flujos activos para QR, sesion de mesa, pedidos, solicitudes de servicio, cobro, caja, comprobantes, reservas, documentos fiscales internos y reportes.
  `role`, `profile` y `profile_role` siguen siendo modulos de soporte interno con menor madurez funcional que el dominio operativo.
- Restricciones operativas para futuras modificaciones en backend:
  Mantener el patron modular NestJS existente.
  No introducir capa repository personalizada, CQRS, hexagonal u otro patron mayor sin acuerdo explicito.
  Si se generaliza la auditoria, hacerlo mediante una abstraccion compartida y no mezclando estilos por entidad.
  Si se completan DTOs, usar `class-validator` y `class-transformer` de forma consistente con el `ValidationPipe` ya configurado.
  Mover secretos y parametros sensibles a configuracion/env antes de extender seguridad o autenticacion.
  Registrar en este archivo cualquier nuevo patron estable de guardias, interceptores, filtros, eventos o persistencia.

## 4. Base de Datos
- Tipo: PostgreSQL.
- ORM / estrategia de acceso: TypeORM con repositorios inyectados mediante `@InjectRepository`.
- Configuracion: Variables de entorno cargadas por `ConfigModule`, con `TypeOrmModule.forRootAsync`.
- Estrategia de persistencia:
  Persistencia directa desde servicios usando `repository.save()` y `findOne()`.
  Existen migraciones versionadas bajo `backend/src/database/migrations`.
  La sincronizacion automatica no debe considerarse estrategia base; la evolucion de esquema debe resolverse con migraciones.
- Modelo detectado:
  `User` relacionado uno a uno con `Profile`.
  `ProfileRole` funciona como entidad de union entre `Profile` y `Role`.
  `Role` tiene relacion uno a muchos con `ProfileRole`.
  `Profile` tiene relacion uno a muchos con `ProfileRole`.
- Relaciones:
  `User` <-> `Profile`: uno a uno.
  `Profile` -> `ProfileRole`: uno a muchos.
  `Role` -> `ProfileRole`: uno a muchos.
- Convenciones de datos:
  Uso transversal del enum `StatusEnum` para estado logico.
  Persistencia de timestamps y campos de auditoria desde hooks de entidad.
- Limitaciones actuales:
  No se detectaron indices adicionales, constraints complejos ni configuraciones avanzadas de relaciones.
  El backend sigue usando persistencia directa con TypeORM sin una capa application separada.

## 5. Estilo de Desarrollo del Proyecto
- Nivel de formalidad: Medio. La estructura de carpetas y stack estan bien definidos, pero existen areas scaffold y decisiones aun no consolidadas.
- Complejidad promedio de funciones:
  Frontend: Baja a media, con componentes enfocados en presentacion y estado local.
  Backend: Baja a media, salvo `auth.service` y `auth.controller`, que concentran mayor logica.
- Reutilizacion:
  Alta en UI base del frontend.
  Media en backend.
  Baja en logica transversal de entidades, donde hay repeticion manual.
- Acoplamiento:
  Frontend: Medio, por dependencia directa de `mockData` y del `AppContext`.
  Backend: Medio a alto en `auth` y `user`, por mezcla de respuesta HTTP, repositorios y logica de negocio.
- Cohesion:
  Frontend: Buena por seccion funcional.
  Backend: Variable; los modulos scaffold tienen cohesion clara pero aun incompleta.
- Claridad estructural:
  Alta a nivel de carpetas.
  Media a nivel de comportamiento real, porque conviven modulos implementados parcialmente con modulos de plantilla.
- Preferencias detectadas del desarrollador:
  Preferencia por clases en backend, coherente con NestJS y TypeORM.
  Preferencia por funciones y hooks en frontend, coherente con React moderno.
  Uso bajo de comentarios; el codigo busca ser autoexplicativo.
  Nombres de archivos y componentes consistentes con el dominio visible.
  Se prioriza avance rapido funcional/prototipo antes que cierre arquitectonico completo.
- Estilo de commits disponible:
  Limitado. Solo hay pocos commits visibles.
  Se observa un commit descriptivo (`Add backend`) y otro no estandar (`{{ddddd`), por lo que no puede inferirse una convencion estable de commits.

## 6. Reglas que el Agente Debe Respetar
- Consultar siempre este archivo antes de realizar cambios.
- No romper la separacion actual entre `mesa-magica` y `backend`.
- No asumir que frontend y backend ya estan integrados; validar primero la existencia de contrato real.
- Asumir como estado actual que el frontend administrativo e interno ya esta integrado con el backend real mediante `src/services`, `react-query` y SSE, salvo que un modulo puntual indique explicitamente lo contrario.
- No reemplazar datos mock por llamadas reales de forma dispersa. Si se da ese paso, crear una capa de servicios/API.
- No introducir nuevas librerias de estado global, UI o networking sin necesidad tecnica clara.
- Mantener las convenciones actuales:
  PascalCase para componentes/paginas/clases.
  Hooks con prefijo `use`.
  Alias `@` en frontend.
  Modulos NestJS con separacion `controller/service/entity/dto`.
- En backend, respetar TypeORM como estrategia de persistencia actual.
- No inventar validaciones: si un DTO no esta definido, indicarlo y completarlo explicitamente.
- No inventar endpoints, relaciones ni reglas de negocio que no existan en el codigo.
- Cuando algo no pueda verificarse, dejarlo como `No determinado`.
- Si se detecta un nuevo patron repetible de arquitectura, flujo, convencion o trabajo, registrarlo tambien en este archivo.
- Antes de aplicar una mejora arquitectonica relevante, proponerla tecnicamente y luego ejecutarla solo si corresponde al pedido.
- Si se trabaja autenticacion o seguridad, priorizar:
  externalizar secretos,
  mantener secretos fuera del codigo,
  reforzar autorizacion por rol en backend,
  formalizar DTOs,
  unificar manejo de errores.
- Si se trabaja base de datos en backend, evitar seguir profundizando `synchronize: true` como estrategia de largo plazo sin plantear migraciones.
  Priorizar migraciones versionadas y compatibles con PostgreSQL.
- Si se modifica UI, conservar la identidad visual actual:
  tipografia DM Sans / DM Serif Display,
  variables CSS semanticas,
  Tailwind como capa principal,
  componentes `shadcn/ui` como base.

## 7. Patrones Nuevos Registrados
- Regla operativa del proyecto: todo patron nuevo de desarrollo, arquitectura, flujo, convencion o trabajo repetible debe registrarse en `skills.md`.
- Regla operativa del agente: `skills.md` es la memoria operativa vigente del proyecto y debe mantenerse actualizado.
- Regla operativa de repositorio: el proyecto debe mantenerse en un unico repositorio Git raiz. `mesa-magica` y `backend` viven como carpetas del monorepo y no deben volver a inicializarse como repositorios anidados o submodulos salvo acuerdo explicito.
- Patron frontend registrado: la configuracion transversal del restaurante sin backend real debe persistirse en `localStorage` mediante un modulo de datos dedicado y un hook de acceso reutilizable, evitando lecturas y escrituras directas dispersas en multiples paginas.
- Patron frontend registrado: mientras el frontend siga operando como demo desacoplada del backend, la autenticacion de modulos internos debe implementarse mediante un modulo de datos dedicado, un `AuthContext` reutilizable y rutas protegidas centralizadas, manteniendo `cliente` como experiencia publica y evitando condicionales de acceso dispersos dentro de cada pagina.
- Patron frontend registrado: cuando una vista pase de mock local a backend real, la integracion debe encapsularse en una capa `services` o `api` dedicada, con `fetch` centralizado, `credentials: 'include'` para flujos basados en cookies y mapeo explicito del contrato backend antes de llegar a `context` o `pages`.
- Patron frontend registrado: cuando un modulo administrativo pase de mock a backend real, la lectura remota debe resolverse mediante un servicio dedicado en `src/services` y consumo desde la vista con `react-query`, usando claves de cache por dominio funcional como `['admin', '<recurso>']` para evitar `fetch` disperso y facilitar recarga o invalidacion posterior.
- Patron frontend registrado: cuando un modulo administrativo necesite listado y detalle por id del mismo recurso, el detalle debe resolverse con una consulta `react-query` separada bajo la clave `['admin', '<recurso>', id]`, manteniendo el listado en `['admin', '<recurso>']` para invalidacion puntual tras editar o eliminar.
- Patron frontend registrado: cuando un CRUD administrativo dependa de catalogos auxiliares del backend, como usuarios con roles, tanto el recurso principal como sus catalogos de soporte deben resolverse desde la capa `src/services` del mismo dominio y consumirse con `react-query` mediante claves separadas y explicitas, por ejemplo `['admin', 'users']` y `['admin', 'roles']`, evitando mezclar mocks locales o consultas dispersas dentro de la pagina.
- Patron frontend registrado: la configuracion transversal del restaurante, cuando deje de operar en demo local, debe consumirse desde `useRestaurantProfile` respaldado por `react-query` y un servicio dedicado de restaurante, para que logo, nombre y datos base se propaguen de forma consistente en vistas publicas e internas sin depender de `localStorage`.
- Patron frontend registrado: las vistas administrativas de reportes o analitica que dependan de multiples metricas backend deben consumir un servicio dedicado por dominio en `src/services` y resolver cada bloque con claves `react-query` separadas bajo `['admin', 'reports', '<metrica>']`, manteniendo los graficos desacoplados del transporte HTTP.
- Patron de servicios registrado: cada vez que se cree o documente un servicio/endopoint nuevo, debe incluirse su ejemplo de consumo en `curl`.
- Patron de documentacion de APIs registrado: todo `curl` asociado a requests con body (`POST`, `PATCH` y cualquier otro metodo que envie payload) debe incorporar datos de ejemplo realistas, representativos del dominio y utiles para prueba manual, evitando bodies vacios o placeholders genericos.
- Patron backend registrado: el dominio operativo del restaurante debe modelarse separado de `auth`, `user`, `profile`, `role` y `profile_role`, evitando mezclar autenticacion interna con entidades de operacion como restaurante, mesas, menu, pedidos y solicitudes de servicio.
- Patron backend registrado: cuando se implemente persistencia para el flujo operativo del frontend, las relaciones base deben preservar esta jerarquia funcional: `Restaurant` como agregado principal; `Table`, `Category`, `Product`, `DiningSession`, `Order` y `ServiceRequest` como entidades de operacion; `OrderItem`, `ProductExtra` y `OrderItemExtraSelection` como detalle transaccional dependiente.
- Patron backend registrado: el acceso del cliente a la mesa debe resolverse mediante `Table.qrCode` generado automaticamente como identificador publico de escaneo; el QR abre el contexto de mesa y desde ahi el frontend o cliente debe consumir endpoints publicos para recuperar la mesa e iniciar o reutilizar una `DiningSession`.
- Patron backend registrado: cuando el QR de mesa deba dirigir al frontend, `Table.qrCode` debe persistir una URL publica completa construida desde `FRONTEND_PUBLIC_URL` del `.env` backend, apuntando a una ruta cliente real del frontend y llevando el token de mesa en query string para que la experiencia de escaneo sea util desde celular sin hardcodes por ambiente.
- Patron backend registrado: la resolucion publica de mesas por QR debe normalizar y decodificar el token recibido antes de compararlo, para tolerar links o tokens re-encodados por scanners, navegadores o copias manuales sin romper el acceso de la mesa.
- Patron backend registrado: la resolucion publica de mesas por QR debe aceptar como entrada tanto la URL publica completa como el token crudo `table:...`, porque el cliente puede reenviar cualquiera de los dos formatos segun el punto de origen del link o del escaneo.
- Patron backend registrado: cuando se investiguen flujos publicos criticos como QR o apertura de sesion, la trazabilidad temporal debe implementarse con `Logger` de Nest en los servicios involucrados, registrando payload de entrada, ids o tokens normalizados, resultado de resolucion y excepciones en `catch`, evitando `console.log` disperso.
- Patron backend registrado: la cuenta del cliente se debe modelar sobre `DiningSession` y no solamente sobre `Table`; una mesa puede tener multiples sesiones activas en paralelo para soportar cuentas separadas, y todos los pedidos o extras de una misma cuenta deben vincularse al mismo `sessionToken`.
- Patron backend registrado: los pedidos publicos del cliente deben crearse como nuevas filas de `Order` asociadas a una `DiningSession` existente; los extras posteriores no deben reescribir el pedido original, sino agregarse como nuevos pedidos o items dentro de la misma sesion para conservar una sola cuenta agregada.
- Patron backend registrado: en modo single-tenant, el dominio `Restaurant` sigue siendo la raiz del modelo pero su resolucion no debe recaer en el frontend administrativo; el backend debe poder obtener o bootstrapear el restaurante actual y exponer recursos `current` para lectura publica y administracion protegida.
- Patron backend registrado: los recursos internos administrativos que dependan de sesion autenticada deben protegerse con validacion de JWT desde cookie `jwt`, pudiendo aceptar header Bearer solo como compatibilidad tecnica secundaria, y la excepcion de bootstrap debe declararse explicitamente cuando aplique.
- Patron de documentacion backend registrado: los ejemplos manuales de consumo HTTP deben guardarse en archivos bajo `backend/docs/curl/`, organizados por controlador o recurso, con nombres consistentes como `<recurso>.curl.md` y ejemplos reales de cookies, payloads y rutas disponibles.
- Regla de controllers backend registrada: todo controller nuevo debe crearse protegido por validacion de cookies basada en la cookie `jwt` desde su definicion inicial.
- Excepcion tecnica registrada: solo los endpoints explicitamente publicos y necesarios para bootstrap o autenticacion inicial, como `auth/login`, `auth/refresh`, `auth/logout` o cargas iniciales deliberadas, pueden quedar sin guard de cookies, y esa excepcion debe quedar justificada de forma explicita.
- Excepcion tecnica registrada: los endpoints publicos orientados a cliente final para flujo de escaneo QR, apertura o consulta de `DiningSession` y creacion de pedidos sobre una sesion vigente pueden exponerse sin guard JWT, siempre que queden aislados del dominio administrativo interno y operen sobre tokens publicos de mesa o sesion.
- Patron de infraestructura local registrado: el entorno de desarrollo vigente no debe depender de Docker. `backend` y `mesa-magica` deben ejecutarse localmente con sus scripts `npm`, manteniendo la configuracion sensible en archivos `.env` y dejando PostgreSQL como dependencia externa al repositorio.
- Patron de infraestructura complementaria registrado: si se agrega Docker, debe implementarse como via opcional y no como reemplazo obligatorio del flujo local con `npm`; la orquestacion debe vivir en la raiz del monorepo, preservar la separacion `backend` y `mesa-magica`, y resolver dependencias locales de desarrollo mediante volumenes y servicios dedicados sin alterar los `.env` usados fuera de contenedores.
- Patron de infraestructura complementaria registrado: en Windows, el `docker-compose.yml` base debe priorizar ejecucion estable sin bind mounts ni file watching dentro de `backend` y `mesa-magica`, porque `ts-node-dev` y `vite` sobre volumenes montados pueden fallar con errores `EIO`; si se necesita hot reload en contenedor, debe resolverse como variante explicita y no como modo por defecto.
- Patron frontend/infrastructura registrado: cuando `mesa-magica` se publique en Docker detras de `nginx`, la imagen de produccion debe incluir una configuracion de SPA fallback con `try_files $uri $uri/ /index.html;` para que rutas cliente como `/cliente/bienvenida` o `/admin/...` no respondan `404` al refrescar o abrir enlaces directos.
- Patron backend registrado: en CRUD administrativos del dominio operativo, la eliminacion debe resolverse como borrado logico mediante `state = false`, y cuando el recurso tenga dependencias activas directas relevantes para la consistencia funcional, el backend debe bloquear la eliminacion con error explicito antes de desactivar el registro.
- Patron backend registrado: los endpoints administrativos de analitica y reportes deben exponerse en un modulo dedicado protegido con cookie JWT, resolver el restaurante actual en backend y aceptar filtros de rango por `startDate` y `endDate` o `days` para evitar logica temporal dispersa en frontend.
- Patron backend registrado: cuando el dashboard administrativo necesite KPIs operativos y rankings resumidos, esos datos deben exponerse desde el mismo modulo de reportes mediante endpoints agregados de resumen, reutilizando filtros de rango y evitando que el frontend reconstruya metricas a partir de multiples endpoints dispersos.
- Patron backend/frontend registrado: cuando una vista operativa interna como cocina necesite solo un subconjunto accionable del dominio, debe consumirse desde un endpoint dedicado de proyeccion operativa, por ejemplo `/order/kitchen/board`, filtrado en backend por estacion, estados y vigencia del registro, para evitar trasladar al frontend listados administrativos completos y filtrado disperso.
- Patron frontend registrado: la experiencia publica de cliente debe centralizar en `AppContext` la sesion activa de mesa, el carrito y el ultimo pedido enviado, con persistencia en `localStorage`, para que bienvenida, menu, carrito, confirmacion, seguimiento y ayuda compartan el mismo estado sin duplicar almacenamiento por pagina.
- Patron backend/frontend registrado: el catalogo publico orientado a cliente debe exponerse desde los modulos de dominio existentes mediante endpoints `public` sin JWT, resolviendo siempre el restaurante actual en backend y limitando la respuesta a registros activos para evitar que el frontend dependa de ids administrativos o reconstruya el contexto single-tenant.
- Patron backend/frontend registrado: cuando la operacion necesite reflejo inmediato entre cliente, cocina y administracion, la notificacion en tiempo real debe resolverse mediante SSE sobre endpoints dedicados, reutilizando cookies JWT para canales internos y tokens publicos de sesion para canales del cliente, mientras los datos completos siguen leyendose desde servicios HTTP normales e invalidacion de `react-query`.
- Patron frontend registrado: cuando una accion publica del cliente dependa del estado operativo de la sesion, como solicitar la cuenta, la vista debe validar primero la `DiningSession` vigente desde la capa `services` con `react-query` y bloquear la accion con feedback explicito hasta que se cumpla la regla de negocio, evitando confiar solo en estado local persistido.
- Patron backend/frontend registrado: el flujo de cobro y cierre debe modelarse sobre `DiningSession` mediante una entidad `Payment` separada, permitiendo multiples pagos parciales por sesion, propina y vuelto por transaccion, dejando el cierre como accion explicita posterior al saldo cero y auditando cada accion interna con el usuario autenticado.
- Patron backend registrado: toda autorizacion interna nueva debe resolverse en backend combinando `AuthGuard('jwt')` con guard de roles y metadata explicita por endpoint, evitando confiar solo en `ProtectedRoute` del frontend.
- Patron backend registrado: la numeracion operativa sensible, como correlativos de pedido o folios internos, debe persistirse mediante tablas de secuencia dedicadas y bloqueo transaccional, evitando `MAX + 1` bajo concurrencia.
- Patron backend registrado: toda accion sensible de operacion interna, como cobro, cancelacion, apertura/cierre de caja, cierre o reapertura de cuenta, descuento o anulacion, debe dejar registro en `audit_log`.
- Patron backend registrado: las nuevas capacidades operativas transversales, como caja, comprobantes, reservas o fiscalizacion documental interna, deben implementarse como modulos NestJS independientes con `entity/controller/service/dto` y no incrustarse en `order` o `payment`.
- Patron backend registrado: la evolucion de esquema debe materializarse en migraciones TypeORM bajo `backend/src/database/migrations`, y la configuracion de TypeORM debe preferir `migrationsRun` antes que `synchronize`.
- Patron backend registrado: cuando el sistema requiera SSE mas resiliente que memoria local, los eventos deben persistirse en base de datos y el stream debe poder reconstruirse desde `last-event-id`, para tolerar reconexiones y despliegues con multiples instancias.
- Patron backend/frontend registrado: el control de stock de productos debe ser opt-in por producto (`trackStock`), mantener cantidad disponible y umbral de alerta, descontarse al crear pedidos reales y restaurarse si el pedido se anula.
- Patron backend/frontend registrado: descuentos administrativos sobre pedidos deben modelarse sobre `Order` con `subtotalBeforeDiscount`, `discountType`, `discountValue`, `discountAmount` y `discountReason`, de modo que reportes, cobro y auditoria compartan la misma fuente de verdad.
- Patron backend/frontend registrado: los comprobantes imprimibles deben generarse desde backend como snapshot persistido con HTML imprimible y exponerlo al frontend solo para visualizacion o impresion, evitando reconstruir el comprobante desde estado parcial de UI.
- Patron backend/frontend registrado: la caja diaria debe modelarse mediante `CashSession` con apertura, esperado, cierre, diferencia y responsables, y el frontend administrativo debe operar sobre ese recurso dedicado en lugar de derivar caja desde reportes sueltos.
- Patron backend/frontend registrado: las reservas deben tratarse como modulo administrativo propio con estado, fecha/hora, party size y mesa opcional, sin mezclar su ciclo de vida con `DiningSession` hasta que el negocio defina una transicion explicita a mesa atendida.
- Patron backend/frontend registrado: la fiscalizacion documental interna debe implementarse como modulo de documentos persistidos asociado a `DiningSession`, `Payment` y `Receipt`, dejando las integraciones tributarias externas como una capa posterior y no embebida de forma rigida en la UI.
- Patron backend de seguridad registrado: los endpoints de bootstrap publico de usuarios, como `user/init-data` y `user/public-create`, deben quedar habilitados solo en entornos de desarrollo o prueba, o mediante bandera explicita de entorno (`ALLOW_PUBLIC_BOOTSTRAP=true`), y deben permanecer bloqueados por defecto en produccion.
- Patron de cierre operativo registrado: antes de declarar el sistema listo para produccion, debe existir un checklist E2E por rol (cliente, cocina y administracion) con evidencia de ejecucion tecnica (tests/build) y estado explicito de validaciones manuales o bloqueos de entorno como `No determinado`.
- Patron de documentacion registrado: el repositorio debe mantener una documentacion raiz separada en `README.md` tecnico de implementacion y `MANUAL_USUARIO.md` funcional por modulo, actualizada cada vez que cambien flujos de cliente, cocina o administracion.
- Patron frontend de formato monetario registrado: todos los precios, subtotales y totales visibles en UI deben mostrarse en CLP con separador de miles y sin decimales, reutilizando un helper central (`src/lib/currency.ts`) para evitar formateo disperso con `toFixed`.
- Patron backend/frontend registrado: al iniciar sesion publica por QR sin `existingSessionToken`, el backend debe reutilizar la sesion activa mas reciente de la mesa para preservar pedidos y cuenta en reingresos de navegador o reescaneo, evitando crear sesiones vacias por defecto.
- Patron backend/frontend registrado: si por historial existen multiples `DiningSession` activas en una misma mesa, el inicio publico por QR debe priorizar reutilizar la sesion con actividad (pedidos o pagos) y solo crear una nueva cuando no exista ninguna sesion activa.
- Patron frontend registrado: en listados historicos clickeables que cambian el detalle activo, la seleccion de UI debe usar una clave estable con fallback (`id` o composicion deterministica como `number-createdAt`) para tolerar registros legacy sin `id` consistente y evitar que el detalle quede fijo en un solo elemento.
