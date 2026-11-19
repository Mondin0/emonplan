import type {ReactNode} from 'react';

export const states: Record<number, {label: string; description: string}[]> = {
  3: [
    {label: 'Abierto', description: 'El contacto está abierto. En el modelo no circula corriente por la lámpara.'},
    {label: 'Cerrado', description: 'El contacto completa el lazo. Con alimentación, circula corriente por la lámpara.'},
  ],
  5: [
    {label: 'Normal', description: 'Las corrientes de fase y neutro se compensan en el sensor.'},
    {label: 'Fuga hipotética', description: 'Antes del disparo, parte de la corriente vuelve por un camino externo al sensor. El desequilibrio provoca el disparo si alcanza el umbral del dispositivo.'},
  ],
};

export function LessonDiagram({index, title, selected, alternate}: {
  index: number;
  title: string;
  selected: number | null;
  alternate: boolean;
}) {
  function part(id: number, shape: ReactNode) {
    return <g className={selected === id ? 'lesson-part-selected' : undefined}>{shape}</g>;
  }
  const diagrams = [
    <>
      {part(0, <><text x="18" y="42">L</text><path d="M55 37H285V64"/></>)}
      {part(1, <><text x="18" y="125">N</text><path d="M55 120H285V104"/></>)}
      {part(2, <><text x="14" y="165">PE</text><path d="M55 160H350V112H230" strokeDasharray="5 4"/><text x="242" y="151">Carcasa</text></>)}
      {part(3, <><rect x="240" y="64" width="102" height="40" rx="5"/><text x="259" y="90">Carga</text></>)}
    </>,
    <>
      {part(0, <><path d="M52 78V42H143M52 122V143H300V118"/><circle cx="52" cy="100" r="22"/><text x="42" y="106">~</text><text x="12" y="173">Fuente CA</text></>)}
      {part(1, <><circle cx="148" cy="42" r="4"/><circle cx="204" cy="42" r="4"/><path d="M152 40l43-21"/><text x="150" y="72">Tensión entre contactos</text></>)}
      {part(2, <><path d="M208 42H300V88"/><rect x="260" y="88" width="80" height="30" rx="4"/><text x="276" y="109">Carga</text></>)}
    </>,
    <>
      {part(0, <><rect x="12" y="27" width="170" height="53" rx="6"/><text x="27" y="59">Termomagnético</text><path d="M97 80V113"/><text x="30" y="139">Sobrecorriente</text></>)}
      {part(1, <><rect x="218" y="27" width="170" height="53" rx="6"/><text x="255" y="59">Diferencial</text><path d="M303 80V113"/><text x="235" y="139">Corriente residual</text></>)}
      {part(2, <><path d="M97 151V160H303V151M200 160V169"/><text x="129" y="193">RCBO · ambas</text></>)}
    </>,
    <>
      <g className={alternate ? 'lesson-current' : undefined}>
        <text x="18" y="52">L</text><text x="18" y="150">N</text>
        <path d="M43 47H121M43 145H303V115"/>
        {part(0, <><circle cx="126" cy="47" r="4"/><circle cx="184" cy="47" r="4"/><path d={alternate ? 'M130 47H180' : 'M130 45l44-24'}/><text x="108" y="83">Interruptor</text></>)}
        {part(2, <><path d="M188 47H303V75"/><text x="220" y="34">Retorno</text></>)}
        {part(1, <><circle cx="303" cy="95" r="20"/><path d="m291 83 24 24m0-24-24 24"/><text x="263" y="173">Lámpara</text></>)}
      </g>
    </>,
    <>
      <text x="16" y="37">L</text><text x="16" y="126">N</text>
      <path d="M50 32H326M50 121H326"/>
      {part(0, <><path d="M144 32V60M144 91v30"/><rect x="99" y="60" width="90" height="31" rx="5"/><text x="116" y="81">Toma 1</text><circle cx="144" cy="32" r="3"/><circle cx="144" cy="121" r="3"/></>)}
      {part(1, <><path d="M326 32V60M326 91v30"/><rect x="281" y="60" width="90" height="31" rx="5"/><text x="298" y="81">Toma 2</text></>)}
      {part(2, <><text x="12" y="169">PE</text><path d="M50 164H365V93M197 164V98l-10-7" strokeDasharray="5 4"/></>)}
    </>,
    <>
      {part(0, <><text x="17" y="53">L</text><text x="17" y="122">N</text><path d="M45 48H325V65M45 117H325V103"/><rect x="282" y="65" width="86" height="38" rx="5"/><text x="299" y="90">Carga</text></>)}
      {part(1, <><ellipse cx="147" cy="82" rx="23" ry="62"/><text x="114" y="171">Sensor</text></>)}
      {part(2, alternate
        ? <g className="lesson-fault"><path d="M368 84h16v77H218" strokeDasharray="6 4"/><text x="228" y="153">Corriente de fuga</text></g>
        : <text x="242" y="156">Sin fuga</text>)}
    </>,
  ];

  return (
    <svg className="lesson-diagram" viewBox="0 0 400 202" role="img" aria-label={title}
      aria-description={states[index]?.[Number(alternate)].description}>
      {diagrams[index]}
    </svg>
  );
}
