import type {ReactNode} from 'react';
import type {Diagram} from './lessonContent';

const lightStates = [
  {label: 'Día', description: 'Hay suficiente luz ambiente. En el modelo, la salida conmutada está abierta y la lámpara está apagada.'},
  {label: 'Noche', description: 'La luz ambiente cae por debajo del umbral. Tras el retardo previsto, la salida cierra y la lámpara se enciende.'},
];

export const diagramCaptions: Record<Diagram, string> = {
  conductores: 'La fase y el neutro llegan a los bornes de la carga. El PE termina en la carcasa metálica, en un borne independiente.',
  tension: 'El interruptor abierto interrumpe la corriente por la carga. La fuente puede mantener una tensión entre los contactos.',
  tablero: 'Comparación de funciones: la térmica responde a sobrecorriente, el diferencial puro a corriente residual y el RCBO reúne ambas.',
  'una-lampara': 'L pasa por la llave y el retorno hacia la lámpara. N completa el lazo. El dibujo muestra el circuito de mando de la luz.',
  toma: 'Dos tomacorrientes con sus cargas enchufadas forman ramas independientes entre L y N. Cada toma conserva su vínculo al PE común.',
  diferencial: 'El sensor rodea fase y neutro. La falla hipotética muestra, antes del disparo, un camino de retorno por fuera del sensor.',
  'dos-lamparas': 'La llave está antes de la bifurcación en paralelo. Si solo se abre una rama, la otra conserva su propio lazo.',
  timbre: 'Circuito secundario de muy baja tensión: fuente aislada, pulsador normalmente abierto y timbre en serie.',
  tierra: 'Ejemplo con electrodo local: carcasa, PE, borne principal y electrodo. La trayectoria de falla depende del esquema de tierra.',
  plano: 'Croquis sin escala. Los cuadrados marcan registros y la línea punteada conecta dormitorio, estar, cocina y exterior. El baño queda para verificar según el proyecto.',
  'tanque-elevado': 'Mando de llenado: común y contacto que cierra a nivel bajo controlan la bobina del contactor. La potencia de la bomba queda fuera del dibujo.',
  cisterna: 'Mando de vaciado: común y contacto que cierra a nivel alto controlan la bobina del contactor. La potencia de la bomba queda fuera del dibujo.',
  'fotocelula-2': 'L atraviesa el control hacia la lámpara, que vuelve a N. El contacto es una representación lógica. Apagado no equivale a aislamiento.',
  'fotocelula-3': 'L alimenta el control y la salida conmutada llega a la lámpara. N se deriva a ambos. Apagado no equivale a aislamiento.',
  'fotocelula-4': 'El par de entrada es L y N. El par de salida alimenta la lámpara. Se muestran bornes y recorridos externos del ejemplo.',
  'lazo-serie': 'Banco didáctico con fuente aislada, lámpara limitadora y carga en el mismo lazo. La apertura de un contacto interrumpe el camino común.',
  'medicion-corriente': 'Banco didáctico: el amperímetro A va en serie con la carga. La corriente de esa rama atraviesa ambos elementos.',
  'dos-flotantes': 'Los contactos de llenado y permiso de cisterna están en serie con la bobina K1. La potencia de la bomba queda fuera del dibujo.',
  mordaza: 'La mordaza rodea L para leer corriente de carga, o L y N juntos para medir el desequilibrio. PE queda siempre fuera de esta medición.',
};

