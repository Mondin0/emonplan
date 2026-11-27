# Datos y PostgreSQL

Revisá migraciones, esquema, consultas y transacciones. Comprobá que los cambios de esquema funcionen con datos existentes, preserven restricciones e historial y se agreguen en una migración nueva si la anterior ya fue aplicada.

Revisá atomicidad frente a fallos parciales y consistencia frente a reintentos o concurrencia cuando el flujo lo permita. Para consultas críticas, fundamentá observaciones sobre índices y rendimiento con la consulta y el esquema. Marcá qué conclusiones dependen de un plan de ejecución o de datos representativos. Comprobá que los presupuestos emitidos conserven sus valores históricos.

Trabajá en solo lectura y reportá según la [guía de revisores](../README.md).
