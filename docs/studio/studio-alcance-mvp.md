# STUDIO de EmonPlan · Alcance del MVP

**Borrador para revisión**

STUDIO será un módulo interno de EmonPlan. Permitirá que un instalador represente un tablero eléctrico de 12 módulos DIN, dibuje sus conexiones y consulte una lista de materiales para preparar un presupuesto.

## Alcance del MVP

- **Proyecto.** Nombre editable y tipo monofásico o trifásico. El tipo se registra como dato del diseño. El borrador se guarda automáticamente en el navegador y se recupera al recargar la página.
- **Montaje.** Un gabinete de 12 módulos con riel DIN visible. El catálogo inicial incluye térmicas, diferenciales y borneras de neutro y tierra, con SVG detallados, ancho en módulos y bornes seleccionables. Se puede colocar, mover y quitar piezas. El encastre exige posiciones contiguas libres dentro del riel.
- **Cableado visual.** Se eligen dos bornes para crear un tramo con recorrido ortogonal automático. El usuario puede asignar y editar el color y la sección nominal del cable, y eliminar el tramo. La paleta usa etiquetas de fase, neutro y PE.
- **Edición.** Se pueden deshacer y rehacer cambios. Al quitar una pieza se quitan sus conexiones en la misma operación. Deshacer recupera la pieza y sus conexiones. En pantallas táctiles se puede seleccionar una pieza y tocar el riel para colocarla.
- **Lista de materiales.** El editor cuenta las piezas colocadas y las agrupa por tipo y atributos de compra. Los cables se cuentan por tramos agrupados por color y sección.

## Alcance posterior

Más gabinetes y accesorios, edición manual de recorridos, estimación de metros con escala física, importación y exportación JSON, exportación a PNG y PDF, vista previa a pantalla completa e integración con presupuestos. Las reglas de montaje y cableado del MVP verifican la integridad del dibujo. La validación eléctrica o normativa requiere un alcance propio.

## Criterio de cierre

En escritorio y en una pantalla táctil, el usuario puede armar un tablero, conectar dos bornes, corregir una conexión y recargar la página. El diseño recuperado y la lista de materiales coinciden con lo que dejó guardado.

## Historias de usuario

