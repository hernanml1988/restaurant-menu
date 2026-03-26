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
  Backend: Medio. La estructura modular existe, pero varios modulos CRUD estan en estado scaffold y no completan su capa de negocio.
- Integracion entre frontend y backend: No determinada como implementacion activa. El frontend actual consume datos mock locales y no realiza llamadas HTTP al backend.
- Infraestructura detectada: no hay dockerizacion activa en el repositorio. El desarrollo local se resuelve con ejecucion directa de `backend` y `mesa-magica` mediante Node.js, y la base PostgreSQL debe estar disponible fuera del repo o instalada localmente.

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
  `react-query` esta configurado en `App.tsx`, pero no se detecto uso real de `useQuery` o `useMutation`.
- Fuente de datos actual:
  Los datos operativos provienen de `src/data/mockData.ts`.
  El frontend debe considerarse actualmente como prototipo/demo funcional desacoplado del backend real.
- Convenciones de nombres:
  Componentes y paginas en PascalCase.
  Hooks con prefijo `use`.
  Alias `@` apuntando a `src`.
  Rutas organizadas por dominio funcional y no por feature package avanzada.
- Consumo de APIs:
  No determinado como patron activo en el frontend actual.
  No se detectaron clientes HTTP, `fetch`, `axios` ni wrappers de servicios.
- Manejo de errores:
  No existe una estrategia transversal de errores de red porque no hay integracion activa.
  Los errores de contexto se manejan con `throw new Error` en hooks como `useApp`.
  La UX se apoya en `Toaster` y `Sonner`, aunque no se detecto un flujo centralizado de errores.
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
  `auth`, `user`, `role`, `profile`, `profile_role`.
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
  Observacion tecnica: la clave JWT esta hardcodeada como `secretKey` en modulo y estrategia; no proviene de configuracion externa.
- Manejo de errores:
  Se usa una utilidad `Utils.errorResponse(error)` que relanza `HttpException`.
  El patron no es uniforme en todos los servicios/controladores.
  Existen `try/catch` locales y respuestas manuales con `res.status(...).send(...)`.
- Logs:
  No se detecto estrategia de logging estructurado ni servicio de logs dedicado.
- Principios SOLID aplicados:
  S: Parcial. Hay separacion controller/service, pero algunas responsabilidades de respuesta HTTP y autenticacion siguen acopladas.
  O: Parcial.
  L: No determinado.
  I: No determinado.
  D: Bajo a medio. La aplicacion depende directamente de repositorios TypeORM y configuraciones concretas.
- Estado funcional real del backend:
  `auth` y `user` contienen logica funcional parcial.
  `role`, `profile` y `profile_role` conservan mayormente endpoints scaffold con respuestas placeholder.
  `user/init-data` ejecuta una carga inicial acoplada y con credenciales embebidas en codigo.
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
  No se detectaron migraciones.
  La sincronizacion automatica esta habilitada con `synchronize: true`.
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
  No se detectaron migraciones versionadas.
  No se detectaron indices adicionales, constraints complejos ni configuraciones avanzadas de relaciones.
  El nombre de base configurado es `calendar`, lo que no coincide semanticamente con el dominio del restaurante.

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
  eliminar credenciales hardcodeadas,
  formalizar DTOs,
  unificar manejo de errores.
- Si se trabaja base de datos en backend, evitar seguir profundizando `synchronize: true` como estrategia de largo plazo sin plantear migraciones.
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
- Patron de servicios registrado: cada vez que se cree o documente un servicio/endopoint nuevo, debe incluirse su ejemplo de consumo en `curl`.
- Patron de documentacion de APIs registrado: todo `curl` asociado a requests con body (`POST`, `PATCH` y cualquier otro metodo que envie payload) debe incorporar datos de ejemplo realistas, representativos del dominio y utiles para prueba manual, evitando bodies vacios o placeholders genericos.
- Patron backend registrado: el dominio operativo del restaurante debe modelarse separado de `auth`, `user`, `profile`, `role` y `profile_role`, evitando mezclar autenticacion interna con entidades de operacion como restaurante, mesas, menu, pedidos y solicitudes de servicio.
- Patron backend registrado: cuando se implemente persistencia para el flujo operativo del frontend, las relaciones base deben preservar esta jerarquia funcional: `Restaurant` como agregado principal; `Table`, `Category`, `Product`, `DiningSession`, `Order` y `ServiceRequest` como entidades de operacion; `OrderItem`, `ProductExtra` y `OrderItemExtraSelection` como detalle transaccional dependiente.
- Patron backend registrado: los recursos internos administrativos que dependan de sesion autenticada deben protegerse con validacion de JWT desde cookie `jwt`, pudiendo aceptar header Bearer solo como compatibilidad tecnica secundaria, y la excepcion de bootstrap debe declararse explicitamente cuando aplique.
- Patron de documentacion backend registrado: los ejemplos manuales de consumo HTTP deben guardarse en archivos bajo `backend/docs/curl/`, organizados por controlador o recurso, con nombres consistentes como `<recurso>.curl.md` y ejemplos reales de cookies, payloads y rutas disponibles.
- Regla de controllers backend registrada: todo controller nuevo debe crearse protegido por validacion de cookies basada en la cookie `jwt` desde su definicion inicial.
- Excepcion tecnica registrada: solo los endpoints explicitamente publicos y necesarios para bootstrap o autenticacion inicial, como `auth/login`, `auth/refresh`, `auth/logout` o cargas iniciales deliberadas, pueden quedar sin guard de cookies, y esa excepcion debe quedar justificada de forma explicita.
- Patron de infraestructura local registrado: el entorno de desarrollo vigente no debe depender de Docker. `backend` y `mesa-magica` deben ejecutarse localmente con sus scripts `npm`, manteniendo la configuracion sensible en archivos `.env` y dejando PostgreSQL como dependencia externa al repositorio.
- Patron de infraestructura complementaria registrado: si se agrega Docker, debe implementarse como via opcional y no como reemplazo obligatorio del flujo local con `npm`; la orquestacion debe vivir en la raiz del monorepo, preservar la separacion `backend` y `mesa-magica`, y resolver dependencias locales de desarrollo mediante volumenes y servicios dedicados sin alterar los `.env` usados fuera de contenedores.
