import {useLayoutEffect, useRef, useState} from 'react';
import './studio.css';

const moduleCount = 12;
const positions = Array.from({length: moduleCount}, (_, index) => index + 1);
const draftKey = 'emonplan.studio.v1';
const catalog = {
  breaker: {name: 'Térmica', width: 2, color: '#97601d', terminals: ['L1', 'L2']},
  differential: {name: 'Diferencial', width: 2, color: '#136c71', terminals: ['L', 'N']},
  neutral: {name: 'Bornera N', width: 1, color: '#236fa6', terminals: ['N']},
  earth: {name: 'Bornera PE', width: 1, color: '#46703a', terminals: ['PE']},
} as const;
const wireColors = {
  ninguno: {label: 'Sin asignar', stroke: '#b5c5d0'},
  marron: {label: 'Marrón · Fase', stroke: '#cd865c'},
  negro: {label: 'Negro · Fase', stroke: '#161b21'},
  rojo: {label: 'Rojo · Fase', stroke: '#ff7977'},
  azul: {label: 'Azul · Neutro', stroke: '#66c4ff'},
  'verde-amarillo': {label: 'Verde/amarillo · PE', stroke: '#67ba69'},
} as const;

type Kind = keyof typeof catalog;
type Supply = 'monofasico' | 'trifasico';
type MountedPart = {id: number; kind: Kind; position: number};
type Side = 'top' | 'bottom';
type Endpoint = {componentId: number; terminal: string; side?: Side};
type Segment = {from: Endpoint; to: Endpoint; color: keyof typeof wireColors; section: number | null};
type Board = {components: MountedPart[]; segments: Segment[]};
type Draft = Board & {name: string; supply: Supply};
type Selection = {kind: Kind} | {part: MountedPart};
type Mode = 'montar' | 'conectar' | 'materiales';
const emptyDraft: Draft = {name: 'Tablero sin título', supply: 'monofasico', components: [], segments: []};

function endPosition(kind: Kind, start: number) {
  return start + catalog[kind].width - 1;
}

function sameEndpoint(a: Endpoint, b: Endpoint) {
  return a.componentId === b.componentId && a.terminal === b.terminal &&
    (a.side ?? 'top') === (b.side ?? 'top');
}

function terminalLabel(part: MountedPart, endpoint: Endpoint) {
  return `${catalog[part.kind].name}, posición ${part.position}, ${endpoint.terminal} ${endpoint.side === 'bottom' ? 'inferior' : 'superior'}`;
}

function terminalPosition(part: MountedPart, terminal: string) {
  return part.position + catalog[part.kind].terminals.findIndex(name => name === terminal);
}

function wirePath(segment: Segment, parts: Map<number, MountedPart>) {
  const {from, to} = segment;
  const x1 = 100 * terminalPosition(parts.get(from.componentId)!, from.terminal) - 50;
  const x2 = 100 * terminalPosition(parts.get(to.componentId)!, to.terminal) - 50;
  const y1 = from.side === 'bottom' ? 248 : 32;
  const y2 = to.side === 'bottom' ? 248 : 32;
  const lane1 = y1 === 32 ? 5 : 275;
  const lane2 = y2 === 32 ? 5 : 275;
  if (y1 === y2) return `M${x1} ${y1}V${lane1}H${x2}V${y2}`;
  return `M${x1} ${y1}V${lane1}H-12V${lane2}H${x2}V${y2}`;
}

