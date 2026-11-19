import {useEffect, useRef, useState, type FormEvent} from 'react';

export type Api = (path: string, options?: RequestInit) => Promise<any>;
export type Client = {id: number; name: string};
export type Work = {id: number; name: string; client_id: number; status: string; created_at?: string};

export function workStatus(status: string) {
  return status ? status[0].toUpperCase() + status.slice(1) : 'Pendiente';
}

export function WorkList({works, clients, recent, unavailable, onCreate, onOpen}: {
  works?: Work[];
  clients?: Client[];
  recent: boolean;
  unavailable: boolean;
  onCreate: () => void;
  onOpen: (work: Work, client?: Client) => void;
}) {
  const ordered = works && [...works].sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '') || b.id - a.id);
  const visible = recent ? ordered?.slice(0, 5) : ordered;
  return <section className="card work-panel">
    <div className="work-actions work-list-heading">
      <h3>{recent ? 'Últimas obras creadas' : 'Todas las obras'}</h3>
      <button onClick={onCreate}>Nueva obra</button>
    </div>
    {visible === undefined ? !unavailable && <p>Cargando obras…</p> : visible.length === 0 ? <p>Creá tu primera obra para preparar un presupuesto.</p> :
      <ul className="work-list">{visible.map(work => {
        const client = clients?.find(item => item.id === work.client_id);
        return <li key={work.id}>
          <button className="work-secondary" aria-describedby={`work-list-${work.id}`} onClick={() => onOpen(work, client)}>{work.name}</button>
          <span id={`work-list-${work.id}`}>{client ? `${client.name} · ` : ''}{workStatus(work.status)}</span>
        </li>;
      })}</ul>}
  </section>;
}

export function NewWork({api, clients, onCreate, onCancel}: {
  api: Api;
  clients?: Client[];
  onCreate: (work: Work, client: Client) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [createdClient, setCreatedClient] = useState<Client>();
  const [addingClient, setAddingClient] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const clientName = useRef<HTMLInputElement>(null);
  const clientSelect = useRef<HTMLSelectElement>(null);
  const options = createdClient && !clients?.some(client => client.id === createdClient.id)
    ? [...(clients ?? []), createdClient] : clients ?? [];

  useEffect(() => {
    if (addingClient) clientName.current?.focus();
  }, [addingClient]);

  async function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const input = clientName.current!;
    const name = input.value.trim();
    if (!name) {
      input.setCustomValidity('Ingresá el nombre del cliente.');
      input.reportValidity();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const {id} = await api('clients', {method: 'POST', body: JSON.stringify({name})});
      input.value = '';
      setCreatedClient({id, name});
      setClientId(String(id));
      setAddingClient(false);
      clientSelect.current?.focus();
    } catch {
      setError('No pudimos guardar el cliente. Volvé a intentar.');
    } finally {
      setBusy(false);
    }
  }

  async function saveWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || addingClient) return;
    const form = event.currentTarget;
    const client = options.find(item => String(item.id) === clientId);
    if (!client) {
      setError('Elegí un cliente o agregalo desde acá.');
      clientSelect.current?.focus();
      return;
    }
    if (!name.trim()) {
      const input = form.elements.namedItem('name') as HTMLInputElement;
      input.setCustomValidity('Ingresá el nombre de la obra.');
      input.reportValidity();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const {id} = await api('projects', {method: 'POST', body: JSON.stringify({name: name.trim(), client_id: client.id})});
      if (form.isConnected) onCreate({id, name: name.trim(), client_id: client.id, status: 'pendiente'}, client);
    } catch {
      setError('No pudimos guardar la obra. Revisá los datos y volvé a intentar.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="card work-panel">
    <p>Poné un nombre que te ayude a encontrar la obra después, por ejemplo «Casa de Martín».</p>
    <form className="work-form" aria-label="Datos de la obra" onSubmit={saveWork}>
      <label htmlFor="work-name">Nombre de la obra</label>
      <input id="work-name" name="name" required readOnly={busy} value={name} onChange={event => {
        event.currentTarget.setCustomValidity('');
        setName(event.currentTarget.value);
      }}/>
      <label htmlFor="work-client">Cliente existente</label>
      <select id="work-client" name="client_id" ref={clientSelect} required value={clientId} disabled={busy && !addingClient} onChange={event => setClientId(event.currentTarget.value)}>
        <option value="">{clients === undefined ? 'Cargando clientes…' : 'Elegí un cliente'}</option>
        {options.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
      </select>
      <div className="work-actions">
        <button type="button" className="work-secondary" aria-expanded={addingClient} aria-controls="new-client" onClick={() => {
          setError('');
          setAddingClient(!addingClient);
        }} disabled={busy}>Agregar cliente</button>
        {!addingClient && <button type="submit" disabled={busy}>Guardar obra</button>}
        <button type="button" className="work-secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
      </div>
    </form>
    <form id="new-client" className="work-form work-inline-form" aria-labelledby="new-client-heading" onSubmit={saveClient} hidden={!addingClient}>
      <h3 id="new-client-heading">Nuevo cliente</h3>
      <label htmlFor="work-client-name">Nombre del cliente</label>
      <input id="work-client-name" name="name" ref={clientName} autoComplete="section-work-client name" required readOnly={busy} onChange={event => event.currentTarget.setCustomValidity('')}/>
      <div className="work-actions"><button type="submit" disabled={busy}>Guardar cliente</button></div>
    </form>
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
