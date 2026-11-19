export const lessons = [
  {
    title: 'Fase, neutro y tierra',
    intro: 'En el circuito monofásico del ejemplo, la carga recibe tensión entre fase y neutro. El conductor de protección conecta la carcasa metálica al sistema de puesta a tierra para contribuir a la protección en caso de falla.',
    components: [
      { name: 'Fase (L)', description: 'Es uno de los dos conductores activos del circuito del ejemplo. La tensión de alimentación de la carga se establece entre L y N.' },
      { name: 'Neutro (N)', description: 'Completa con la fase el camino normal de la corriente de la carga. Puede estar a un potencial peligroso, por ejemplo ante una falla.' },
      { name: 'Tierra de protección (PE)', description: 'Vincula la parte metálica accesible de esta carga con el sistema de protección. No conduce la corriente normal de la carga.' },
      { name: 'Carga', description: 'Es el elemento que transforma energía eléctrica, por ejemplo en luz o calor. En este esquema ideal se alimenta entre L y N.' },
    ],
    question: '¿Qué dos conductores forman el camino normal de la corriente de carga en este esquema?',
    answers: [
      { label: 'Fase y neutro', explanation: 'La corriente de carga circula por el lazo que forman la fuente, la fase, la carga y el neutro.', correct: true },
      { label: 'Fase y tierra de protección', explanation: 'La tierra de protección cumple una función de seguridad. En el camino normal de la carga interviene el neutro.', correct: false },
    ],
  },
  {
    title: 'Tensión y corriente',
    intro: 'La tensión es una diferencia de potencial entre dos puntos y se expresa en voltios (V). La corriente mide cuánto flujo de carga atraviesa una sección del circuito por unidad de tiempo y se expresa en amperios (A). En corriente alterna el sentido de la corriente cambia periódicamente.',
    components: [
      { name: 'Fuente de CA', description: 'Establece una tensión que varía periódicamente entre sus dos bornes. Puede haber tensión en la fuente aunque el circuito esté abierto.' },
      { name: 'Interruptor abierto', description: 'Interrumpe el camino de la corriente por la rama. Puede haber tensión entre sus dos contactos.' },
      { name: 'Carga', description: 'En este circuito ideal solo circula corriente por la carga cuando se cierra el lazo.' },
    ],
    question: '¿Puede haber tensión entre los contactos abiertos aunque no circule corriente por la rama ideal?',
    answers: [
      { label: 'No, al abrir el circuito desaparece toda tensión', explanation: 'Al abrir se interrumpe la corriente. La fuente sigue estableciendo una diferencia de potencial entre dos puntos del circuito.', correct: false },
      { label: 'Sí, puede haber tensión entre los contactos', explanation: 'En el circuito ideal, la abertura impide la corriente por la rama, aunque la fuente mantiene una diferencia de potencial entre los contactos.', correct: true },
    ],
  },
  {
    title: 'Protecciones',
    intro: 'En un tablero se pueden cumplir dos funciones distintas. La protección contra sobrecorriente responde a sobrecargas y cortocircuitos. La protección diferencial responde al desequilibrio de corriente entre los conductores activos que supervisa.',
    components: [
      { name: 'Interruptor termomagnético', description: 'Su parte térmica responde a sobrecargas sostenidas. Su parte magnética actúa rápidamente ante sobrecorrientes elevadas, como las de un cortocircuito.' },
      { name: 'Interruptor diferencial', description: 'El diferencial puro (RCCB) detecta corriente residual. La protección contra sobrecarga y cortocircuito requiere una función aparte.' },
      { name: 'Protección combinada', description: 'Un interruptor combinado (RCBO) integra la protección diferencial y la protección contra sobrecorriente en el mismo dispositivo.' },
    ],
    question: 'Ante una sobrecarga sin desequilibrio de corriente, ¿qué función está diseñada para intervenir?',
    answers: [
      { label: 'La protección diferencial', explanation: 'Si la corriente que circula por los conductores activos supervisados permanece equilibrada, la sobrecarga por sí sola no activa la función diferencial.', correct: false },
      { label: 'La protección contra sobrecorriente', explanation: 'La atiende la parte térmica de un termomagnético o la función de sobrecorriente de un RCBO.', correct: true },
    ],
  },
  {
    title: 'Iluminación',
    intro: 'El esquema representa el mando de una luminaria desde un solo punto. La llave y la luminaria están en el mismo lazo. El estado de la llave determina si ese lazo queda abierto o cerrado.',
    components: [
      { name: 'Interruptor', description: 'Abre o cierra el lazo de la luminaria. El esquema muestra su función de mando.' },
      { name: 'Lámpara', description: 'Es la carga del circuito. En el modelo ideal se enciende cuando el lazo está cerrado y se apaga cuando se interrumpe la corriente.' },
      { name: 'Retorno', description: 'Es el tramo de fase conmutada entre la llave y la luminaria. Su estado depende de la llave en el circuito del ejemplo.' },
    ],
    question: '¿Qué pasa en el modelo al abrir la llave?',
    answers: [
      { label: 'Se interrumpe la corriente de la luminaria', explanation: 'La llave abre el lazo y la luminaria se apaga. Que esté apagada no verifica la ausencia de tensión.', correct: true },
      { label: 'Se corta la alimentación de toda la vivienda', explanation: 'La llave controla la rama de la luminaria del ejemplo. Las demás ramas quedan fuera de su mando.', correct: false },
    ],
  },
  {
    title: 'Tomacorrientes',
    intro: 'En el ejemplo, dos tomacorrientes alimentan cargas en paralelo. Cada carga se conecta entre los mismos dos puntos de alimentación y tiene su propia rama. Mientras la alimentación común siga disponible, abrir una rama no abre la otra.',
    components: [
      { name: 'Tomacorriente 1', description: 'La primera carga tiene su propio camino entre fase y neutro. Al desenchufarla se abre su rama.' },
      { name: 'Tomacorriente 2', description: 'La segunda carga está en otra rama entre los mismos puntos. Puede seguir funcionando cuando la primera se desenchufa.' },
      { name: 'Tierra de protección (PE)', description: 'El contacto de protección conecta con el conductor PE. Su función se distingue de la alimentación entre fase y neutro.' },
    ],
    question: 'Si se desenchufa la carga del primer tomacorriente, ¿qué pasa con la del segundo?',
    answers: [
      { label: 'Se apaga porque se abrió la primera rama', explanation: 'Eso ocurriría si ambas cargas dependieran del mismo camino en serie. En este caso están en ramas en paralelo.', correct: false },
      { label: 'Puede seguir funcionando', explanation: 'La segunda rama mantiene su propio lazo mientras siga disponible la alimentación común.', correct: true },
    ],
  },
  {
    title: 'Disparo del diferencial',
    intro: 'En el caso ficticio, una falla de aislamiento genera una fuga por un camino externo a los conductores vigilados. Compará la condición normal con la falla para entender qué detecta el diferencial.',
    components: [
      { name: 'Fase y neutro', description: 'En el modelo normal, las corrientes de fase y neutro se compensan al atravesar el sensor en sentidos opuestos.' },
      { name: 'Sensor diferencial', description: 'Detecta la suma de las corrientes de los conductores activos que lo atraviesan. En el ejemplo, un desequilibrio suficiente hace que el dispositivo abra el circuito.' },
      { name: 'Fuga', description: 'Parte de la corriente circula por un camino alternativo fuera del sensor. El disparo permite reconocer el desequilibrio, pero por sí solo no localiza la causa.' },
    ],
    question: '¿Qué detecta el diferencial en el caso de la fuga?',
    answers: [
      { label: 'Un desequilibrio de corriente entre fase y neutro', explanation: 'Parte de la corriente sigue un camino que queda fuera del sensor. Las corrientes supervisadas dejan de compensarse.', correct: true },
      { label: 'Cuánta corriente consume en total la carga', explanation: 'La corriente de consumo puede estar equilibrada entre fase y neutro. El sensor diferencial responde a la corriente residual.', correct: false },
    ],
  },
];