function readDraft() {
  try {
    const stored = localStorage.getItem(draftKey);
    if (stored === null) return {draft: emptyDraft, status: ''};

    const draft: Draft | null = JSON.parse(stored);
    if (!draft || typeof draft.name !== 'string' || !['monofasico', 'trifasico'].includes(draft.supply) ||
        !Array.isArray(draft.components) || !Array.isArray(draft.segments)) {
      throw new Error('Borrador inválido');
    }
    const occupied = new Set<number>();
    const parts = new Map<number, MountedPart>();
    for (const part of draft.components) {
      if (!part || !Object.prototype.hasOwnProperty.call(catalog, part.kind) || !Number.isSafeInteger(part.id) ||
          part.id < 1 || parts.has(part.id) || !Number.isInteger(part.position) || part.position < 1 ||
          endPosition(part.kind, part.position) > moduleCount) {
        throw new Error('Componente inválido');
      }
      parts.set(part.id, part);
      for (let position = part.position; position <= endPosition(part.kind, part.position); position++) {
        if (occupied.has(position)) throw new Error('Posición duplicada');
        occupied.add(position);
      }
    }
    const validEndpoint = (endpoint: Endpoint) => {
      if (!endpoint || (endpoint.side !== undefined && endpoint.side !== 'top' && endpoint.side !== 'bottom')) return false;
      const part = parts.get(endpoint.componentId);
      return !!part && catalog[part.kind].terminals.some(terminal => terminal === endpoint.terminal);
    };
    const segments = draft.segments.filter(segment => segment &&
      validEndpoint(segment.from) && validEndpoint(segment.to) && !sameEndpoint(segment.from, segment.to) &&
      Object.prototype.hasOwnProperty.call(wireColors, segment.color) &&
      (segment.section === null || (Number.isFinite(segment.section) && segment.section > 0)));
    return {
      draft: {...draft, segments},
      status: segments.length === draft.segments.length
        ? 'Guardado en este navegador'
        : 'El borrador contiene tramos inválidos que no se pudieron recuperar.',
    };
  } catch {
    return {draft: emptyDraft, status: 'No se pudo recuperar el borrador en este navegador.'};
  }
}

function PartDrawing({kind}: {kind: Kind}) {
  const {color, terminals, width} = catalog[kind];
  const size = width * 42;
  return <svg viewBox={`0 0 ${size} 100`} aria-hidden="true" focusable="false">
    <rect x="1" y="1" width={size - 2} height="98" rx="5" fill="#d5dfdd" stroke="#50696d" />
    <rect x="4" y="21" width={size - 8} height="58" rx="3" fill="#f8faf7" />
    <path d={`M4 25h${size - 8}`} stroke={color} strokeWidth="4" />
    <rect x="7" y="43" width={size - 14} height="17" rx="3" fill="#314951" />
    <path d={`M11 49h${size - 22}`} stroke="#9caeae" strokeWidth="4" strokeLinecap="round" />
    {kind === 'differential' && <rect x="63" y="46" width="9" height="10" rx="2" fill="#e0b45a" />}
    <g textAnchor="middle" fontFamily="system-ui" fontWeight="700" fontSize="9" fill="#18313a">
      {terminals.map((terminal, index) => {
        const x = 21 + index * 42;
        return <g key={terminal}>
          <circle cx={x} cy="11" r="5" fill="#b0c0bc" stroke="#51676b" />
          <path d={`M${x - 2.5} 11h5`} stroke="#51676b" />
          <circle cx={x} cy="89" r="5" fill="#b0c0bc" stroke="#51676b" />
          <path d={`M${x - 2.5} 89h5`} stroke="#51676b" />
          <text x={x} y="39">{terminal}</text>
          <text x={x} y="73">{terminal}</text>
        </g>;
      })}
    </g>
  </svg>;
}

