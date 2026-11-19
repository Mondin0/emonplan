import {introductoryLessons as existing, type LessonContent} from './lessonContent';

const aea = {label: 'AEA · Proyecto de instalaciones en viviendas', url: 'https://aea.org.ar/capacitacion/proyecto-instalaciones-bt/'};
const safety = {label: 'SRT · Prevención del riesgo eléctrico', url: 'https://www.argentina.gob.ar/sites/default/files/02_guia_prevencion_riesgo_electrico_ok_.pdf'};
const testEquipment = {label: 'HSE · Instrumentos de prueba eléctrica (GS38)', url: 'https://www.hse.gov.uk/pubns/books/gs38.htm'};
const instruments = {label: 'Fluke · Fotos y fichas de multímetro y pinza', url: 'https://www.fluke.com/en-us/product/electrical-testing/digital-multimeters/fluke-117-323-kit'};
const leakage = {label: 'Fluke · Medición de corriente de fuga', url: 'https://www.fluke.com/en-us/learn/blog/clamps/leakage-current-measurement-basics'};

const floatSwitch = {label: 'Viyilant · Interruptor de nivel para llenado y vaciado', url: 'https://viyilant.com.ar/wp-content/uploads/2021/09/CONTROL_NIVEL_HEMETICO-TI.pdf'};
const photocontrol = {label: 'Kalop · Fotos y esquemas de conexión de fotocontroles', url: 'https://www.kalop.com.ar/kalop-descargas/fichas-tecnicas/productos-electricos/fotocontroles-kalop-ficha-tecnica.pdf'};

