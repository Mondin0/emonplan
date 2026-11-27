# Revisores de EmonPlan

Cada [perfil Markdown](roles/) se puede usar como instrucción de un agente en el entorno que use el equipo. Dale a cada revisor su perfil, esta guía, las [convenciones del repo](../AGENTS.md), el alcance, los criterios de aceptación y el diff o las rutas que se van a revisar.

| Perfil | Cuándo convocarlo |
| --- | --- |
| [QA funcional](roles/qa.md) | Cambios de comportamiento o criterios de aceptación. |
| [UX, UI y accesibilidad](roles/ux.md) | Cambios en pantallas, formularios y navegación. |
| [Seguridad de aplicaciones](roles/seguridad.md) | Cambios en accesos, endpoints, exposición de datos o dependencias sensibles. |
| [Arquitectura](roles/arquitectura.md) | Cambios de contratos o que cruzan módulos o capas. |
| [Datos y PostgreSQL](roles/dba.md) | Cambios en migraciones, consultas, transacciones o datos históricos. |

## Cómo trabajar

1. El coordinador da a los revisores el mismo alcance. Si se revisa trabajo en curso, indica si entran los cambios sin commit y qué archivos sin seguimiento forman parte del alcance. Si se revisa una rama, indica la base de comparación.
2. Los revisores trabajan en solo lectura. Configurá ese permiso en el entorno de ejecución. Pueden leer código, pruebas, documentación y diffs. Las revisiones operativas sobre infraestructura, accesos, credenciales o producción siguen las autorizaciones del equipo.
3. El coordinador consolida los hallazgos en el chat, elimina duplicados y eleva las decisiones de producto o de alcance a la persona responsable. Un solo implementador escribe por cambio. Si ya hay trabajo paralelo, puede usar un *worktree* separado desde una base acordada.
4. Para cambios funcionales, el implementador sigue el ciclo de prueba fallida, corrección y verificación de [AGENTS.md](../AGENTS.md).

Cada hallazgo incluye evidencia con ruta y línea, el impacto concreto y la corrección sugerida. Indicá si el problema está confirmado o requiere verificación y listá las comprobaciones pendientes. Si no hay hallazgos, indicá qué se revisó y qué quedó pendiente.

Ejemplo de convocatoria:

> Usá los perfiles QA y UX de `agents/roles/` para revisar los cambios de Studio asociados a esta ficha. Tomá el árbol actual como alcance, incluidos los archivos de Studio sin seguimiento. Entregá los hallazgos en el chat y mantené la revisión en solo lectura.

## Codex

En Codex local, las definiciones de [`.codex/agents/`](../.codex/agents/) permiten convocar a `qa`, `ux`, `seguridad`, `arquitectura` y `dba` por nombre. Cada definición lee su perfil de `agents/roles/`, que también podés usar desde otras herramientas.

> Convocá a `qa` y `ux` como subagentes de Codex para revisar este paquete de Studio. Compartiles la ficha y el alcance, canalizá sus consultas y devolveme los hallazgos consolidados.

Los revisores reciben instrucciones de solo lectura y heredan los permisos de la sesión principal. Para limitar la escritura a nivel de permisos durante una revisión, iniciá Codex en una sesión de solo lectura.