function Materials({components, segments}: Board) {
  const pieces = Object.entries(catalog).map(([kind, {name, width}]) => ({
    kind, name, width, count: components.filter(part => part.kind === kind).length,
  })).filter(({count}) => count > 0);
  const wires = new Map<string, Pick<Segment, 'color' | 'section'> & {count: number}>();
  for (const {color, section} of segments) {
    const key = `${color}:${section}`;
    wires.set(key, {color, section, count: (wires.get(key)?.count ?? 0) + 1});
  }

  return <section className="card studio-inspector studio-materials" aria-labelledby="studio-materials-heading">
    <h3 id="studio-materials-heading">Materiales</h3>
    {pieces.length > 0 ? <table>
      <caption>Componentes</caption>
      <thead><tr><th scope="col">Pieza</th><th scope="col">Cantidad</th></tr></thead>
      <tbody>{pieces.map(({kind, name, width, count}) => <tr key={kind}>
        <th scope="row">{name} <small>{width} {width === 1 ? 'módulo' : 'módulos'} DIN</small></th>
        <td>{count}</td>
      </tr>)}</tbody>
    </table> : <p>Todavía no hay componentes.</p>}
    {wires.size > 0 ? <table>
      <caption>Cables</caption>
      <thead><tr><th scope="col">Color y sección</th><th scope="col">Tramos</th></tr></thead>
      <tbody>{Array.from(wires, ([key, {color, section, count}]) => <tr key={key}>
        <th scope="row">{wireColors[color].label} <small>{section === null ? 'Sin sección' : `${String(section).replace('.', ',')} mm²`}</small></th>
        <td>{count}</td>
      </tr>)}</tbody>
    </table> : <p>Todavía no hay tramos.</p>}
  </section>;
}

