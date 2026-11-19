import {useEffect, useRef, useState, type FormEvent} from 'react';
import {pesoCents, pesos} from './money';
import type {Api, Client, Work} from './Works';

type Material = {id: number; name: string; unit: string; price_cents: number; supplier?: string};
type MaterialLine = {id: number; project_id: number; material_id: number; quantity: number};
type Quote = {id: number; project_id: number; project_name: string; version: number; total_cents: number};
type SharedQuote = Pick<Quote, 'id' | 'project_name'> & Partial<Pick<Quote, 'version' | 'total_cents'>>;

export function WorkBudget({api, work, client}: {api: Api; work: Work; client?: Client}) {
  const [catalog, setCatalog] = useState<Material[]>([]);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editing, setEditing] = useState<MaterialLine | 'add' | null>(null);
  const [shared, setShared] = useState<SharedQuote>();
  const [laborInput, setLaborInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [error, setError] = useState('');
  const addMaterial = useRef<HTMLButtonElement>(null);
  const materialsHeading = useRef<HTMLHeadingElement>(null);
  const canEdit = !loading && !loadError && !busy;

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [api, work.id]);

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setLoadError(false);
    try {
      const [materials, materialLines, history]: [Material[], MaterialLine[], Quote[]] = await Promise.all([
        api('materials', {signal}), api('project-materials', {signal}), api('quotations', {signal}),
      ]);
      if (signal?.aborted) return;
      setCatalog(materials);
      setLines(materialLines.filter(line => line.project_id === work.id));
      setQuotes(history.filter(quote => quote.project_id === work.id));
    } catch {
      if (!signal?.aborted) setLoadError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  async function refreshHistory() {
    setHistoryError(false);
    try {
      const history: Quote[] = await api('quotations');
      setQuotes(history.filter(quote => quote.project_id === work.id));
    } catch {
      setHistoryError(true);
    }
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || editing) return;
    const input = event.currentTarget.elements.namedItem('labor') as HTMLInputElement;
    let laborCents;
    try {
      laborCents = pesoCents(laborInput.trim());
    } catch (err) {
      input.setCustomValidity((err as Error).message);
      input.reportValidity();
      return;
    }
    if (laborCents === 0 && !lines.length) {
      setError('Ingresá un importe de mano de obra o agregá un material.');
      input.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const {id} = await api('quotations', {method: 'POST', body: JSON.stringify({project_id: work.id, labor_cents: laborCents})});
      setShared({id, project_name: work.name});
      await refreshHistory();
    } catch {
      setError('No pudimos generar el presupuesto. Revisá los datos y volvé a intentar.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(line: MaterialLine) {
    if (!canEdit || editing) return;
    setBusy(true);
    setError('');
    try {
      await api(`project-materials/${line.id}`, {method: 'DELETE'});
      setLines(current => current.filter(item => item.id !== line.id));
      materialsHeading.current?.focus();
    } catch {
      setError('No pudimos quitar el material de la obra. Volvé a intentar.');
    } finally {
      setBusy(false);
    }
  }

  function closeMaterial() {
    setEditing(null);
    addMaterial.current?.focus();
  }

  const versions = [...quotes].sort((a, b) => b.version - a.version);
  const selectedQuote = quotes.find(quote => quote.id === shared?.id) ?? shared;
  return <div className="work-panel">
    <section className="card">
      <h3>Presupuesto</h3>
      <p>Agregá los materiales que conozcas y el importe por tu trabajo. Cada presupuesto generado queda guardado como una versión.</p>
      {loading && <p>Cargando presupuesto…</p>}
      {loadError && <div>
        <p className="error" role="alert">No pudimos cargar los materiales y presupuestos de la obra.</p>
        <button onClick={() => void load()}>Volver a intentar</button>
      </div>}
      {!loading && !loadError && <>
        <h4 tabIndex={-1} ref={materialsHeading}>Materiales de la obra</h4>
        {lines.length === 0 ? <p>Podés presupuestar solo la mano de obra y agregar materiales cuando los tengas.</p> :
          <ul className="work-list">{lines.map(line => {
            const material = catalog.find(item => item.id === line.material_id);
            const name = material?.name ?? 'Material';
            return <li key={line.id}>
              <div><strong>{name}</strong><p>{line.quantity} {material?.unit}{material && ` · ${pesos.format(material.price_cents / 100)} por ${material.unit}`}</p>
                {material?.supplier && <p>{material.supplier}</p>}</div>
              <div className="work-actions">
                <button type="button" className="work-secondary" aria-label={`Editar cantidad de ${name}`} disabled={!canEdit || !!editing} onClick={() => setEditing(line)}>Editar cantidad</button>
                <button type="button" className="work-secondary" aria-label={`Quitar ${name} de la obra`} disabled={!canEdit || !!editing} onClick={() => void remove(line)}>Quitar</button>
              </div>
            </li>;
          })}</ul>}
        <button type="button" className="work-secondary" ref={addMaterial} disabled={!canEdit} aria-expanded={!!editing} aria-controls="work-material-form" onClick={() => {
          if (editing) {
            document.getElementById('work-material-heading')?.focus();
            return;
          }
          setError('');
          setEditing('add');
        }}>Agregar material</button>
        <div id="work-material-form">
          {editing && <MaterialForm api={api} projectId={work.id} catalog={catalog} lines={lines}
            line={editing === 'add' ? undefined : editing} onCatalogSave={material => setCatalog(current => [...current, material])}
            onSave={line => {
              setLines(current => [...current.filter(item => item.id !== line.id), line]);
              closeMaterial();
            }} onCancel={closeMaterial}/>}
        </div>
        <form className="work-form work-inline-form" aria-label="Generar presupuesto" onSubmit={generate}>
          <label htmlFor="work-labor">Mano de obra (pesos)</label>
          <p id="work-labor-help">Ingresá cuánto vas a cobrar por tu trabajo. Ejemplo: 15.000,25.</p>
          <input id="work-labor" name="labor" inputMode="decimal" aria-describedby="work-labor-help" value={laborInput} readOnly={busy} onChange={event => {
            event.currentTarget.setCustomValidity('');
            setError('');
            setLaborInput(event.currentTarget.value);
          }}/>
          {editing && <p>Guardá o cancelá el material antes de generar el presupuesto.</p>}
          <div className="work-actions"><button type="submit" disabled={!canEdit || !!editing}>Generar presupuesto</button></div>
        </form>
      </>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    {selectedQuote && <ShareQuote key={selectedQuote.id} quote={selectedQuote} client={client}/>}
    {!loading && !loadError && <section className="card">
      <h3>Versiones del presupuesto</h3>
      {historyError ? <div>
        <p role="status">El PDF está disponible. No pudimos actualizar la lista de versiones.</p>
        <button type="button" className="work-secondary" disabled={busy} onClick={() => {
          setBusy(true);
          void refreshHistory().finally(() => setBusy(false));
        }}>Actualizar versiones</button>
      </div> : versions.length === 0 && <p>Todavía no hay presupuestos para esta obra.</p>}
      {versions.length > 0 && <ul className="work-list">{versions.map(quote => <li key={quote.id}>
        <span><strong>Versión {quote.version}</strong> · {pesos.format(quote.total_cents / 100)}</span>
        <button type="button" className="work-secondary" aria-label={`Compartir presupuesto versión ${quote.version}`} onClick={() => {
          if (shared?.id === quote.id) document.getElementById('work-share-heading')?.focus();
          setShared(quote);
        }}>Compartir presupuesto</button>
      </li>)}</ul>}
    </section>}
  </div>;
}

function MaterialForm({api, projectId, catalog, lines, line, onCatalogSave, onSave, onCancel}: {
  api: Api;
  projectId: number;
  catalog: Material[];
  lines: MaterialLine[];
  line?: MaterialLine;
  onCatalogSave: (material: Material) => void;
  onSave: (line: MaterialLine) => void;
  onCancel: () => void;
}) {
  const [newMaterial, setNewMaterial] = useState(false);
  const [savedMaterial, setSavedMaterial] = useState<Material>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const nameField = useRef<HTMLInputElement>(null);
  const available = catalog.filter(material => !lines.some(item => item.material_id === material.id));
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (newMaterial) nameField.current?.focus(); }, [newMaterial]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const quantityInput = form.elements.namedItem('quantity') as HTMLInputElement;
    const quantityText = quantityInput.value.trim();
    const quantity = Number(quantityText.replace(',', '.'));
    if (!/^\d{1,9}(?:[.,]\d{1,3})?$/.test(quantityText) || quantity <= 0) {
      quantityInput.setCustomValidity('Ingresá una cantidad mayor a cero, con hasta tres decimales. Ejemplo: 2,5.');
      quantityInput.reportValidity();
      return;
    }
    let materialId = line?.material_id ?? savedMaterial?.id ?? Number(data.get('material'));
    const draft = {
      name: String(data.get('name') ?? '').trim(), unit: String(data.get('unit') ?? '').trim(),
      supplier: String(data.get('supplier') ?? '').trim(), price_cents: 0,
    };
    if (newMaterial && !materialId) {
      const price = form.elements.namedItem('price') as HTMLInputElement;
      const missing = !draft.name ? 'name' : !draft.unit ? 'unit' : '';
      if (missing) {
        const field = form.elements.namedItem(missing) as HTMLInputElement;
        field.setCustomValidity(missing === 'name' ? 'Ingresá el nombre del material.' : 'Ingresá la unidad del material.');
        field.reportValidity();
        return;
      }
      try {
        if (!price.value.trim()) throw new Error('Ingresá el precio por unidad en pesos.');
        draft.price_cents = pesoCents(price.value.trim());
      } catch (err) {
        price.setCustomValidity((err as Error).message);
        price.reportValidity();
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      if (!materialId) {
        const {id} = await api('materials', {method: 'POST', body: JSON.stringify(draft)});
        materialId = id;
        setSavedMaterial({id, ...draft});
        onCatalogSave({id, ...draft});
      }
      const association = {project_id: projectId, material_id: materialId, quantity};
      const {id} = await api(line ? `project-materials/${line.id}` : 'project-materials', {
        method: line ? 'PUT' : 'POST', body: JSON.stringify(association),
      }).catch(async (err: unknown) => {
        const current: MaterialLine[] = await api('project-materials');
        const saved = current.find(item => item.project_id === projectId && item.material_id === materialId && item.quantity === quantity);
        if (!saved) throw err;
        return saved;
      });
      onSave({id, ...association});
    } catch {
      setError(newMaterial && materialId
        ? 'El material quedó guardado en el catálogo. Volvé a intentar agregarlo a la obra.'
        : 'No pudimos guardar el material. Revisá los datos y volvé a intentar.');
    } finally {
      setBusy(false);
    }
  }

  const clearValidity = (event: FormEvent<HTMLInputElement>) => event.currentTarget.setCustomValidity('');
  return <form className="work-form work-inline-form" aria-labelledby="work-material-heading" onSubmit={save}>
    <h5 id="work-material-heading" tabIndex={-1} ref={heading}>{line ? 'Editar cantidad' : 'Agregar material a la obra'}</h5>
    {!line && !savedMaterial && <>
      {!newMaterial && available.length > 0 && <>
        <label htmlFor="work-catalog-item">Material del catálogo</label>
        <select name="material" id="work-catalog-item" required disabled={busy}>
          <option value="">Elegí un material</option>
          {available.map(item => <option key={item.id} value={item.id}>{item.name} · {item.unit}{item.supplier ? ` · ${item.supplier}` : ''}</option>)}
        </select>
      </>}
      {!newMaterial && available.length === 0 && <p>No hay materiales disponibles para agregar desde el catálogo.</p>}
      <div className="work-actions"><button className="work-secondary" type="button" aria-expanded={newMaterial} disabled={busy} onClick={() => {
        setError('');
        setNewMaterial(!newMaterial);
      }}>{newMaterial ? 'Elegir del catálogo' : 'Nuevo material de catálogo'}</button></div>
      {newMaterial && <>
        <label htmlFor="work-material-name">Nombre del material</label>
        <input id="work-material-name" name="name" ref={nameField} required readOnly={busy} onInput={clearValidity}/>
        <label htmlFor="work-material-unit">Unidad</label>
        <p id="work-unit-help">Ejemplos: m, unidad, caja.</p>
        <input id="work-material-unit" name="unit" aria-describedby="work-unit-help" required readOnly={busy} onInput={clearValidity}/>
        <label htmlFor="work-material-price">Precio por unidad (pesos)</label>
        <input id="work-material-price" name="price" inputMode="decimal" required readOnly={busy} onInput={clearValidity}/>
        <label htmlFor="work-material-supplier">Proveedor (opcional)</label>
        <input id="work-material-supplier" name="supplier" readOnly={busy}/>
      </>}
    </>}
    {savedMaterial && <p>{savedMaterial.name} ya está en el catálogo.</p>}
    {(line || savedMaterial || newMaterial || available.length > 0) && <>
      <label htmlFor="work-material-quantity">Cantidad</label>
      <input id="work-material-quantity" name="quantity" inputMode="decimal" required readOnly={busy} defaultValue={line?.quantity} onInput={clearValidity}/>
    </>}
    <div className="work-actions">
      {(line || savedMaterial || newMaterial || available.length > 0) && <button type="submit" disabled={busy}>Guardar material</button>}
      <button type="button" className="work-secondary" disabled={busy} onClick={onCancel}>Cancelar</button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
  </form>;
}

function ShareQuote({quote, client}: {quote: SharedQuote; client?: Client}) {
  const [status, setStatus] = useState('');
  const title = useRef<HTMLHeadingElement>(null);
  const messageField = useRef<HTMLTextAreaElement>(null);
  const greeting = client?.name ? `Hola, ${client.name}.` : 'Hola.';
  const message = `${greeting} Te adjunto el presupuesto para la obra ${quote.project_name}. Cualquier duda, avisame.`;
  useEffect(() => { title.current?.focus(); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setStatus('Mensaje copiado. Pegalo en WhatsApp y adjuntá el PDF.');
    } catch {
      messageField.current?.select();
      messageField.current?.focus();
      setStatus('Seleccioná el mensaje y copialo manualmente.');
    }
  }

  return <section className="card">
    <h3 id="work-share-heading" tabIndex={-1} ref={title}>Compartir presupuesto</h3>
    {quote.version !== undefined && quote.total_cents !== undefined && <p>Versión {quote.version} · {pesos.format(quote.total_cents / 100)}</p>}
    <p>Descargá el PDF para adjuntarlo en WhatsApp.</p>
    <div className="work-actions"><a className="work-download" href={`/api/quotations/${quote.id}/pdf`} download>Descargar PDF</a></div>
    <div className="work-form work-inline-form">
      <label htmlFor="work-share-message">Mensaje para WhatsApp</label>
      <textarea id="work-share-message" ref={messageField} rows={3} readOnly value={message}/>
      <div className="work-actions"><button type="button" className="work-secondary" onClick={() => void copy()}>Copiar mensaje para WhatsApp</button></div>
      <div role="status">{status}</div>
    </div>
  </section>;
}
