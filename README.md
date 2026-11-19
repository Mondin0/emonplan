# EmonPlan

Aplicación local para gestionar clientes, obras, circuitos, materiales y presupuestos en ARS. Go y PostgreSQL sirven la API; React representa unifilares a partir del modelo eléctrico persistido.

## Inicio

Requiere Docker Engine y Docker Compose v2 reciente (soporte de `!reset`).

Para iniciar la aplicación desde la raíz del proyecto, ejecutá `./levantar.sh`. Para apagarla y borrar su instalación local desde cero, ejecutá `./limpiar.sh` y escribí `BORRAR` cuando lo solicite. Esto elimina todos los datos y las credenciales de EmonPlan; el código del proyecto se conserva.

Con la aplicación iniciada, `./cargar-ejemplos.sh` agrega datos ficticios para la demo. Abrí **Centro Cultural La Estación** desde Proyectos para ver un unifilar con dos tableros y seis circuitos. La misma obra tiene materiales, cómputo, un presupuesto con PDF y actividades. Los importes y valores eléctricos son solo para pruebas. Cada versión de los ejemplos se carga una vez por base de datos. Repetir la carga aplica las versiones pendientes y conserva las ediciones y bajas previas.

```sh
make setup
docker compose up -d --build
docker compose ps
```

Abrir http://localhost:8080. Las credenciales iniciales están en `.env`: `OWNER_EMAIL` y `OWNER_PASSWORD`. `make setup` genera secretos aleatorios con OpenSSL y no sobrescribe un archivo existente. También se puede copiar `.env.example` y reemplazar todos los valores de ejemplo. La cuenta inicial se crea únicamente si todavía no existe; cambiar la variable luego no cambia su contraseña.

La publicación está limitada a localhost. PostgreSQL no publica puertos. Las cookies permiten HTTP para esta instalación local; antes de exponer un servidor remoto se requiere HTTPS y cookies Secure.

## Operación

Ejecutá estos comandos desde la raíz del proyecto:

| Comando | Qué hace |
| --- | --- |
| `./levantar.sh` | Crea `.env` si falta, construye e inicia los servicios y muestra su estado. |
| `./cargar-ejemplos.sh` | Carga las versiones pendientes de los datos ficticios en la base iniciada. |
| `./limpiar.sh` | Pide confirmar con `BORRAR` y elimina contenedores, imágenes locales, base de datos y `.env`. |
| `make setup` | Crea `.env` con credenciales aleatorias si todavía no existe. |
| `make up` | Construye e inicia los servicios en segundo plano; requiere `.env`. |
| `make down` | Detiene y elimina los contenedores y la red, pero conserva el volumen de datos y `.env`. |
| `make logs` | Muestra los registros de los servicios; salí con `Ctrl+C`. |
| `make dev` | Inicia el entorno de desarrollo con recarga automática. |
| `make test` | Ejecuta las pruebas locales y compila el frontend. |
| `make test-integration` | Ejecuta las pruebas PostgreSQL con `TEST_DATABASE_URL` configurada. |
| `make test-e2e` | Ejecuta el recorrido de aceptación en una instalación Docker temporal aislada. |

`./limpiar.sh` borra también los datos reales, además de los ejemplos. No usar `docker compose down -v` salvo que se quiera borrar el volumen de la instalación. Las migraciones SQL versionadas se ejecutan durante el arranque del backend.

Para respaldar:

```sh
docker compose exec -T db pg_dump -U emonplan emonplan > backup.sql
```

Para restaurar en una base vacía, con la API detenida:

```sh
docker compose stop backend frontend
docker compose exec -T db psql -U emonplan -d emonplan < backup.sql
docker compose up -d
```

El frontend de desarrollo utiliza Vite con hot reload. Compose Watch reinicia el backend cuando cambian sus fuentes Go.

## Decisiones

- Monolito modular con chi, pgx y SQL parametrizado; PostgreSQL es la única persistencia.
- Sesiones del propietario con cookies HttpOnly y protección CSRF.
- Importes en centavos ARS. Las cotizaciones emitidas conservan precios históricos.
- El modelo de tableros y circuitos genera el diagrama; no se almacenan coordenadas CAD como fuente de verdad.
- Los parámetros eléctricos son ingresados por el usuario y no certifican cumplimiento de AEA 90364.
- No hay servicios externos, métricas inventadas ni datos de ejemplo automáticos.
- Planos: una imagen PNG o JPEG por proyecto, hasta 10 MiB y 40 millones de píxeles. Cargar otra reemplaza la anterior. Se guarda en PostgreSQL y se elimina junto con el proyecto. Todavía no admite PDF, escala ni símbolos.
- El relevamiento y sus pendientes están en [NORMATIVA.md](NORMATIVA.md); aún no hay asistente normativo ni registro de jurisdicción.

## Verificación

Cada funcionalidad o corrección comienza con una prueba que falla por el comportamiento esperado; luego se implementa y se conserva la prueba de regresión. Las convenciones están en [AGENTS.md](AGENTS.md).

- `make test` ejecuta las pruebas Go y del frontend y compila el frontend. Sin `TEST_DATABASE_URL`, la prueba de integración PostgreSQL se omite.
- `TEST_DATABASE_URL=... make test-integration` ejecuta las migraciones y prueba planos sobre PostgreSQL. Necesita permiso para crear y eliminar un esquema temporal propio; usar una base de pruebas.
- `make test-e2e` crea una instalación Compose aislada con credenciales y volumen temporales, prueba autenticación, cliente, proyecto, tablero, circuito, unifilar, materiales, cómputo, presupuesto, PDF, actividad y planos, y comprueba la persistencia tras reiniciar. Elimina únicamente los recursos del proyecto temporal. Requiere Docker y Compose, OpenSSL, dependencias del frontend (`cd frontend && npm ci`) y Chromium de Playwright (`cd frontend && npx playwright install chromium`).

Los resultados concretos se informan al finalizar la implementación; la creación de archivos por sí sola no acredita esos resultados.

En el entorno de desarrollo de esta revisión, Docker denegó el acceso a su socket. El flujo completo y la persistencia del plano tras reiniciar quedan pendientes de ejecución con Docker y PostgreSQL accesibles.