export function Studio() {
  const [{draft, status}, setProject] = useState(readDraft);
  const [history, setHistory] = useState<{past: Board[]; future: Board[]}>({past: [], future: []});
  const [selection, setSelection] = useState<Selection | null>(null);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('montar');
  const [pending, setPending] = useState<Endpoint | null>(null);
  const [selectedWire, setSelectedWire] = useState<number | null>(null);
  const [sectionEdit, setSectionEdit] = useState<{value: string; invalid: boolean} | null>(null);
  const mountMode = useRef<HTMLButtonElement>(null);
  const wireMode = useRef<HTMLButtonElement>(null);
  const railSlots = useRef<Array<HTMLButtonElement | null>>([]);
  const focusPosition = useRef<number | undefined>(undefined);
  const wiring = mode === 'conectar';
  const showWires = mode !== 'montar';
  const {components, segments} = draft;
  const parts = new Map(components.map(part => [part.id, part]));
  const orderedParts = [...components].sort((a, b) => a.position - b.position);
  const segment = selectedWire === null ? undefined : segments[selectedWire];
  const endpointName = (endpoint: Endpoint) => terminalLabel(parts.get(endpoint.componentId)!, endpoint);
  const wireName = (wire: Segment) => `${endpointName(wire.from)} → ${endpointName(wire.to)}`;
  const moving = selection && 'part' in selection ? selection.part : undefined;
  const selectedKind = selection && ('kind' in selection ? selection.kind : selection.part.kind);
  const occupied = new Map<number, MountedPart>();
  for (const part of components) {
    for (let position = part.position; position <= endPosition(part.kind, part.position); position++) {
      occupied.set(position, part);
    }
  }

  useLayoutEffect(() => {
    const position = focusPosition.current;
    focusPosition.current = undefined;
    if (selection && position !== undefined) railSlots.current[position]?.focus();
  }, [selection]);

  function save(next: Draft) {
    try {
      localStorage.setItem(draftKey, JSON.stringify(next));
      setProject({draft: next, status: 'Guardado en este navegador'});
    } catch {
      setProject({draft: next, status: 'No se pudo guardar el borrador en este navegador.'});
    }
  }

  function editBoard(next: Partial<Board>) {
    setHistory({past: [...history.past, {components, segments}], future: []});
    save({...draft, ...next});
  }

  function restoreBoard(direction: 'undo' | 'redo') {
    const {past, future} = history;
    const undoing = direction === 'undo';
    const next = (undoing ? past : future).at(-1);
    if (!next) return;
    const current = {components, segments};
    setHistory(undoing
      ? {past: past.slice(0, -1), future: [...future, current]}
      : {past: [...past, current], future: future.slice(0, -1)});
    save({...draft, ...next});
    clearSelection();
    setMessage(undoing ? 'Cambio deshecho.' : 'Cambio rehecho.');
  }

  function select(next: Selection | null, keyboard = false) {
    if (next && keyboard) {
      const part = 'part' in next ? next.part : undefined;
      const kind = 'kind' in next ? next.kind : next.part.kind;
      focusPosition.current = positions.find(position => !positionError(kind, position, part));
    }
    setSelection(next);
    setMessage('');
  }

  function positionError(kind: Kind, position: number, movingPart?: MountedPart) {
    const end = endPosition(kind, position);
    if (end > moduleCount) return 'La pieza no cabe en esa posición.';
    for (let slot = position; slot <= end; slot++) {
      const part = occupied.get(slot);
      if (part && part.id !== movingPart?.id) return 'Hay posiciones ocupadas en ese destino.';
    }
  }

  function mount(position: number) {
    if (!selectedKind) return;
    const error = positionError(selectedKind, position, moving);
    if (error) {
      setMessage(error);
      return;
    }
    const end = endPosition(selectedKind, position);
    if (moving?.position !== position) {
      editBoard({components: moving
        ? components.map(part => part.id === moving.id ? {...part, position} : part)
        : [...components, {id: Math.max(0, ...components.map(part => part.id)) + 1, kind: selectedKind, position}]});
    }
    setSelection(null);
    setMessage(`${catalog[selectedKind].name} en ${end === position ? `la posición ${position}` : `las posiciones ${position}–${end}`}.`);
  }

  function clearSelection() {
    setSelection(null);
    setPending(null);
    setSelectedWire(null);
    setSectionEdit(null);
  }

  function changeMode(next: Mode) {
    if (mode === next) return;
    setMode(next);
    clearSelection();
    setMessage('');
  }

  function chooseTerminal(endpoint: Endpoint) {
    setMessage('');
    if (!pending) {
      setSelectedWire(null);
      setSectionEdit(null);
      setPending(endpoint);
      return;
    }
    setPending(null);
    if (sameEndpoint(pending, endpoint)) {
      setMessage('Elegí dos bornes distintos para crear el tramo.');
      return;
    }
    editBoard({segments: [...segments, {from: pending, to: endpoint, color: 'ninguno', section: null}]});
    setSelectedWire(segments.length);
    setMessage('Tramo creado.');
  }

  function chooseWire(index: number) {
    setPending(null);
    setMessage('');
    if (index !== selectedWire) setSectionEdit(null);
    setSelectedWire(index);
  }

  function editWire(changes: Partial<Pick<Segment, 'color' | 'section'>>) {
    if (!segment || (changes.color === undefined || changes.color === segment.color) &&
        (changes.section === undefined || changes.section === segment.section)) return;
    editBoard({segments: segments.map((wire, index) => index === selectedWire ? {...wire, ...changes} : wire)});
  }

  function confirmSection() {
    if (!sectionEdit) return;
    const {value} = sectionEdit;
    const decimal = value.trim().replace(',', '.');
    const section = value === '' ? null : Number(decimal);
    if (section !== null && (!/^\d*\.?\d+(?:e[+-]?\d+)?$/i.test(decimal) || !Number.isFinite(section) || section <= 0)) {
      if (!sectionEdit.invalid) setSectionEdit({value, invalid: true});
      return;
    }
    setSectionEdit(null);
    editWire({section});
  }

  function removeWire() {
    editBoard({segments: segments.filter((_, index) => index !== selectedWire)});
    setSelectedWire(null);
    setSectionEdit(null);
    setMessage('Tramo eliminado.');
    wireMode.current?.focus();
  }

  function removePart(part: MountedPart) {
    editBoard({
      components: components.filter(item => item.id !== part.id),
      segments: segments.filter(({from, to}) => from.componentId !== part.id && to.componentId !== part.id),
    });
    select(null);
    setMessage(`${catalog[part.kind].name} retirada del tablero.`);
    mountMode.current?.focus();
  }

  function terminalsOnRail(side: Side) {
    return orderedParts.flatMap(part => catalog[part.kind].terminals.map(terminal => {
      const endpoint = {componentId: part.id, terminal, side};
      const key = `${part.id}-${side}-${terminal}`;
      const style = {gridColumn: terminalPosition(part, terminal), gridRow: side === 'top' ? 2 : 4};
      if (!wiring) return <span key={key} className="studio-terminal" style={style} aria-hidden="true"><span>{terminal}</span></span>;
      return <button key={key} type="button" className="studio-terminal" style={style}
        aria-label={terminalLabel(part, endpoint)} aria-pressed={!!pending && sameEndpoint(pending, endpoint)}
        onClick={() => chooseTerminal(endpoint)}><span>{terminal}</span></button>;
    }));
  }

  return <div className="studio">
    <div className="card studio-project">
      <div className="studio-field">
        <label htmlFor="studio-name">Nombre del proyecto</label>
        <input id="studio-name" value={draft.name} onChange={event => save({...draft, name: event.target.value})} />
      </div>
      <div className="studio-field">
        <label htmlFor="studio-supply">Tipo de alimentación</label>
        <select id="studio-supply" value={draft.supply} onChange={event => save({...draft, supply: event.target.value as Supply})}>
          <option value="monofasico">Monofásico</option>
          <option value="trifasico">Trifásico</option>
        </select>
      </div>
      <p className="studio-save" role="status">{status}</p>
    </div>

    <div className="studio-tools">
      <div role="group" aria-label="Historial del tablero">
        <button type="button" aria-disabled={history.past.length === 0} onClick={() => restoreBoard('undo')}>Deshacer</button>
        <button type="button" aria-disabled={history.future.length === 0} onClick={() => restoreBoard('redo')}>Rehacer</button>
      </div>
      <div role="group" aria-label="Modo del tablero">
        <button type="button" aria-pressed={mode === 'montar'} ref={mountMode} onClick={() => changeMode('montar')}>Montar</button>
        <button type="button" aria-pressed={wiring} ref={wireMode} onClick={() => changeMode('conectar')}>Conectar</button>
        <button type="button" aria-pressed={mode === 'materiales'} onClick={() => changeMode('materiales')}>Materiales</button>
      </div>
    </div>

    <div className="studio-workspace">
      <section className="studio-board" aria-labelledby="studio-board-heading">
        <div className="studio-board-heading">
          <h3 id="studio-board-heading">Gabinete DIN</h3>
          <span>{occupied.size} de {moduleCount} módulos ocupados</span>
        </div>
        <div className="studio-cabinet" role="region" aria-label="Riel DIN de 12 posiciones" tabIndex={0}>
          <div className={`studio-rail${showWires ? ' studio-wiring' : ''}`}>
            {positions.map(position => {
              const part = occupied.get(position);
              return <button key={position} type="button" className="studio-position" style={{gridColumn: position}}
                ref={button => { railSlots.current[position] = button; }}
                aria-label={`Posición ${position}: ${part ? catalog[part.kind].name : 'libre'}`}
                aria-disabled={!selection} tabIndex={showWires ? -1 : undefined}
                onClick={() => mount(position)}>{String(position).padStart(2, '0')}</button>;
            })}
            {showWires && terminalsOnRail('top')}
            {positions.map(position => !occupied.has(position) && <span key={position} className="studio-empty" style={{gridColumn: position}} />)}
            {orderedParts.map(part => {
              const {name, width} = catalog[part.kind];
              const end = endPosition(part.kind, part.position);
              if (showWires) return <div key={part.id} className="studio-part" style={{gridColumn: `${part.position} / span ${width}`}}>
                <PartDrawing kind={part.kind} />
                <span>{name}</span>
              </div>;
              return <button key={part.id} type="button" className="studio-part"
                style={{gridColumn: `${part.position} / span ${width}`}}
                aria-label={`Mover ${name}, ${width === 1 ? `posición ${part.position}` : `posiciones ${part.position}–${end}`}`}
                aria-pressed={moving?.id === part.id} onClick={event => select(moving?.id === part.id ? null : {part}, event.detail === 0)}>
                <PartDrawing kind={part.kind} />
                <span>{name}</span>
              </button>;
            })}
            {showWires && terminalsOnRail('bottom')}
            {showWires && <svg className="studio-wires" viewBox="0 0 1200 280" preserveAspectRatio="none" aria-hidden="true">
              {segments.map((wire, index) => {
                const route = wirePath(wire, parts);
                return <g key={index} className="studio-wire" onClick={wiring ? () => chooseWire(index) : undefined}>
                  <path d={route} stroke={selectedWire === index ? '#fff' : '#a5bbc3'} strokeWidth={selectedWire === index ? 8 : 5} />
                  <path data-testid={`studio-wire-${index}`} d={route} stroke={wireColors[wire.color].stroke} strokeWidth="3" />
                  {wire.color === 'verde-amarillo' && <path d={route} stroke="#f6dd63" strokeWidth="3" strokeDasharray="5 4" />}
                  {wiring && <path className="studio-wire-target" d={route} stroke="transparent" strokeWidth="14" />}
                </g>;
              })}
            </svg>}
          </div>
        </div>
        <div className="studio-feedback">
          <p role="status">{message || (mode === 'materiales' ? '' : wiring
            ? pending ? `Primer borne: ${endpointName(pending)}. Elegí el segundo.` : 'Elegí dos bornes o seleccioná un tramo.'
            : selectedKind
            ? `${moving ? 'Mover' : 'Colocar'} ${catalog[selectedKind].name}. Elegí una posición del riel.`
            : 'Elegí una pieza del catálogo para montarla o una del gabinete para moverla.')}</p>
        </div>
      </section>

      {mode === 'materiales' ? <Materials components={components} segments={segments} /> : wiring ? <section className="card studio-inspector" aria-labelledby="studio-wires-heading">
        <h3 id="studio-wires-heading">Tramos</h3>
        {segments.length > 0 ? <ul>
          {segments.map((wire, index) => <li key={index}>
            <button type="button" aria-pressed={selectedWire === index} onClick={() => chooseWire(index)}>{wireName(wire)}</button>
          </li>)}
        </ul> : <p>Todavía no hay tramos.</p>}
        {segment && <div className="studio-wire-fields">
          <div className="studio-field">
            <label htmlFor="studio-wire-color">Color</label>
            <select id="studio-wire-color" value={segment.color}
              onChange={event => editWire({color: event.target.value as Segment['color']})}>
              {Object.entries(wireColors).map(([color, {label}]) => <option key={color} value={color}>{label}</option>)}
            </select>
          </div>
          <div className="studio-field">
            <label htmlFor="studio-wire-section">Sección nominal (mm²)</label>
            <input id="studio-wire-section" inputMode="decimal" value={sectionEdit?.value ?? segment.section ?? ''}
              aria-invalid={sectionEdit?.invalid ?? false}
              aria-describedby={sectionEdit?.invalid ? 'studio-section-error' : undefined}
              onChange={event => setSectionEdit({value: event.target.value, invalid: false})}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  confirmSection();
                }
              }}
              onBlur={confirmSection} />
          </div>
          <div>
            <button type="button" className="studio-remove" onClick={removeWire}>Eliminar tramo</button>
            <div id="studio-section-error" className="studio-section-error" role="status">
              {sectionEdit?.invalid && 'Ingresá una sección mayor que cero.'}
            </div>
          </div>
        </div>}
      </section> : <section className="card studio-catalog" aria-labelledby="studio-catalog-heading">
        <h3 id="studio-catalog-heading">Montar</h3>
        <ul>
          {(Object.keys(catalog) as Kind[]).map(kind => {
            const {name, width, terminals} = catalog[kind];
            const selected = selection !== null && 'kind' in selection && selection.kind === kind;
            return <li key={kind}>
              <button type="button" aria-pressed={selected} onClick={event => select(selected ? null : {kind}, event.detail === 0)}>
                <PartDrawing kind={kind} />
                <span><strong>{name}</strong><small>{width} {width === 1 ? 'módulo' : 'módulos'} · Bornes {terminals.join(', ')}</small></span>
              </button>
            </li>;
          })}
        </ul>
        {moving && <button type="button" className="studio-remove" onClick={() => removePart(moving)}>Quitar {catalog[moving.kind].name}</button>}
      </section>}
    </div>
  </div>;
}