export const states: Partial<Record<Diagram, {label: string; description: string}[]>> = {
  'una-lampara': [
    {label: 'Abierto', description: 'El contacto está abierto. En el modelo no circula corriente por la lámpara.'},
    {label: 'Cerrado', description: 'El contacto completa el lazo. Con alimentación, circula corriente por la lámpara.'},
  ],
  diferencial: [
    {label: 'Normal', description: 'Las corrientes de fase y neutro se compensan en el sensor.'},
    {label: 'Fuga hipotética', description: 'Antes del disparo, parte de la corriente vuelve por un camino externo al sensor. El desequilibrio provoca el disparo si alcanza el umbral del dispositivo.'},
  ],
  'dos-lamparas': [
    {label: 'Llave cerrada', description: 'Las dos lámparas están encendidas. Cada rama tiene un camino completo.'},
    {label: 'Llave abierta', description: 'Las dos lámparas se apagan. El contacto común interrumpe las dos ramas.'},
    {label: 'Falla en lámpara 1', description: 'La llave sigue cerrada. La lámpara 2 sigue encendida porque su rama conserva un camino completo.'},
  ],
  timbre: [
    {label: 'Suelto', description: 'El pulsador está abierto y el timbre está en silencio.'},
    {label: 'Presionado', description: 'El pulsador cierra el circuito secundario y el timbre suena en el modelo.'},
  ],
  'tanque-elevado': [
    {label: 'Nivel bajo', description: 'El contacto de llenado cierra. La bomba arranca para llenar el tanque.'},
    {label: 'Nivel alto', description: 'El contacto de llenado abre. La bomba se detiene al alcanzar el nivel alto.'},
  ],
  cisterna: [
    {label: 'Nivel bajo', description: 'El contacto de vaciado abre. La bomba se detiene al alcanzar el nivel bajo.'},
    {label: 'Nivel alto', description: 'El contacto de vaciado cierra. La bomba arranca para sacar agua de la cisterna.'},
  ],
  'lazo-serie': [
    {label: 'Lazo cerrado', description: 'Hay un camino completo. La lámpara limitadora y la carga comparten la misma corriente.'},
    {label: 'Lazo abierto', description: 'El contacto abrió el camino común. En el modelo no circula corriente por la lámpara ni por la carga.'},
  ],
  'dos-flotantes': [
    {label: 'Ambos permisos', description: 'El tanque pide agua y la cisterna permite bombear. Los dos contactos cierran y la bomba arranca.'},
    {label: 'Tanque lleno', description: 'El tanque deja de pedir agua. Abre el primer contacto y la bomba se detiene.'},
    {label: 'Cisterna baja', description: 'La cisterna retira el permiso. Abre el segundo contacto y la bomba se detiene aunque el tanque pida agua.'},
    {label: 'Tanque lleno y cisterna baja', description: 'Los dos contactos están abiertos y la bomba permanece detenida.'},
  ],
  mordaza: [
    {label: 'Corriente de carga', description: 'La mordaza rodea solo L. La pinza lee la corriente de ese conductor.'},
    {label: 'Corriente residual', description: 'La mordaza rodea L y N juntos, con PE afuera. La pinza adecuada para fugas lee el desequilibrio entre las corrientes opuestas.'},
  ],
  'fotocelula-2': lightStates,
  'fotocelula-3': lightStates,
  'fotocelula-4': lightStates,
  tierra: [
    {label: 'PE continuo', description: 'El vínculo de protección entre la carcasa y el electrodo aparece continuo en el modelo.'},
    {label: 'PE interrumpido', description: 'El recorrido de protección queda abierto. La carga aún puede funcionar entre fase y neutro.'},
  ],
};