export const modules: {title: string; lessons: LessonContent[]}[] = [
  {
    title: 'Fundamentos de una vivienda',
    lessons: [
      {
        title: 'Mapa de una instalación domiciliaria',
        diagram: {
          caption: 'Del suministro a los puntos de uso',
          lanes: [
            ['Recorrido', 'Suministro', 'Medidor', 'Tablero', 'Circuitos finales'],
            ['Cómo localizar un punto', 'Punto en el plano', 'Identificador del circuito', 'Protección en el unifilar'],
          ],
        },
        intro: 'Pensá la instalación como un recorrido: suministro → medición → tablero → circuitos → puntos de utilización. El medidor registra energía y el tablero distribuye y protege los circuitos. En cada ambiente vas a encontrar puntos de uso, como luces y tomas, y elementos de paso o derivación.',
        details: [
          'Para empezar un relevamiento, dibujá la planta y marcá tablero, ambientes, puntos y recorridos visibles. Anotá qué pudiste identificar y qué queda por verificar. El unifilar resume cómo se relacionan alimentación, protecciones y circuitos. El plano muestra dónde están físicamente.',
          'Ejemplo: el lavadero y la cocina comparten pared. En el plano pueden verse juntos, mientras que el unifilar puede mostrar circuitos diferentes. Usá la identificación del circuito para unir ambas vistas.',
        ],
        source: aea,
        question: '¿Dónde buscarías primero qué circuito alimenta un punto ya identificado en el plano?',
        answers: [
          {label: 'En el unifilar y el cuadro de circuitos', correct: true, explanation: 'Relacionan ese circuito con su tablero y protección. La identificación en campo requiere verificación.'},
          {label: 'En la factura del suministro', correct: false, explanation: 'La factura informa consumo y cargos del suministro. El cuadro de circuitos describe la distribución interior.'},
        ],
      },
      existing.conductores,
      existing.tension,
    ],
  },
  {
    title: 'Seguridad y protecciones',
    lessons: [
      {
        title: 'Protecciones para trabajar',
        diagram: {
          caption: 'Decisiones antes de intervenir en una instalación',
          lanes: [
            ['Preparación por personal competente', 'Identificar todas las fuentes', 'Aislar', 'Impedir la reconexión y señalizar'],
            ['Verificación', 'Probar el detector apropiado', 'Verificar ausencia de tensión', 'Volver a probar el detector'],
            ['Si la verificación falla o es dudosa', 'Detener la tarea', 'Identificar la causa antes de intervenir'],
          ],
        },
        intro: 'Empezá por evaluar la tarea, identificar todas las fuentes y elegir un método de trabajo sin tensión. En una instalación real, el personal competente aísla, evita la reconexión, verifica la ausencia de tensión con equipo adecuado y protege frente a partes energizadas próximas. Una térmica en posición abierta, por sí sola, no confirma la ausencia de tensión.',
        details: [
          'Verificá documentación, estado del instrumento y sus puntas, categoría de medición y adecuación al lugar. Para verificar ausencia de tensión, el personal competente usa un detector bipolar apropiado y comprueba su funcionamiento antes y después según el procedimiento aplicable. Si corresponde, el procedimiento incluye puesta a tierra y cortocircuito y protección frente a partes próximas. Considerá fuentes alternativas como UPS o solar.',
          'El equipo de protección personal, las herramientas aisladas y la protección ocular se eligen según el riesgo. Son parte del trabajo seguro junto con el aislamiento, el control de acceso y la señalización. Ante un tablero mojado, olor a quemado o partes accesibles energizadas, alejate y solicitá intervención calificada.',
        ],
        source: safety,
        question: 'Una llave quedó apagada y la lámpara no enciende. ¿Podés tratar la caja como desenergizada?',
        answers: [
          {label: 'Hay que aislar y verificar según el procedimiento', correct: true, explanation: 'El estado de la lámpara no informa sobre todas las partes ni sobre realimentaciones.'},
          {label: 'Sí, la lámpara apagada alcanza', correct: false, explanation: 'La llave es un mando. El circuito puede conservar tensión en la caja.'},
        ],
      },
      existing.tablero,
      {
        title: 'Puesta a tierra',
        intro: 'La puesta a tierra vincula las partes metálicas accesibles que requieren protección. En el ejemplo con electrodo local, el PE llega al borne principal y desde allí al electrodo. El recorrido de la corriente de falla y la desconexión automática dependen del esquema de tierra.',
        details: [
          'Leé el dibujo desde la carcasa hacia el borne principal y el sistema de tierra. Un borne flojo o un PE interrumpido deja incompleto ese recorrido, aunque la carga pueda seguir funcionando entre fase y neutro.',
          'Continuidad del PE y resistencia de puesta a tierra son verificaciones distintas. El ensayo de la instalación real requiere instrumental, método y personal competente. La simulación muestra únicamente la diferencia entre un camino continuo y uno abierto.',
        ],
        diagram: 'tierra',
        source: aea,
        question: 'En la simulación, si el PE está interrumpido y la lámpara enciende, ¿qué concluís?',
        answers: [
          {label: 'Que el encendido comprueba la tierra', correct: false, explanation: 'Para evaluar el PE hace falta una verificación específica del camino de protección.'},
          {label: 'La carga funciona y la protección quedó comprometida', correct: true, explanation: 'La corriente normal usa fase y neutro. El PE tiene un recorrido independiente.'},
        ],
      },
    ],
  },
  {
    title: 'Líneas, cajas y canalizaciones',
    lessons: [
      {
        title: 'Línea de alimentación',
        diagram: {
          caption: 'El alimentador une dos tableros',
          lanes: [
            ['Tramo de alimentación', 'Tablero principal', 'Protección del alimentador', 'Alimentador', 'Tablero del taller'],
            ['Distribución en el taller', 'Protecciones de salida', 'Circuitos finales', 'Puntos de uso del taller'],
          ],
        },
        intro: 'Es el tramo que lleva energía hasta un tablero o desde un tablero a otro dentro del proyecto. Ubicá su origen y destino en el unifilar, junto con los dispositivos que la protegen. Los circuitos finales se identifican a partir de su tablero de origen.',
        details: ['En la visita anotá recorrido, longitud estimada, canalización, cargas previstas y datos de placa disponibles. La sección y la protección requieren evaluar uso, instalación, sobrecorriente y caída de tensión según el proyecto aplicable.'],
        source: aea,
        question: 'En el croquis, hay un cable entre tablero principal y tablero del taller. ¿Cómo lo registrás?',
        answers: [
          {label: 'Como alimentación al tablero del taller', correct: true, explanation: 'Identificás el origen y destino. Del tablero del taller salen sus circuitos finales.'},
          {label: 'Como circuito de una lámpara del taller', correct: false, explanation: 'El tramo continúa hasta el tablero. El ramal de esa lámpara empieza en su protección de salida.'},
        ],
      },
      {
        title: 'Línea de tomas',
        diagram: {
          caption: 'Una alimentación común con ramas independientes',
          lanes: [
            ['Circuito de tomas de ejemplo', 'Tablero', 'Protección del circuito', 'L, N y PE hacia la caja'],
            ['Primera derivación desde esa caja', 'Rama A · Toma del estar y su carga'],
            ['Segunda derivación desde la misma caja', 'Rama B · Toma del comedor y su carga'],
          ],
        },
        intro: 'El circuito de tomacorrientes lleva alimentación a puntos destinados a conectar equipos. Los tomas se representan en paralelo, con conductor de protección donde corresponda. El uso esperado de cada punto orienta el proyecto y el cuadro de circuitos.',
        details: ['En cocina y lavadero registrá equipos fijos y cargas de uso simultáneo. Un equipo que requiere circuito dedicado se trata aparte según el proyecto. Etiquetá los puntos con el identificador del circuito que efectivamente los alimenta.'],
        question: 'En el relevamiento aparecen una heladera, una pava y un horno. ¿Qué dato necesitás antes de plantear el circuito?',
        answers: [
          {label: 'Solo cuántos tomas hay en la pared', correct: false, explanation: 'Dos puntos pueden servir a equipos con demandas muy diferentes.'},
          {label: 'Las cargas previstas y las indicaciones de cada equipo', correct: true, explanation: 'La potencia, el tipo de uso y el manual permiten evaluar cómo distribuir los puntos.'},
        ],
      },
      {
        title: 'Línea de luces',
        diagram: {
          caption: 'Qué camino sigue cada conductor',
          lanes: [
            ['Fase de mando', 'Fase permanente', 'Llave', 'Retorno conmutado', 'Luminaria'],
            ['Neutro', 'Neutro del mismo circuito', 'Luminaria'],
            ['Protección', 'PE del circuito', 'Carcasa cuando corresponde'],
          ],
        },
        intro: 'El circuito de iluminación distribuye energía a las luminarias. En el plano se registran puntos de luz, ubicación de mandos y qué punto controla cada llave. En el esquema eléctrico se distingue la alimentación del retorno conmutado.',
        details: ['Ejemplo: el estar tiene dos luminarias bajo una sola llave. Dibujá dos puntos de luz, un punto de mando y la asociación entre ellos. La selección de conductores debe contemplar los recorridos y las características de cada equipo.'],
        question: '¿Cómo distinguís el retorno de la alimentación permanente al leer el esquema?',
        answers: [
          {label: 'El retorno sale del contacto de la llave hacia la luminaria', correct: true, explanation: 'Su conexión a la fase depende del estado de la llave.'},
          {label: 'El retorno es el conductor de protección de la carcasa', correct: false, explanation: 'Ese es el PE y tiene una función independiente del mando.'},
        ],
      },
      {
        title: 'Conductor de protección (PE)',
        diagram: {
          caption: 'Un PE común con derivaciones independientes',
          lanes: [
            ['Vínculo hacia el toma 1', 'Barra de protección', 'PE común', 'Derivación PE al toma 1'],
            ['Vínculo hacia el toma 2', 'Mismo PE común', 'Derivación PE al toma 2'],
            ['Si se abre solo la derivación al toma 2', 'Toma 1 conserva PE', 'Toma 2 pierde su vínculo'],
          ],
        },
        intro: 'El PE acompaña la distribución a los puntos que requieren protección y conecta sus masas al sistema de tierra. En los planos y unifilares se identifica por su función; en obra se confirma la identificación y continuidad mediante verificaciones apropiadas.',
        details: ['Las derivaciones salen del PE común. La continuidad hacia un punto no debe depender del borne desmontable de otro artefacto. Neutro y PE cumplen funciones diferentes. La estructura de la puesta a tierra y sus uniones dependen del esquema aplicable.'],
        source: aea,
        question: 'En el plano aparecen dos tomas sucesivos y el segundo quedó sin vínculo PE. ¿Qué anotás?',
        answers: [
          {label: 'Tierra confirmada porque el primer toma funciona', correct: false, explanation: 'El funcionamiento normal del toma no demuestra continuidad del PE ni protege al segundo.'},
          {label: 'Continuidad del PE pendiente de revisión', correct: true, explanation: 'La continuidad de la protección hacia los puntos aguas abajo requiere verificación específica.'},
        ],
      },
      {
        title: 'Cajas de registro por ambiente',
        intro: 'Una caja de paso permite acceder al recorrido de los conductores. Una caja de derivación aloja conexiones que distribuyen circuitos a otras salidas. Ubicalas en el plano con tapa accesible, recorrido identificable y espacio apto para el montaje y mantenimiento.',
        details: [
          'En dormitorio y estar, cruzá recorridos con luminarias, mandos y mobiliario. En circulación, una caja accesible puede facilitar el paso hacia varios ambientes. En cocina o lavadero, revisá interferencias con muebles, agua y equipos.',
          'En baño, estudiá las zonas alrededor de ducha o bañera y los requisitos del proyecto antes de ubicar cajas. En exterior, revisá exposición al agua, sol y golpes, y el grado de protección apropiado del conjunto. Las posiciones del dibujo son ejemplos de relevamiento sin escala.',
        ],
        diagram: 'plano',
        source: aea,
        question: 'Una derivación de cocina quedaría tapada de forma permanente por un mueble. ¿Qué proponés?',
        answers: [
          {label: 'Replantear el recorrido para mantener acceso', correct: true, explanation: 'La caja debe poder abrirse para inspeccionar y mantener sus conexiones.'},
          {label: 'Dejar la caja oculta porque figura en el plano', correct: false, explanation: 'Documentar dónde está ayuda a encontrarla, pero no permite acceder a ella.'},
        ],
      },
      {
        title: 'Caños para instalaciones',
        diagram: {
          caption: 'De las condiciones de montaje a la selección del caño',
          lanes: [
            ['Elegir el sistema', 'Entorno y montaje', 'Marcado y ficha del modelo', 'Uso admitido y accesorios compatibles'],
            ['Preparar el cómputo', 'Recorrido por tramo', 'Metros de caño y accesorios', 'Validación con los conductores previstos'],
          ],
        },
        intro: 'El caño y sus accesorios forman la canalización y protegen los conductores según su tipo de montaje. Hay sistemas rígidos y corrugados o flexibles. La elección empieza por las condiciones reales: embutido o a la vista, exigencia mecánica, humedad, sol y características frente al fuego.',
        details: ['Compará el marcado con la ficha y el certificado vigente del modelo exacto cuando corresponda. Revisá fabricante, referencia, uso admitido y accesorios compatibles. El color o el aspecto corrugado por sí solo no acreditan aptitud. Para el cómputo anotá metros por tramo y accesorios. El diámetro y el tendido se validan con los conductores y el proyecto.'],
        source: {label: 'OVRA · Ejemplos de productos y fichas de canalización', url: 'https://www.industriasovra.com.ar/catalogo.php'},
        question: 'Dos caños se ven iguales, pero solo uno trae modelo identificable y ficha para ese montaje. ¿Cuál podés evaluar con respaldo?',
        answers: [
          {label: 'Cualquiera que tenga el mismo color', correct: false, explanation: 'La apariencia no informa clasificación, aptitud ni certificación.'},
          {label: 'El caño con documentación del modelo', correct: true, explanation: 'Podés verificar el uso declarado y la documentación de respaldo para ese producto.'},
        ],
      },
    ],
  },
  {
    title: 'Herramientas de instalación',
    lessons: [
      {
        title: 'Pelacables',
        diagram: {
          caption: 'Cómo reconocer un pelado bien hecho',
          lanes: [
            ['Preparar un recorte desconectado', 'Tipo y sección del conductor', 'Mordaza adecuada', 'Largo de pelado del borne'],
            ['Inspección del extremo', 'Cobre intacto · Continuar'],
            ['Si hay una muesca o hilos cortados', 'Cortar y rehacer el extremo'],
          ],
        },
        toolImage: 'pelacables',
        intro: 'Retira el aislamiento del extremo de un conductor dejando el metal intacto. En un pelacables manual las mordazas tienen aberturas calibradas. En uno ajustable o automático, la regulación y el rango dependen del modelo.',
        details: ['Con un recorte suelto y sin conexión, seleccioná la mordaza para el tipo y la sección del conductor y prepará el largo que pide el borne de ejemplo. Observá el cobre a contraluz: una muesca en un conductor rígido o hilos cortados en uno flexible indican que hay que rehacer el extremo. Un mango recubierto no acredita aislación eléctrica.'],
        source: {label: 'Klein Tools · Ejemplo de rangos para conductor sólido y flexible', url: 'https://www.kleintools.com/catalog/combination-cutting-tools/wire-strippercutter-10-20-solid-12-22-awg-stranded'},
        question: 'Al pelar un recorte flexible se cortaron varios hilos. ¿Qué hacés?',
        answers: [
          {label: 'Rehacer el extremo con ajuste adecuado', correct: true, explanation: 'Conservás la sección y evitás un extremo debilitado.'},
          {label: 'Usarlo igual y apretar más el borne', correct: false, explanation: 'El apriete no recupera los hilos ni su sección.'},
        ],
      },
      {
        title: 'Destornilladores',
        diagram: {
          caption: 'La punta calza antes de aplicar el par',
          lanes: [
            ['Selección', 'Perfil del tornillo', 'Punta del perfil y tamaño correctos', 'Contacto firme, sin juego'],
            ['En un borne con par especificado', 'Herramienta de control de par', 'Ajuste indicado por el fabricante'],
          ],
        },
        toolImage: 'destornilladores',
        intro: 'Elegí el perfil y tamaño de punta que encaja en el tornillo. Plana, Phillips y Pozidriv tienen geometrías diferentes. La aislación certificada se verifica en el marcado y estado de la herramienta.',
        details: ['En un borne de práctica sin conexión, compará una punta que calza con otra que tiene juego. Una punta incorrecta resbala y puede estropear la cabeza. Para un borne real, consultá el par especificado y usá la herramienta indicada.'],
        question: 'El fabricante indica un par de apriete para el borne. ¿Qué usás?',
        answers: [
          {label: 'Cualquier punta, hasta que no gire más', correct: false, explanation: 'Podés dañar el tornillo, el borne o comprometer el contacto.'},
          {label: 'La punta adecuada y una herramienta con control de par', correct: true, explanation: 'Podés alcanzar el ajuste previsto sin excederlo.'},
        ],
      },
      {
        title: 'Alicate',
        diagram: {
          caption: 'Elegí la herramienta por la acción sobre el conductor',
          lanes: [
            ['Cortar el conductor', 'Filos de corte', 'Alicate del rango apropiado'],
            ['Quitar la cubierta', 'Mordazas de pelado', 'Pelacables'],
            ['Fijar un terminal', 'Matriz compatible con el terminal', 'Crimpadora'],
          ],
        },
        toolImage: 'alicate',
        intro: 'El alicate de corte diagonal tiene filos que se encuentran cerca de la punta. Sirve para cortar conductores compatibles con su capacidad. Una pinza universal agrega superficies para sujetar y doblar según su diseño.',
        details: ['Practicá con un recorte desconectado, con protección ocular y control del extremo que se corta. Revisá que el corte sea limpio. Para pelar y crimpar, elegí las herramientas específicas de cada tarea.'],
        question: 'Tenés que retirar aislamiento de un flexible sin cortar hilos. ¿Qué elegís?',
        answers: [
          {label: 'Pelacables del rango adecuado', correct: true, explanation: 'Sus mordazas y ajuste permiten cortar la cubierta preservando el conductor.'},
          {label: 'El filo del alicate a ojo', correct: false, explanation: 'El alicate puede cortar hilos al presionar sobre el aislamiento.'},
        ],
      },
      {
        title: 'Cinta pasacables',
        diagram: {
          caption: 'La guía avanza primero y el cable vuelve con ella',
          lanes: [
            ['Ida en un caño de práctica', 'Caja A', 'Guía por el caño', 'Caja B'],
            ['Vuelta', 'Caja B · Unión de arrastre', 'Guía y conductores por el caño', 'Caja A'],
            ['Si se traba', 'Dejar de tirar', 'Revisar curva, unión y registros'],
          ],
        },
        toolImage: 'pasacables',
        intro: 'La cinta o guía se pasa entre dos puntos accesibles de un caño. Luego tira del conjunto de conductores. Puede ser metálica, de nailon o de fibra, según el trabajo. La punta facilita el paso y la unión de arrastre.',
        details: ['En un caño de práctica vacío, observá cómo el radio de las curvas y el bulto de la unión cambian el esfuerzo. Si la guía se traba, evaluá el recorrido y los registros. Forzar el tirón puede dañar el aislamiento o la guía. Si ya hay conductores en el caño, aislá sus circuitos y verificá ausencia de tensión antes del tendido, también con una guía no metálica.'],
        source: {label: 'Klein Tools · Guía de uso para cinta pasacables', url: 'https://data.kleintools.com/sites/all/product_assets/documents/instructions/klein/Fishtape_Digital_Instructions.pdf'},
        question: 'La guía deja de avanzar en una curva del tramo de práctica. ¿Qué hacés?',
        answers: [
          {label: 'Aumentar la fuerza hasta que ceda', correct: false, explanation: 'Puede dañarse la canalización o el material que estás pasando.'},
          {label: 'Revisar recorrido y registros antes de insistir', correct: true, explanation: 'Podés localizar una curva cerrada, obstrucción o problema en la unión.'},
        ],
      },
    ],
  },
  {
    title: 'Instrumentos y mediciones',
    lessons: [
      {
        title: 'Buscapolo',
        diagram: {
          caption: 'Qué representa la indicación de un buscapolo de neón',
          lanes: [
            ['Trayecto interno simplificado', 'Punta', 'Resistencia interna', 'Neón', 'Acoplamiento al entorno en el uso previsto'],
            ['Lectura', 'Neón apagado', 'Sin indicación', 'Ausencia de tensión sin confirmar'],
          ],
        },
        intro: 'El buscapolo tradicional es un indicador unipolar, habitualmente con forma de destornillador. En el modelo típico de neón, su luz depende de una corriente muy pequeña a través del indicador y su acoplamiento con la persona y el entorno.',
        details: ['Leé la indicación como preliminar. La luz puede ser difícil de ver y el resultado depende del modelo y de las condiciones. El buscapolo carece de una medición entre dos puntos y su silencio no verifica ausencia de tensión.'],
        source: testEquipment,
        question: 'El buscapolo quedó apagado en una demostración. ¿Qué permite afirmar?',
        answers: [
          {label: 'El indicador no dio señal en esas condiciones', correct: true, explanation: 'Para determinar ausencia de tensión se aplica una verificación con un instrumento apropiado.'},
          {label: 'El conductor es seguro al tacto', correct: false, explanation: 'Una indicación unipolar negativa no alcanza para establecerlo.'},
        ],
      },
      {
        title: 'Detector de tensión',
        diagram: {
          caption: 'Qué información entrega cada detector',
          lanes: [
            ['Lápiz sin contacto', 'Campo eléctrico de CA cerca de la punta', 'Alarma de presencia probable'],
            ['Detector bipolar adecuado', 'Dos puntos de contacto', 'Indicación entre esos puntos', 'Verificación según procedimiento'],
          ],
        },
        intro: 'El detector tipo lápiz sin contacto responde al campo eléctrico de corriente alterna cerca de su punta. Un detector bipolar de contacto evalúa entre dos puntos con sus puntas. La forma del equipo y su manual te ayudan a reconocer cuál tenés.',
        details: ['El alcance de un detector sin contacto depende de la distancia, el blindaje, el rango, el equipo y el entorno. Una alarma puede venir de un conductor cercano. Si no da señal, la ausencia de tensión sigue sin confirmar. Para verificarla, el personal competente usa un detector bipolar adecuado y aplica el procedimiento de la lección de seguridad.'],
        source: {label: 'Fluke · Detector sin contacto y verificación de ausencia de tensión', url: 'https://media.fluke.com/df1b5592-64af-4431-a63d-b10600678d3b_original%20file.pdf'},
        question: 'El lápiz indica tensión cerca de dos cables juntos. ¿Qué sabés?',
        answers: [
          {label: 'Los dos cables tienen exactamente la misma tensión', correct: false, explanation: 'El lápiz indica presencia probable. No entrega una lectura de voltaje entre cables.'},
          {label: 'Detectó un campo y se necesita verificar su origen', correct: true, explanation: 'La alarma por proximidad no identifica inequívocamente qué conductor la produjo.'},
        ],
      },
      {
        title: 'Lámpara en serie',
        diagram: 'lazo-serie',
        intro: 'En un banco didáctico protegido, una lámpara limitadora puede quedar en el mismo camino de corriente que la carga bajo prueba. Ambas comparten corriente y la tensión de la fuente se reparte entre ellas. Una lámpara incandescente aporta resistencia, que cambia con la temperatura de su filamento.',
        details: ['Imaginá una fuente aislada de baja tensión de práctica. Si se abre cualquier punto del lazo, dejan de circular corriente por lámpara y carga. Si cambia la carga, puede cambiar el brillo. Usá esta comparación conceptual para reconocer el montaje: lo que se observa depende de la fuente, la lámpara y la carga. Evitá montajes improvisados sobre la red domiciliaria.'],
        question: 'En el esquema de banco, se abre la rama que contiene la carga. ¿Qué hace la lámpara que está en serie?',
        answers: [
          {label: 'Se apaga porque se abrió el mismo lazo', correct: true, explanation: 'Ambos elementos comparten un único camino de corriente.'},
          {label: 'Sigue igual porque está en un camino aparte', correct: false, explanation: 'Ese sería el comportamiento de un ramal independiente, sujeto a su alimentación.'},
        ],
      },
      {
        title: 'Amperímetro',
        diagram: 'medicion-corriente',
        intro: 'Mide corriente en amperios. Un amperímetro con puntas se inserta en serie con la rama que se quiere observar. Para medir tensión, el voltímetro se coloca entre dos puntos. El modo de corriente suele tener baja impedancia interna.',
        details: ['En un diagrama de banco identificá función AC o DC, entrada, rango y protección del instrumento antes de dibujar dónde quedaría. Colocar un multímetro en modo corriente directamente entre fase y neutro puede provocar un cortocircuito. Para instalaciones reales, aplicá el procedimiento y el instrumento apropiados con personal competente.'],
        source: instruments,
        question: 'En una simulación de baja tensión querés medir la corriente que atraviesa una carga. ¿Dónde va el amperímetro de puntas?',
        answers: [
          {label: 'Entre los dos bornes de la fuente', correct: false, explanation: 'Un amperímetro en modo corriente ofrece un camino de baja impedancia entre esos bornes.'},
          {label: 'En el mismo lazo, en serie con la carga', correct: true, explanation: 'La corriente de la rama pasa por el amperímetro.'},
        ],
      },
      {
        title: 'Pinza amperométrica',
        diagram: 'mordaza',
        intro: 'La mordaza mide a partir del campo magnético de los conductores que abraza. Para corriente de carga se mide un solo conductor. Si la mordaza abraza juntos fase y neutro de una carga equilibrada, sus efectos se compensan en gran medida.',
        details: ['Para evaluar corriente residual, una pinza con resolución adecuada para fugas puede medir el desequilibrio rodeando juntos los conductores activos del circuito. El PE queda fuera de ese conjunto. Revisá modo de medición, resolución, rango y cierre de la mordaza en el manual.'],
        source: leakage,
        question: 'En el dibujo se abrazan fase y neutro juntos y la lectura es casi cero. ¿Qué indica?',
        answers: [
          {label: 'Las corrientes supervisadas casi se compensan', correct: true, explanation: 'La lectura conjunta se relaciona con el desequilibrio dentro de la resolución del equipo.'},
          {label: 'La carga no consume corriente', correct: false, explanation: 'Puede circular corriente de carga por ambos y cancelarse sus campos en la medición.'},
        ],
      },
    ],
  },
  {
    title: 'Prácticas de conexiones',
    lessons: [
      existing['una-lampara'],
      {
        title: 'Llave de un punto y dos lámparas',
        intro: 'Una llave comanda dos lámparas en paralelo. El retorno conmutado se divide en dos ramas, una por lámpara. Cada rama vuelve al neutro. La llave queda en el camino común, de modo que al abrirla apaga las dos.',
        details: ['Seguí cada lazo por separado: fase → llave → retorno común → lámpara de esa rama → neutro. Predicción: con la llave cerrada, abrir una sola rama deja disponible el lazo de la otra. Probalo en el dibujo.'],
        diagram: 'dos-lamparas',
        question: 'Con la llave cerrada, se abre solo la rama de la lámpara 1. ¿Qué pasa?',
        answers: [
          {label: 'La lámpara 2 sigue funcionando', correct: true, explanation: 'La rama 2 conserva un lazo cerrado por la llave y el neutro.'},
          {label: 'Se apagan las dos lámparas', correct: false, explanation: 'Se apagarían las dos si se abriera la llave común o se interrumpiera la alimentación común.'},
        ],
      },
      existing.toma,
      {
        title: 'Timbre con pulsador',
        intro: 'En el modelo, una fuente aislada alimenta un timbre compatible de muy baja tensión. El pulsador normalmente abierto cierra el lazo mientras se lo presiona. Al soltarlo vuelve al estado abierto.',
        details: ['Seguí el circuito secundario del dibujo: salida de la fuente → pulsador → timbre → retorno a la fuente. La alimentación primaria queda fuera de este ejercicio. En una instalación real, el timbre, la fuente y el pulsador deben corresponder al sistema indicado por el fabricante.'],
        diagram: 'timbre',
        question: 'El timbre debe activarse solo mientras alguien presiona. ¿Qué mando representa ese comportamiento?',
        answers: [
          {label: 'Una llave que permanece cerrada tras soltarla', correct: false, explanation: 'Mantendría el lazo cerrado hasta que alguien vuelva a accionar la llave.'},
          {label: 'Un pulsador momentáneo normalmente abierto', correct: true, explanation: 'Al presionar cierra el lazo. Al soltar abre el contacto y termina la alimentación del timbre del ejemplo.'},
        ],
      },
      {
        title: 'Automático de tanque elevado',
        intro: 'En modo llenado, el flotante pide agua cuando el nivel baja y corta la bomba cuando el tanque superior llega al nivel alto. El contrapeso o el mecanismo del modelo permite establecer el recorrido del flotante entre ambos puntos.',
        details: [
          'En el esquema de mando, la alimentación de control pasa por el común del flotante y sale por el contacto que cierra en nivel bajo. Ese contacto alimenta la bobina del contactor, cuyo otro borne vuelve al retorno de mando. El contactor conmuta la potencia de la bomba en un circuito separado.',
          'En un flotante conmutado de tres conductores, el par de llenado se identifica por el diagrama del modelo y se puede comprobar por continuidad con el flotante aislado. El tercer conductor queda aislado individualmente. Hay modelos de dos conductores dedicados a llenado. Los colores y la capacidad para mandar una bomba directamente dependen del producto y de la carga inductiva.',
          'Para una instalación real se trabaja sin tensión, con la bomba protegida y el PE donde corresponda. Prevé un recorrido libre para la boya y mantené empalmes y conexiones fuera del agua conforme al montaje previsto por el fabricante.',
        ],
        diagram: 'tanque-elevado',
        source: floatSwitch,
        question: '¿Qué par usás en el circuito de mando de llenado?',
        answers: [
          {label: 'Común y contacto que cierra al bajar la boya', correct: true, explanation: 'Con nivel bajo se pide llenado. Al subir al nivel de corte, el contacto abre y la bomba se detiene.'},
          {label: 'Común y contacto que cierra al subir la boya', correct: false, explanation: 'Ese par corresponde al comportamiento de vaciado del flotante del ejemplo.'},
        ],
      },
      {
        title: 'Automático en modo cisterna',
        intro: 'En modo vaciado o achique, la bomba arranca al alcanzar el nivel alto y se detiene al bajar hasta el nivel de corte. Ese corte evita que la bomba siga funcionando cuando pierde el nivel necesario para aspirar.',
        details: [
          'En el esquema de mando, la alimentación pasa por el común y por el contacto que cierra en nivel alto. Ese contacto permite energizar la bobina del contactor. Cuando baja la boya, el contacto abre. Compará este recorrido con el modo de llenado y verificá el par en el diagrama del fabricante.',
          'Si la cisterna abastece un tanque superior, su flotante también puede actuar solo como permiso por disponibilidad de agua. En ese caso, la solicitud de marcha viene del tanque superior y el corte por nivel bajo permanece activo.',
        ],
        diagram: 'cisterna',
        source: floatSwitch,
        question: 'La bomba de achique está en marcha y el agua alcanza el límite bajo. ¿Qué debe ocurrir?',
        answers: [
          {label: 'La bomba sigue hasta vaciar por completo', correct: false, explanation: 'El nivel de corte se ajusta según el equipo y debe mantenerse el agua necesaria para su funcionamiento.'},
          {label: 'La bomba se detiene al abrirse el contacto', correct: true, explanation: 'Al nivel bajo se interrumpe el mando para evitar marcha en seco.'},
        ],
      },
      {
        title: 'Tanque y cisterna con una bomba',
        diagram: 'dos-flotantes',
        intro: 'Para elevar agua desde una cisterna, hacen falta dos condiciones a la vez: el tanque superior pide llenado y hay agua suficiente abajo. En un mando con flotantes de contacto compatibles, se ponen en serie el pedido de llenado y el permiso de la cisterna.',
        details: [
          'Leé el circuito de mando de ejemplo: alimentación → contacto de llenado del tanque → contacto de permiso de la cisterna → bobina del contactor → retorno. La bomba funciona solo cuando los dos contactos cierran. Si el tanque se llena o la cisterna alcanza su límite bajo, cualquiera de los contactos corta.',
          'Usá el circuito de mando y la tensión de bobina del proyecto. Si hay un tablero electrónico con entradas de nivel, seguí su manual para conectar cada señal. Esas entradas pueden esperar contactos secos o sondas, según el equipo.',
        ],
        source: {label: 'Motorarg · Tablero con entrada para control de nivel', url: 'https://www.motorarg.com.ar/productos/linea-new-guardian/'},
        question: 'El tanque superior pide agua y el flotante de cisterna detecta nivel insuficiente. ¿Qué hace la bomba?',
        answers: [
          {label: 'Queda parada hasta que la cisterna vuelva a dar permiso', correct: true, explanation: 'El pedido de llenado y el permiso de nivel son condiciones en serie. Basta que una esté abierta para cortar.'},
          {label: 'Arranca porque el tanque superior pide llenado', correct: false, explanation: 'El pedido por sí solo no habilita la marcha.'},
        ],
      },
      {
        title: 'Fotocélula de dos hilos',
        intro: 'Un fotocontrol para iluminación de dos hilos diseñado para funcionar sin neutro propio se intercala en serie con la fase. En el ejemplo, L entra al control, la salida conmutada va a la lámpara y la otra borna de la lámpara vuelve a N.',
        details: [
          'Identificá entrada y salida según el manual. Algunos modelos electrónicos se alimentan a través de la carga incluso en reposo. Una lámpara LED incompatible puede emitir destellos o quedar tenuemente encendida. Verificá el tipo de carga y el rango admitidos en la documentación.',
          'El sensor debe ver la luz ambiente. Si recibe la luz de la luminaria que controla, puede apagarla y volverla a encender en ciclos. Un retardo de conmutación es normal en ciertos modelos.',
        ],
        diagram: 'fotocelula-2',
        source: {label: 'Timeguard · Esquema del interruptor crepuscular de dos hilos ST210', url: 'https://www.superlecdirect.com/media/pdfs/timeguard-ST210-instructions.pdf'},
        question: '¿Dónde llega el neutro en el ejemplo de dos hilos sin neutro propio?',
        answers: [
          {label: 'A uno de los dos hilos del fotocontrol', correct: false, explanation: 'Eso corresponde a otra topología. El control del ejemplo va en serie con la fase.'},
          {label: 'Directamente a la lámpara', correct: true, explanation: 'Los dos conductores del control son la entrada de fase y su salida hacia la carga.'},
        ],
      },
      {
        title: 'Fotocélula de tres hilos',
        intro: 'En el fotocontrol de tres hilos del ejemplo, L y N alimentan al sensor. El tercer hilo es la fase conmutada hacia la lámpara. La lámpara y el sensor comparten el neutro del mismo circuito.',
        details: [
          'Identificá L o LINE, N y LOAD en el manual del equipo. Seguí tres trayectos: fase de alimentación a L, neutro del circuito a N y a la lámpara, y salida LOAD al otro borne de la lámpara. El PE de la luminaria, cuando corresponde, sigue su recorrido de protección.',
          'Si querés comandar varias luminarias, revisá la capacidad para LED y corriente de arranque. Un relé o contactor adecuado puede separar mando y potencia cuando el fabricante admite ese tipo de carga de mando.',
        ],
        diagram: 'fotocelula-3',
        source: photocontrol,
        question: '¿Qué función cumple LOAD en el esquema?',
        answers: [
          {label: 'Entrega la fase conmutada a la lámpara', correct: true, explanation: 'El sensor se alimenta por L y N, y conecta su salida al activarse.'},
          {label: 'Es el neutro de alimentación', correct: false, explanation: 'El neutro está identificado por N y también llega a la lámpara.'},
        ],
      },
      {
        title: 'Fotocélula de cuatro hilos',
        intro: 'En el fotocontrol de cuatro hilos del ejemplo, hay dos pares identificados: entrada de red L y N, y salida hacia la luminaria con fase conmutada y neutro de salida. Seguí las marcas del modelo para distinguirlos.',
        details: [
          'Leé ambos lados del esquema: L y N de entrada van al par de alimentación. La lámpara se conecta al par de salida indicado por el fabricante. En el ejemplo Kalop, el cuarto conductor es el neutro de salida. En otros equipos, cuatro hilos pueden significar alimentación y un contacto aislado, así que primero identificá la topología.',
          'Si ambos cables de un par tienen el mismo color, guiáte por la identificación del producto. Verificá el límite para el tipo de luminaria y colocá el equipo donde el sensor vea la luz ambiente.',
        ],
        diagram: 'fotocelula-4',
        source: photocontrol,
        question: 'En el modelo del dibujo, ¿dónde se conecta la lámpara?',
        answers: [
          {label: 'Entre fase y neutro de entrada', correct: false, explanation: 'Allí la lámpara quedaría alimentada aunque el sensor ordenara apagarla.'},
          {label: 'Entre fase conmutada y neutro de salida', correct: true, explanation: 'Son los dos conductores de salida hacia la carga en este tipo de fotocontrol.'},
        ],
      },
      {
        title: 'Fotocélula con zócalo NEMA',
        diagram: {
          caption: 'Tres recorridos del zócalo y la cabeza extraíble',
          lanes: [
            ['LINE', 'Fase de alimentación', 'LINE del zócalo', 'Entrada de la cabeza'],
            ['LOAD', 'Salida de la cabeza', 'LOAD del zócalo', 'Fase conmutada hacia la lámpara'],
            ['NEUTRAL', 'Neutro del mismo circuito', 'Derivaciones al zócalo y a la luminaria'],
          ],
        },
        intro: 'En un fotocontrol enchufable de tres polos, se cablea primero el zócalo compatible. Sus conexiones funcionales son línea, neutro y carga. La cabeza del fotocontrol se inserta y se traba en la base siguiendo la orientación del fabricante.',
        details: [
          'En el zócalo del ejemplo, la fase de alimentación llega a LINE. El neutro alimenta la base y vuelve desde la luminaria. LOAD entrega la fase conmutada a la lámpara. Comprobá tensión, asignación de contactos, tipo de base y montaje antes de reemplazar la cabeza.',
          'Para exterior importan la junta, la orientación y la protección contra el agua del conjunto instalado. El conductor de protección de la luminaria sigue el recorrido que corresponda al proyecto.',
        ],
        source: photocontrol,
        question: '¿Qué borne del zócalo entrega la fase que se activa al oscurecer?',
        answers: [
          {label: 'LOAD, la salida conmutada', correct: true, explanation: 'LINE alimenta al control. LOAD va a la luminaria.'},
          {label: 'LINE, la entrada de alimentación', correct: false, explanation: 'La entrada está alimentada con independencia de la orden del sensor.'},
        ],
      },
      {
        title: 'Fotocélula con sensor remoto y relé',
        diagram: {
          caption: 'Tres circuitos con funciones distintas',
          lanes: [
            ['Alimentación del módulo', 'Fuente prevista', 'Bornes de alimentación'],
            ['Detección', 'Sensor exterior', 'Bornes de sensor del módulo'],
            ['Salida de relé del ejemplo', 'Alimentación de la carga', 'Contacto seco COM → NA', 'Lámpara', 'Retorno de la carga'],
          ],
        },
        intro: 'Un relé crepuscular de tablero con sensor remoto separa la detección de luz y la conmutación. El sensor ve la luz exterior y envía su señal al módulo. El módulo controla la lámpara o el mando de un contactor.',
        details: [
          'Distinguí tres grupos en el diagrama del equipo: alimentación del módulo, bornes del sensor y salida de relé. En un modelo con contacto seco conmutado, COM y NA pueden cerrar el circuito de la carga o del mando al oscurecer, según la configuración. El contacto necesita una alimentación externa acorde al circuito que conmuta.',
          'El sensor se conecta solo a los bornes indicados para él. Verificá tipo de salida, tensión y capacidad del contacto, y cableado permitido entre sensor y módulo. Ajustá el umbral y comprobá la respuesta con el retardo previsto, evitando que el sensor reciba luz directa de la lámpara.',
        ],
        source: {label: 'Finder · Diagramas de relés crepusculares con sensor externo', url: 'https://cdn.findernet.com/app/uploads/S11EN.pdf'},
        question: '¿Qué bornes usarías para el sensor del ejemplo?',
        answers: [
          {label: 'COM y NA del contacto que gobierna la lámpara', correct: false, explanation: 'Son los bornes de salida de relé, no la entrada del sensor.'},
          {label: 'Los bornes de sensor indicados en el manual', correct: true, explanation: 'Los bornes de señal son independientes de la alimentación y del contacto de salida.'},
        ],
      },
    ],
  },
  {
    title: 'Consumo, diagnóstico y obra',
    lessons: [
      {
        title: 'Consumo domiciliario',
        diagram: {
          caption: 'De la potencia y el tiempo a la energía consumida',
          lanes: [
            ['Ejemplo a potencia constante', 'Lámpara de 100 W', '0,1 kW durante 10 h', '1 kWh consumido'],
            ['Comparar facturas', 'Energía registrada en kWh', 'Dividir por días del período', 'Comparar kWh por día'],
          ],
        },
        intro: 'La potencia expresa el ritmo al que un equipo usa energía. La factura registra energía en kWh. Si un equipo mantiene 1 kW durante 2 horas, usa 2 kWh. Para cargas que ciclan, como una heladera, importa cuánto tiempo y a qué potencia operan.',
        details: ['Compará kWh por día entre períodos con distinta cantidad de días. Antes de atribuir una suba a un equipo, registrá cambios de uso, clima y equipos incorporados. Separá el cambio de energía del cambio de tarifa. La potencia de placa por sí sola no describe el uso diario.'],
        question: 'En el ejemplo, una carga de 500 W funciona 4 horas a esa potencia. ¿Cuánta energía usa?',
        answers: [
          {label: '2 kWh', correct: true, explanation: '500 W son 0,5 kW. Al multiplicar por 4 horas resulta 2 kWh.'},
          {label: '0,5 kWh', correct: false, explanation: '0,5 kW es potencia. En cuatro horas acumula cuatro veces la energía de una hora.'},
        ],
      },
      {
        title: 'Pérdidas de energía',
        diagram: {
          caption: 'Tres fenómenos que conviene distinguir',
          lanes: [
            ['Consumo en espera', 'Equipo conectado en reposo', 'Energía registrada en kWh'],
            ['Disipación', 'Parte de la energía se transforma en calor', 'Evaluar calentamiento anormal'],
            ['Corriente de fuga', 'Camino alternativo', 'Corriente residual medida en mA'],
          ],
        },
        intro: 'La frase “pérdida de energía” puede referirse a fenómenos distintos. Un equipo en espera puede consumir kWh con normalidad. Un conductor disipa parte de la energía en forma de calor. Una corriente de fuga sigue un camino por fuera del retorno previsto. Los filtros electrónicos pueden aportar una pequeña corriente residual. El valor por sí solo no identifica una falla, y un disparo o un aumento requiere evaluar el contexto.',
        details: ['Separá las unidades: kWh indica energía de un período y mA indica corriente. Calor localizado u olor a quemado requiere atención por seguridad. Una factura en aumento aporta un dato de consumo, mientras que un disparo diferencial aporta un indicio de desequilibrio que hay que investigar.'],
        source: leakage,
        question: 'Subieron los kWh en un mes de mucho uso de calefacción. ¿Qué podés concluir con ese único dato?',
        answers: [
          {label: 'El circuito tiene una fuga confirmada', correct: false, explanation: 'El consumo registrado es insuficiente para identificar una trayectoria de fuga.'},
          {label: 'Aumentó la energía registrada en ese período', correct: true, explanation: 'Para explicar el aumento faltan datos de días, cargas y hábitos. Para diagnosticar una fuga hacen falta otras pruebas.'},
        ],
      },
      existing.diferencial,
      {
        title: 'Cómo buscar una pérdida',
        diagram: {
          caption: 'El síntoma determina qué información buscar',
          lanes: [
            ['Factura alta', 'Comparar días y kWh', 'Revisar cargas y cambios de uso'],
            ['Disparo del diferencial', 'Registrar horario, humedad y equipos', 'Revisión calificada del circuito sospechoso'],
            ['Caso del patio', '2 mA sin ramal y 11 mA con ramal', 'Priorizar el ramal o su equipo', 'Ubicación de la falla pendiente'],
          ],
        },
        intro: 'Empezá por precisar el síntoma. Ante una factura alta, compará períodos, kWh por día y cambios de uso. Ante disparos del diferencial, registrá cuándo ocurren, equipos en uso, humedad y cambios recientes. Ese registro ayuda a distinguir hipótesis antes de medir.',
        details: [
          'Caso A. Se pasó de 180 kWh en 30 días a 240 kWh en 40 días. Ambos períodos promedian 6 kWh por día. Con esos datos, la duración explica la diferencia de energía acumulada.',
          'Caso B. El diferencial dispara con lluvia y el circuito del patio está bajo sospecha. Dejalo fuera de servicio mediante intervención segura y pedí revisión. La persona competente puede identificar qué ramal aportó corriente residual y, según el caso, comprobar aislamiento con el circuito aislado y con los equipos sensibles protegidos conforme al procedimiento.',
          'Lecturas ficticias de una visita: se registraron 2 mA de corriente residual con el ramal de patio aislado y 11 mA en otra medición comparable con ese ramal incluido. La diferencia orienta la revisión hacia ese ramal o sus equipos. Por sí sola no ubica el punto de falla ni permite decidir si el circuito es seguro.',
          'En la orden de trabajo dejá registrados el síntoma, los circuitos y equipos implicados, las condiciones observadas y qué se verificó. Cuando haya mediciones, guardá unidad, instrumento y condiciones. Evitá rearmar repetidamente o puentear la protección para continuar el uso.',
        ],
        source: leakage,
        question: 'El diferencial dispara cuando llueve. ¿Qué registro orienta mejor la revisión?',
        answers: [
          {label: 'Solo el total mensual de la factura', correct: false, explanation: 'Ese total no identifica cuándo ni dónde aparece un desequilibrio.'},
          {label: 'Circuito, hora, humedad y cargas conectadas', correct: true, explanation: 'Permite investigar condiciones reproducibles y elegir ensayos que separen ramal y equipos.'},
        ],
      },
      {
        title: 'Caso integrador de obra',
        diagram: {
          caption: 'Del pedido de la clienta al presupuesto',
          lanes: [
            ['Relevamiento', 'Pedido y síntomas', 'Plano y cuadro de circuitos', 'Observaciones y diagnóstico pendiente'],
            ['Presupuesto', 'Alcance verificado', 'Materiales y mano de obra', 'Presupuesto con revisión identificada'],
          ],
        },
        intro: 'En una vivienda ficticia, la clienta quiere dos luminarias bajo un solo mando en el estar, un timbre y revisar un disparo que coincide con lluvia. La primera visita combina relevamiento y diagnóstico. Separá lo observado de lo que se verificará antes de presupuestar.',
        details: [
          'En Clientes, registrá a quien solicita el trabajo. En Obras, asociá el cliente, describí el pedido y adjuntá el relevamiento en Planos. Marcá puntos, registros accesibles, circuito sospechoso y recorridos. En el unifilar, identificá el tablero y los circuitos involucrados.',
          'En Materiales anotá referencias y unidades: cajas y accesorios por pieza, caño por metro y el conjunto timbre, fuente y pulsador compatibles. Contrastá cantidades con el replanteo. En el presupuesto distinguí mano de obra, materiales y alcance de la revisión. La práctica usa datos ficticios y la navegación de EmonPlan permite aplicar el mismo recorrido en tus obras.',
        ],
        question: 'Aún no revisaste el exterior. ¿Cómo registrás el problema al preparar el presupuesto?',
        answers: [
          {label: 'Disparo con lluvia, diagnóstico de circuito pendiente', correct: true, explanation: 'Documentás el síntoma confirmado y podés presupuestar la revisión sin dar por confirmada la causa.'},
          {label: 'Fuga localizada y cambio de cable confirmado', correct: false, explanation: 'La coincidencia con la lluvia orienta, pero no demuestra qué pieza o tramo falló.'},
        ],
      },
    ],
  },
];