La interfaz elegida es la **opción C**. El tablero permanece visible y el panel derecho cambia entre **Montar**, **Conectar** y **Materiales**. [Maquetas de Studio](../../agents/plans/studio-interfaces.html#c).

### ST-01 · Crear y recuperar un proyecto

**Historia.** Como instalador, quiero nombrar mi proyecto, indicar si es monofásico o trifásico y retomar mi trabajo al volver a abrir Studio.

**Especificación.** El proyecto tiene un nombre editable, un tipo descriptivo y un gabinete de 12 módulos con el riel DIN visible. Studio guarda automáticamente el borrador en el navegador, incluidos los componentes y los tramos.

**Criterios de aceptación**

- **ST-01.1** Al abrir Studio sin un borrador, aparece un gabinete vacío con 12 posiciones.
- **ST-01.2** Si cambio el nombre y el tipo, al recargar recupero ambos valores.
- **ST-01.3** Si guardé piezas y tramos, al recargar recupero sus posiciones, conexiones y atributos. Este caso se verifica cuando ST-02 y ST-03 estén disponibles.
  - Si falla el almacenamiento local al montar una pieza, Studio avisa que el cambio quedó sin guardar y permite deshacer y rehacer en la sesión abierta. Al recargar, se recupera el último borrador guardado.

### ST-02 · Montar y mover componentes

**Historia.** Como instalador, quiero colocar y mover piezas en el riel para representar la distribución del tablero.

**Especificación.** El modo **Montar** muestra térmicas, diferenciales y borneras de neutro y tierra. Cada pieza tiene un SVG, un ancho en módulos y bornes identificables. El destino del montaje o movimiento debe tener suficientes posiciones contiguas libres dentro del riel. En pantalla táctil, se coloca una pieza seleccionándola en el catálogo y tocando una posición del riel.

**Criterios de aceptación**

- **ST-02.1** Una pieza de dos módulos se coloca en las posiciones 11 y 12 si ambas están libres.
- **ST-02.2** Si intento colocarla en la posición 12 o superponerla con otra, el tablero conserva su estado anterior.
- **ST-02.3** Si muevo una pieza conectada a un destino válido, los tramos conservan los mismos bornes y se redibujan desde la nueva ubicación. Se verifica con ST-03.
- **ST-02.4** En una pantalla táctil, puedo colocar una pieza seleccionándola y tocando una posición válida.

- **ST-02.5** Al activar una pieza del catálogo o una pieza montada con el teclado, el foco visible pasa al primer destino válido del riel, si hay uno. Puedo elegir y confirmar otro destino con el teclado.

### ST-03 · Conectar bornes y editar un tramo

**Historia.** Como instalador, quiero unir dos bornes y ajustar los atributos del cable para representar cómo se conecta el tablero.

**Especificación.** En **Conectar**, selecciono dos bornes distintos para crear un tramo con recorrido ortogonal automático. Al seleccionar el tramo, el panel muestra sus extremos, el color y la sección nominal. El panel permite editar el color o la sección y eliminar el tramo. La paleta identifica fase, neutro y PE.

**Criterios de aceptación**

- **ST-03.1** Al seleccionar dos bornes distintos, aparece un tramo ortogonal que termina en ambos.
- **ST-03.2** Seleccionar el mismo borne dos veces no crea un tramo.
- **ST-03.3** Al editar el color o la sección, el tramo conserva sus extremos y el panel muestra los valores nuevos.
  - Si confirmo una sección inválida, el campo conserva el valor ingresado y muestra un mensaje asociado. El tramo y el historial conservan su estado anterior. Si vacío el campo y confirmo, el tramo queda sin sección.
- **ST-03.4** Puedo conectar dos bornes con toques y eliminar un tramo desde el panel sin alterar los demás.

### ST-04 · Quitar un componente

**Historia.** Como instalador, quiero retirar una pieza para corregir el montaje sin dejar conexiones colgando.

**Especificación.** Quitar una pieza libera sus posiciones y elimina todos los tramos conectados a sus bornes en una sola operación.

**Criterios de aceptación**

- **ST-04.1** Si retiro una pieza con dos tramos conectados, desaparecen la pieza y ambos tramos, y sus posiciones quedan libres.
- **ST-04.2** Las otras piezas y conexiones conservan sus posiciones y atributos.

### ST-05 · Deshacer y rehacer cambios

**Historia.** Como instalador, quiero deshacer y rehacer cambios para probar una distribución y corregir errores.

**Especificación.** **Deshacer** y **Rehacer** están disponibles en los tres modos. El historial registra cada operación de montaje y cableado como una acción completa. Al recargar, se recupera el tablero guardado y el historial empieza vacío.

**Criterios de aceptación**

- **ST-05.1** Tras mover una pieza o editar la sección de un tramo, deshacer recupera el valor anterior y rehacer vuelve a aplicar el cambio.
  - Enter confirma una sección válida y mantiene el foco en el campo. Salir del campo también confirma el cambio. Si confirmo con Enter y luego salgo, el historial registra una sola operación que puedo deshacer y rehacer.
- **ST-05.2** Deshacer la eliminación de una pieza recupera en un paso su posición y sus tramos, con los extremos, colores y secciones originales. Rehacer vuelve a quitar el conjunto.
- **ST-05.3** Si deshago una acción y hago un cambio nuevo, se descartan las acciones pendientes de rehacer.

### ST-06 · Consultar la lista de materiales

**Historia.** Como instalador, quiero saber qué piezas y tramos contiene el tablero para preparar la compra o el presupuesto.

**Especificación.** El modo **Materiales** deriva la lista del tablero actual. Las piezas se agrupan por tipo y atributos de compra. Los cables se agrupan por color y sección nominal y se cuentan por tramos.

**Criterios de aceptación**

- **ST-06.1** Dos piezas del mismo tipo con los mismos atributos de compra aparecen en un renglón con cantidad dos. Si difiere un atributo de compra, aparecen en renglones distintos.
- **ST-06.2** Dos tramos azules de 2,5 mm² aparecen en un renglón con cantidad dos. Cambiar la sección de uno deja un tramo por renglón para las dos secciones.
- **ST-06.3** Al quitar una pieza conectada, la lista refleja la baja de la pieza y sus tramos. Al deshacer o recargar, la lista coincide con el tablero recuperado.
  - Con entrada táctil, puedo quitar una pieza con dos tramos y ver la baja en Materiales. Al deshacer desde Materiales, se recuperan la pieza, los dos tramos y sus cantidades. Al recargar, se recupera ese tablero y Deshacer y Rehacer quedan inactivos. Playwright verifica este caso con entrada táctil emulada.

## Cómo retomar el trabajo

1. **Siguiente paquete.** Empezar con ST-01 y la colocación de una térmica de ST-02. El primer recorrido verificable es abrir Studio, editar el proyecto, colocar la térmica y recuperarla al recargar.
2. **Entrevista y ficha.** Resolver las decisiones del paquete y preparar su ficha HTML para aprobación. Para cada criterio, registrar el ID, las precondiciones, los datos de prueba, la acción, el resultado observable y cómo se verificará.
3. **Implementación.** Escribir primero la prueba de regresión, comprobar que falla por el motivo esperado y hacer el cambio mínimo para que pase.
4. **Verificación.** Registrar los resultados por ID y ejecutar las pruebas de backend, las de frontend, el build y el flujo real en Docker. El cierre del MVP cubre montar, conectar, corregir, recargar y revisar materiales en escritorio y pantalla táctil.

## Decisiones pendientes

| Historia | Decisión |
| --- | --- |
| ST-02 y ST-06 | Definir los atributos de compra que distinguen piezas de cada familia. |
| ST-06 | Confirmar si el MVP permite generar renglones de presupuesto. Las historias actuales especifican la consulta dentro de Studio. |