export function LessonDiagram({diagram, title, selected, frame}: {
  diagram: Diagram;
  title: string;
  selected: number | null;
  frame: number;
}) {
  function part(id: number, shape: ReactNode) {
    return <g className={selected === id ? 'lesson-part-selected' : undefined}>{shape}</g>;
  }
  const alternate = frame === 1;
  const pumping = diagram === 'cisterna' ? alternate : !alternate;
  const levelControl = <>
    <text x="15" y="41">Mando</text>
    <path d="M18 66H99M161 66H252M374 66H385V143H18"/>
    <circle cx="103" cy="66" r="4"/><circle cx="157" cy="66" r="4"/>
    <path d={pumping ? 'M107 66H153' : 'M107 64l35-22'}/>
    <text x="79" y="97">Contacto de nivel</text>
    <rect x="252" y="47" width="122" height="38" rx="5"/>
    <text x="260" y="71">Bobina K1</text>
    <text x="16" y="168">Retorno</text>
    <text x="120" y="183">Bomba {pumping ? 'en marcha' : 'detenida'}</text>
  </>;
  const photoControl = <>
    <text x="16" y="45">L</text><text x="16" y="157">N</text>
    <rect x="57" y="18" width="194" height={diagram === 'fotocelula-4' ? 156 : 97} rx="5"/>
    <text x="75" y="103">Fotocontrol</text>
    <path d="M32 65H92M159 65H333V91"/>
    <circle cx="96" cy="65" r="4"/><circle cx="155" cy="65" r="4"/>
    <path d={alternate ? 'M100 65H151' : 'M100 63l39-18'}/>
    <text x="260" y="55">Salida L</text>
    <circle cx="333" cy="111" r="20"/><path d="m321 99 24 24m0-24-24 24m12 8v21"/>
    {diagram === 'fotocelula-4' ? <>
      <path d="M32 152H57m194 0h82"/>
      <text x="66" y="157">N entrada</text><text x="178" y="157">N salida</text>
    </> : <>
      <path d="M32 152H333"/>
      {diagram === 'fotocelula-3' && <><path d="M171 152v-37"/><circle cx="171" cy="152" r="3"/><text x="181" y="136">N común</text></>}
    </>}
    <text x="238" y="192">Lámpara {alternate ? 'encendida' : 'apagada'}</text>
  </>;
  const measuringCurrent = diagram === 'medicion-corriente';
  const benchCircuit = <>
    <rect x="18" y="68" width="94" height="60" rx="5"/>
    <text x="39" y="94">Fuente</text><text x="33" y="116">aislada</text>
    <path d="M64 68V40H167m42 0h122v36M331 116v40H244m-80 0H64v-28"/>
    <circle cx="188" cy="40" r="21"/>
    {measuringCurrent
      ? <text x="182" y="46">A</text>
      : <path d="m176 28 24 24m0-24-24 24"/>}
    <text x="136" y="83">{measuringCurrent ? 'Amperímetro' : 'Limitadora'}</text>
    <rect x="292" y="76" width="78" height="40" rx="5"/>
    <text x="308" y="101">Carga</text>
    {measuringCurrent ? <path d="M164 156h80"/> : <>
      <path d="M164 156h13m50 0h17"/>
      <circle cx="181" cy="156" r="4"/><circle cx="223" cy="156" r="4"/>
      <path d={alternate ? 'M185 154l26-15' : 'M185 156h34'}/>
      <text x="173" y="171">{alternate ? 'Abierto' : 'Cerrado'}</text>
    </>}
  </>;
  const diagrams: Record<Diagram, ReactNode> = {
    conductores: <>
      {part(0, <><text x="18" y="42">L</text><path d="M55 37H285V64"/></>)}
      {part(1, <><text x="18" y="125">N</text><path d="M55 120H285V104"/></>)}
      {part(2, <><text x="14" y="165">PE</text><path d="M55 160H360V112" strokeDasharray="5 4"/>
        <path d="M230 53H360V112H230Z"/><circle cx="360" cy="112" r="4"/><text x="248" y="146">Carcasa</text></>)}
      {part(3, <><rect x="240" y="64" width="102" height="40" rx="5"/><text x="259" y="90">Carga</text></>)}
    </>,
    tension: <>
      {part(0, <><path d="M52 78V42H143M52 122V143H300V118"/><circle cx="52" cy="100" r="22"/><text x="42" y="106">~</text><text x="12" y="173">Fuente CA</text></>)}
      {part(1, <><circle cx="148" cy="42" r="4"/><circle cx="204" cy="42" r="4"/><path d="M152 40l43-21"/><text x="150" y="72">Tensión entre contactos</text></>)}
      {part(2, <><path d="M208 42H300V88"/><rect x="260" y="88" width="80" height="30" rx="4"/><text x="276" y="109">Carga</text></>)}
    </>,
    tablero: <>
      {part(0, <><rect x="12" y="27" width="170" height="53" rx="6"/><text x="27" y="59">Termomagnético</text><path d="M97 80V113"/><text x="30" y="139">Sobrecorriente</text></>)}
      {part(1, <><rect x="218" y="27" width="170" height="53" rx="6"/><text x="255" y="59">Diferencial</text><path d="M303 80V113"/><text x="235" y="139">Corriente residual</text></>)}
      {part(2, <><path d="M97 151V160H303V151M200 160V169"/><text x="129" y="193">RCBO · ambas</text></>)}
    </>,
    'una-lampara': <>
      <g className={alternate ? 'lesson-current' : undefined}>
        <text x="18" y="52">L</text><text x="18" y="150">N</text>
        <path d="M43 47H121M43 145H303V115"/>
        {part(0, <><circle cx="126" cy="47" r="4"/><circle cx="184" cy="47" r="4"/><path d={alternate ? 'M130 47H180' : 'M130 45l44-24'}/><text x="108" y="83">Interruptor</text></>)}
        {part(2, <><path d="M188 47H303V75"/><text x="220" y="34">Retorno</text></>)}
        {part(1, <><circle cx="303" cy="95" r="20"/><path d="m291 83 24 24m0-24-24 24"/><text x="263" y="173">Lámpara</text></>)}
      </g>
    </>,
    toma: <>
      <text x="16" y="37">L</text><text x="16" y="126">N</text>
      <path d="M50 32H326M50 121H326"/>
      {part(0, <><path d="M144 32V60M144 91v30"/><rect x="76" y="60" width="136" height="31" rx="5"/><text x="88" y="81">Toma 1 + carga</text><circle cx="144" cy="32" r="3"/><circle cx="144" cy="121" r="3"/></>)}
      {part(1, <><path d="M326 32V60M326 91v30"/><rect x="248" y="60" width="136" height="31" rx="5"/><text x="258" y="81">Toma 2 + carga</text></>)}
      {part(2, <><text x="12" y="169">PE</text><path d="M50 164H365V91M197 164V91" strokeDasharray="5 4"/></>)}
    </>,
    diferencial: <>
      {part(0, <><text x="17" y="53">L</text><text x="17" y="122">N</text><path d="M45 48H325V65M45 117H325V103"/><rect x="282" y="65" width="86" height="38" rx="5"/><text x="299" y="90">Carga</text></>)}
      {part(1, <><ellipse cx="147" cy="82" rx="23" ry="62"/><text x="114" y="184">Sensor</text></>)}
      {part(2, alternate
        ? <g className="lesson-fault"><path d="M368 84h16v77H55m12-7-12 7 12 7" strokeDasharray="6 4"/><text x="205" y="152">Vía externa al sensor</text></g>
        : <text x="205" y="156">Corrientes equilibradas</text>)}
    </>,
    'dos-lamparas': <>
      <text x="17" y="36">L</text><text x="17" y="180">N</text>
      <path d="M39 31H98M39 175H332"/>
      <circle cx="102" cy="31" r="4"/><circle cx="153" cy="31" r="4"/>
      <path d={alternate ? 'M106 29l37-19' : 'M106 31H149'}/>
      <path d="M157 31H332M223 31V72M332 31V72M332 112V175"/>
      <circle cx="223" cy="92" r="20"/><circle cx="332" cy="92" r="20"/>
      <path d="m211 80 24 24m0-24-24 24m109-24 24 24m0-24-24 24"/>
      <path d={frame === 2 ? 'M223 112V122m0 24V175m0-24 15-13' : 'M223 112V175'}/>
      <circle cx="223" cy="31" r="3"/><circle cx="223" cy="175" r="3"/>
      <text x="167" y="196">L1 {frame === 0 ? 'encendida' : 'apagada'}</text>
      <text x="279" y="196">L2 {alternate ? 'apagada' : 'encendida'}</text>
    </>,
    timbre: <>
      <rect x="16" y="62" width="102" height="72" rx="5"/>
      <text x="36" y="92">Fuente</text><text x="31" y="115">aislada</text>
      <path d="M68 62V36H174M68 134V166H328V121"/>
      <circle cx="178" cy="36" r="4"/><circle cx="228" cy="36" r="4"/>
      <path d={alternate ? 'M182 36H224' : 'M182 34l36-21'}/>
      <path d="M232 36H328V79"/>
      <text x="161" y="67">Pulsador</text>
      <rect x="285" y="79" width="86" height="42" rx="6"/>
      <text x="302" y="105">Timbre</text>
      <text x="138" y="155">{alternate ? 'Activo' : 'En silencio'}</text>
    </>,
    tierra: <>
      <rect x="24" y="22" width="150" height="47" rx="5"/>
      <text x="45" y="51">Carcasa metálica</text>
      <path d={alternate ? 'M100 69V100H144m44 0h92v23M145 100l25-16' : 'M100 69V100H280V123'}/>
      <text x="105" y="93">PE</text>
      <rect x="210" y="123" width="144" height="39" rx="5"/>
      <text x="223" y="148">Borne principal</text>
      <path d="M280 162V183m-19 0h38m-31 6h24m-17 6h10"/>
      <text x="192" y="189">Electrodo</text>
    </>,
    'tanque-elevado': levelControl,
    cisterna: levelControl,
    'fotocelula-2': photoControl,
    'fotocelula-3': photoControl,
    'fotocelula-4': photoControl,
    'lazo-serie': benchCircuit,
    'medicion-corriente': benchCircuit,
    'dos-flotantes': <>
      <text x="19" y="26">Alimentación de mando</text>
      <path d="M19 70H74M124 70h65m50 0h56m86 0v82H19"/>
      <circle cx="78" cy="70" r="4"/><circle cx="120" cy="70" r="4"/>
      <circle cx="193" cy="70" r="4"/><circle cx="235" cy="70" r="4"/>
      <path d={frame === 0 || frame === 2 ? 'M82 70h34' : 'M82 68l25-17'}/>
      <path d={frame < 2 ? 'M197 70h34' : 'M197 68l25-17'}/>
      <text x="50" y="102">Tanque</text><text x="48" y="122">Llenado</text>
      <text x="168" y="102">Cisterna</text><text x="167" y="122">Permiso</text>
      <rect x="295" y="50" width="86" height="40" rx="5"/>
      <text x="299" y="75">Bobina K1</text>
      <text x="19" y="179">Retorno</text>
      <text x="174" y="182">Bomba {frame === 0 ? 'en marcha' : 'detenida'}</text>
    </>,
    mordaza: <>
      <ellipse cx="190" cy={alternate ? 75 : 49} rx="43" ry={alternate ? 48 : 23} strokeWidth="4"/>
      <text x="238" y={alternate ? 81 : 55}>Mordaza</text>
      <text x="21" y="54">L</text><text x="21" y="105">N</text><text x="15" y="155">PE</text>
      <path d="M45 49H365m-8-7 8 7-8 7M45 100H365m-312-7-8 7 8 7"/>
      <path d="M45 150H365" strokeDasharray="5 4"/>
      <text x="91" y="185">{alternate ? 'L + N · Corriente residual' : 'Solo L · Corriente de carga'}</text>
    </>,
    plano: <>
      <path d="M14 13H386V188H14ZM14 84H386M14 117H386M143 13V84M262 13V84M194 117V188"/>
      <text x="27" y="44">Dormitorio</text><text x="162" y="44">Estar</text><text x="279" y="44">Cocina</text>
      <text x="130" y="106">Pasillo</text>
      <text x="30" y="151">Baño</text><text x="211" y="151">Exterior</text>
      <path d="M112 66v34h250V66m-154 0v34m33 0v69" strokeDasharray="4 4"/>
      <rect x="106" y="60" width="12" height="12"/><rect x="202" y="60" width="12" height="12"/>
      <rect x="356" y="60" width="12" height="12"/><rect x="235" y="163" width="12" height="12"/>
      <rect x="106" y="94" width="12" height="12"/>
    </>,
  };

  return (
    <svg className="lesson-diagram" viewBox="0 0 400 202" role="img" aria-label={title}
      aria-description={states[diagram]?.[frame].description}>
      {diagrams[diagram]}
    </svg>
  );
}
