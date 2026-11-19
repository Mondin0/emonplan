import {Lessons} from './Lessons';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ReactFlow,Background,Controls,Handle,Position,getBezierPath} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import {SchemeEditor} from './SchemeEditor';
import {NewWork, WorkList, workStatus, type Client, type Work} from './Works';
import {WorkBudget} from './WorkBudget';
import {pesoCents, pesos} from './money';
type Row=Record<string,any>;
const sections:Record<string,{path:string;fields:[string,string,string?][]}>={Clientes:{path:'clients',fields:[['name','Nombre'],['email','Correo','email'],['phone','Teléfono'],['address','Dirección']]},Proyectos:{path:'projects',fields:[['name','Nombre'],['client_id','ID de cliente','number'],['address','Dirección'],['description','Descripción'],['installation_type','Tipo de instalación'],['supply_type','Alimentación'],['status','Estado']]},Tableros:{path:'boards',fields:[['project_id','ID de proyecto','number'],['name','Nombre']]},Circuitos:{path:'circuits',fields:[['board_id','ID de tablero','number'],['identifier','Identificador'],['description','Descripción'],['circuit_type','Tipo'],['power_w','Potencia (W)','number'],['voltage_v','Tensión (V)','number'],['protection','Protección'],['conductor_mm2','Sección (mm²)','number'],['length_m','Longitud (m)','number']]},Materiales:{path:'materials',fields:[['name','Nombre'],['category','Categoría'],['unit','Unidad'],['price_cents','Precio (centavos)','number'],['supplier','Proveedor']]},'Cómputo':{path:'project-materials',fields:[['project_id','ID de proyecto','number'],['material_id','ID de material','number'],['quantity','Cantidad','number']]},Presupuestos:{path:'quotations',fields:[['project_id','Obra del presupuesto','number'],['labor_cents','Mano de obra (pesos)']]},Actividades:{path:'activities',fields:[['project_id','ID de proyecto','number'],['description','Descripción'],['observation','Observaciones'],['occurred_on','Fecha','date']]}};
const quotationColumns = [['project_name','Obra'], ['version','Versión'], ['total_cents','Total']];

async function api(path:string,options:RequestInit={}){const r=await fetch('/api/'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});if(!r.ok){let message=await r.text();throw new Error(message||`Error ${r.status}`)}if(r.status===204)return null;return r.json()}
export function App(){const [user,setUser]=useState(false),[page,setPage]=useState('Inicio'),[rows,setRows]=useState<Row[]>([]),[form,setForm]=useState<Row>({}),[edit,setEdit]=useState<number|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[references,setReferences]=useState<Record<string,Row[]>>({}),[unifilarId,setUnifilarId]=useState<number|null>(null);const [schemeProject,setSchemeProject]=useState<Row|null>(null);const section=sections[page];
const [currentWork,setCurrentWork]=useState<Work>();
const [workClient,setWorkClient]=useState<Client>();
const [referenceIssue,setReferenceIssue]=useState(false);
const [referenceAttempt,setReferenceAttempt]=useState(0);
const workHeading=useRef<HTMLHeadingElement>(null);
const columns = page === 'Presupuestos' ? quotationColumns : section?.fields;
const focusedWorkPage = page === 'Obras' || page === 'Nueva obra' || page === 'Obra';
const focusPageHeading = focusedWorkPage || ['Lecciones', 'Clientes', 'Materiales'].includes(page);
const clients = references.clients as Client[] | undefined;
const works = references.projects as Work[] | undefined;
const currentClient = clients?.find(client => client.id === currentWork?.client_id) ?? workClient;

useEffect(() => {
  if (focusPageHeading) workHeading.current?.focus();
}, [page, focusPageHeading, user]);

function navigate(destination:string) {
  setPage(destination);
  setForm({});
  setEdit(null);
  setError('');
}

function openWork(work: Work, client?: Client) {
  setCurrentWork(work);
  setWorkClient(client);
  navigate('Obra');
}

function rememberCreatedWork(work: Work, client: Client) {
  setReferences(previous => ({
    ...previous,
    projects: [...(previous.projects ?? []).filter(item => item.id !== work.id), work],
    clients: [...(previous.clients ?? []).filter(item => item.id !== client.id), client],
  }));
  openWork(work, client);
}

async function logout() {
  try {
    await api('logout', {method:'POST'});
    setUser(false);
    setReferences({});
    setRows([]);
    setCurrentWork(undefined);
    setWorkClient(undefined);
    setUnifilarId(null);
    setSchemeProject(null);
    navigate('Inicio');
  } catch {
    setError('No pudimos cerrar sesión. Volvé a intentar.');
  }
}
useEffect(()=>{api('me').then(()=>setUser(true)).catch(()=>setUser(false))},[]);
async function load(){if(!section)return;setLoading(true);try{const data=await api(section.path);setRows(Array.isArray(data)?data:[]);setError('')}catch(e){setError(String(e))}finally{setLoading(false)}}
useEffect(()=>{if(user&&section)load()},[user,page]);
useEffect(() => {
  if (!user || page === 'Lecciones') return;
  const controller = new AbortController();
  setReferenceIssue(false);
  for (const path of ['clients', 'projects', 'boards', 'materials']) {
    api(path, {signal: controller.signal})
      .then(data => { if (!controller.signal.aborted) setReferences(previous => ({...previous, [path]: data})); })
      .catch(() => { if (!controller.signal.aborted) setReferenceIssue(true); });
  }
  return () => controller.abort();
}, [user, page, referenceAttempt]);
async function login(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const data=new FormData(e.currentTarget);try{await api('login',{method:'POST',body:JSON.stringify(Object.fromEntries(data))});setUser(true);setError('')}catch(e){setError(String(e))}}
async function save(e:React.FormEvent){e.preventDefault();try{const body=Object.fromEntries(section.fields.map(([key,,type])=>[key,type==='number'?Number(form[key]):form[key]??(key==='status'?'pendiente':'')]));if(page==='Presupuestos') body.labor_cents=pesoCents(form.labor_cents);await api(section.path+(edit!==null?'/'+edit:''),{method:edit!==null?'PUT':'POST',body:JSON.stringify(body)});setForm({});setEdit(null);await load()}catch(e){setError(String(e))}}
async function remove(id:number){if(!window.confirm('¿Eliminar este registro?'))return;try{await api(section.path+'/'+id,{method:'DELETE'});await load()}catch(e){setError(String(e))}}
if(!user)return <main className="login"><h1>EmonPlan</h1><p>Gestión de instalaciones eléctricas</p><form onSubmit={login}><label>Usuario<input name="email" type="email" autoComplete="username" spellCheck={false} required/></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required/></label><button>Ingresar</button></form>{error&&<p role="alert">{error}</p>}</main>;
return <div className="layout"><aside><h1>⚡ EmonPlan</h1><nav aria-label="Principal"><button className={page==='Inicio'?'active':''} aria-current={page==='Inicio'?'page':undefined} onClick={()=>navigate('Inicio')}>Inicio</button>
<button className={focusedWorkPage?'active':''} aria-current={page==='Obras'?'page':undefined} onClick={()=>navigate('Obras')}>Obras</button>
{Object.keys(sections).map(x=><button key={x} className={page===x?'active':''} onClick={()=>navigate(x)}>{x}</button>)}<button className={page==='Planos'?'active':''} onClick={()=>setPage('Planos')}>Planos</button><button className={page==='Lecciones'?'active':''} aria-current={page==='Lecciones'?'page':undefined} onClick={()=>navigate('Lecciones')}>Lecciones</button></nav><button onClick={logout}>Cerrar sesión</button></aside><main><header>
<p>{page==='Lecciones'?'EMONPLAN / APRENDIZAJE':'EM ONPLAN / ESPACIO DE TRABAJO'}</p>
<h2 ref={workHeading} tabIndex={focusPageHeading?-1:undefined}>{page==='Obra'?currentWork?.name:page}</h2>
{page==='Obra'&&currentWork&&<dl className="work-meta">
  <div><dt>Cliente</dt><dd>{currentClient?.name ?? '—'}</dd></div>
  <div><dt>Estado</dt><dd>{workStatus(currentWork.status)}</dd></div>
</dl>}
</header>
{referenceIssue&&page!=='Lecciones'&&<div className="work-actions">
  <p role="alert">No pudimos cargar todos los datos.</p>
  <button onClick={()=>setReferenceAttempt(attempt=>attempt+1)}>Volver a cargar</button>
</div>}
{error&&page!=='Lecciones'&&<p role="alert" className="error">{error}</p>}{section?<><section className="card"><h3>{edit===null?'Nuevo registro':'Editar registro'}</h3><form className="fields" onSubmit={save}>{section.fields.map(([key,label,type])=><label key={key}>{label}{key==='status'?<select name={key} value={form[key]??'pendiente'} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="pendiente">Pendiente</option><option value="en ejecución">En ejecución</option><option value="finalizada">Finalizada</option></select>:key.endsWith('_id')?<select name={key} value={form[key]??''} required onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Seleccionar</option>{(references[({client_id:'clients',project_id:'projects',board_id:'boards',material_id:'materials'} as Record<string,string>)[key]]||[]).map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select>:<input name={key} inputMode={key==='labor_cents'?'decimal':undefined} placeholder={key==='labor_cents'?'Ej. 15.000,25':undefined} type={type||'text'} step={type==='number'?'any':undefined} value={form[key]??''} onChange={e=>setForm({...form,[key]:e.target.value})} required={key==='name'||key.endsWith('_id')}/>}</label>)}<div><button type="submit">{edit===null?'Guardar':'Actualizar'}</button>{edit!==null&&<button type="button" onClick={()=>{setEdit(null);setForm({})}}>Cancelar</button>}</div></form></section><section className="card"><h3>Registros</h3>{loading?<p>Cargando…</p>:rows.length===0?<p>No hay registros todavía.</p>:<div className="table"><table><thead><tr>{page!=='Presupuestos'&&<th>ID</th>}{columns.map(([key,label])=><th key={key}>{label}</th>)}<th>Acciones</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{page!=='Presupuestos'&&<td>{row.id}</td>}{columns.map(([key])=><td key={key}>{key==='total_cents'?pesos.format(row[key]/100):String(row[key]??'')}</td>)}<td>{page==='Proyectos'&&<button aria-label={'Abrir obra '+row.name} onClick={()=>openWork(row as Work)}>Abrir obra</button>}{page==='Proyectos'&&<button aria-label={'Esquemas de '+row.name} onClick={()=>{setSchemeProject(row);setPage('Esquemas')}}>Esquemas</button>}{page==='Proyectos'&&<button aria-label={'Ver unifilar de '+row.name} onClick={()=>{setUnifilarId(row.id);setPage('Unifilar')}}>Ver unifilar</button>}{page!=='Presupuestos'&&<><button onClick={()=>{setForm(row);setEdit(row.id)}}>Editar</button><button onClick={()=>remove(row.id)}>Eliminar</button></>}{page==='Presupuestos'&&<a href={'/api/quotations/'+row.id+'/pdf'} target="_blank">PDF</a>}</td></tr>)}</tbody></table></div>}</section></>:page==='Lecciones'?<Lessons onNavigate={navigate}/>:page==='Inicio'||page==='Obras'?<>
  <WorkList works={works} clients={clients} recent={page==='Inicio'} unavailable={referenceIssue} onCreate={()=>navigate('Nueva obra')} onOpen={openWork}/>
  {page==='Inicio'&&<>
    <section className="card">
      <h3>Capacitación en electricidad domiciliaria</h3>
      <p>Practicá conexiones, reconocé herramientas y repasá cómo relevar y diagnosticar una instalación.</p>
      <button onClick={()=>navigate('Lecciones')}>Abrir capacitación</button>
    </section>
    <Dashboard references={references}/>
  </>}
</>:page==='Nueva obra'?<NewWork api={api} clients={clients} onCreate={rememberCreatedWork} onCancel={()=>navigate('Obras')}/>
:page==='Obra'&&currentWork?<WorkBudget key={currentWork.id} api={api} work={currentWork} client={currentClient}/>
:page==='Planos'?<PlanImage projects={references.projects||[]}/>:page==='Esquemas'&&schemeProject?<SchemeEditor project={schemeProject.id} title={schemeProject.name} api={api} back={()=>setPage('Proyectos')}/>:<Unifilar project={unifilarId??0} onBack={()=>{setPage('Proyectos');setUnifilarId(null)}}/>}</main></div>}
function PlanImage({projects}:{projects:Row[]}){
 const [project,setProject]=useState(''),[revision,setRevision]=useState(0),[image,setImage]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 useEffect(()=>{
  setImage('');setError('');
  if(!project)return;
  const controller=new AbortController();let objectURL='';setLoading(true);
  fetch(`/api/projects/${project}/plan-image`,{credentials:'same-origin',signal:controller.signal,cache:'no-store'}).then(async r=>{
   if(controller.signal.aborted)return;
   if(r.status===404){setMessage('Este proyecto todavía no tiene plano.');return}
   if(!r.ok)throw new Error('No se pudo obtener el plano.');
   const blob=await r.blob();if(controller.signal.aborted)return;objectURL=URL.createObjectURL(blob);setImage(objectURL);
  }).catch(e=>{if(!controller.signal.aborted)setError(String(e))}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>{controller.abort();if(objectURL)URL.revokeObjectURL(objectURL)};
 },[project,revision]);
 async function upload(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;const input=form.elements.namedItem('plan') as HTMLInputElement;const file=input.files?.[0];
  if(!file)return;
  if(!['image/png','image/jpeg'].includes(file.type)||file.size>10*1024*1024){setError('Elegí una imagen PNG o JPEG de hasta 10 MiB.');input.focus();return}
  setBusy(true);setError('');setMessage('');
  try{const r=await fetch(`/api/projects/${project}/plan-image`,{method:'PUT',credentials:'same-origin',headers:{'Content-Type':file.type},body:file});if(!r.ok)throw new Error((await r.text())||'No se pudo guardar el plano.');form.reset();setMessage('Plano guardado.');setRevision(n=>n+1)}catch(e){setError(String(e))}finally{setBusy(false)}
 }
 return <section className="card"><h3>Plano del proyecto</h3><label htmlFor="plan-project">Proyecto</label><select id="plan-project" value={project} disabled={busy} onChange={e=>{setMessage('');setProject(e.target.value)}}><option value="">Seleccionar proyecto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}</select>{projects.length===0&&<p>Creá un proyecto para cargar su plano.</p>}{project&&<><form key={project} className="plan-form" onSubmit={upload}><label htmlFor="plan-file">Imagen del plano (obligatorio)</label><p id="plan-help">PNG o JPEG, hasta 10 MiB y 40 millones de píxeles. Al guardar se reemplaza el plano anterior.</p><input id="plan-file" name="plan" type="file" accept="image/png,image/jpeg" required aria-describedby="plan-help" onChange={()=>setError('')}/><button disabled={busy} type="submit">{busy?'Guardando…':'Guardar plano'}</button></form>{loading&&<p>Cargando plano…</p>}<p role="status">{message}</p>{error&&<p role="alert" className="error">{error}</p>}{image&&<figure><img className="plan-image" src={image} alt="Plano cargado del proyecto"/><figcaption>Plano guardado del proyecto.</figcaption></figure>}</>}</section>
}
function Dashboard({references}:{references:Record<string,Row[]>}){return <section className="card"><h3>Resumen</h3><p>Clientes: {references.clients?.length ?? '—'}</p><p>Proyectos: {references.projects?.length ?? '—'}</p><p>Tableros: {references.boards?.length ?? '—'}</p><p>Materiales: {references.materials?.length ?? '—'}</p></section>}
// Diagrama unifilar por obra: tableros a la izquierda, circuitos conectados a la derecha.
// Los nodos se identifican por ID de base de datos, aunque dos circuitos se llamen igual.
export const UNIFILAR_ROW=70;
const nodeTypes={unifilar:function Nodo({data}:any){return <div className={`unifilar-node unifilar-${data.kind}`} data-testid={data.testid}>{data.kind==='board'&&<Handle type="source" position={Position.Right}/>}{data.kind==='circuit'&&<Handle type="target" position={Position.Left}/>}{data.label}</div>}};
const edgeTypes={unifilar:function Arista({id,source,target,sourceX,sourceY,targetX,targetY}:any){const [path]=getBezierPath({sourceX,sourceY,targetX,targetY});return <path className="unifilar-edge" data-testid={`unifilar-edge-${id}`} data-source={source} data-target={target} d={path}/>}};
export function buildDiagram(data:Row){
 const nodes:any[]=[],edges:any[]=[];let y=0;
 for(const b of data.boards){
  nodes.push({id:`board-${b.id}`,type:'unifilar',position:{x:0,y},data:{kind:'board',label:b.name,testid:`unifilar-node-board-${b.id}`}});
  b.circuits.forEach((c:Row,i:number)=>{
   nodes.push({id:`circuit-${c.id}`,type:'unifilar',position:{x:300,y:y+i*UNIFILAR_ROW},data:{kind:'circuit',label:[c.identifier,c.description,c.protection].filter(Boolean).join(' · '),testid:`unifilar-node-circuit-${c.id}`}});
   edges.push({id:String(c.id),type:'unifilar',source:`board-${b.id}`,target:`circuit-${c.id}`});
  });
  if(b.circuits.length===0)nodes.push({id:`empty-${b.id}`,type:'unifilar',position:{x:300,y},data:{kind:'empty',label:'Sin circuitos',testid:`unifilar-node-empty-${b.id}`}});
  y+=Math.max(b.circuits.length,1)*UNIFILAR_ROW;
 }
 return {nodes,edges};
}
function Unifilar({project,onBack}:{project:number;onBack:()=>void}){
 const [data,setData]=useState<Row|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  setData(null);setError('');setLoading(true);
  // AbortController: la respuesta tardía de una obra nunca asoma en la siguiente (U2).
  const controller=new AbortController();
  api(`projects/${project}/unifilar`,{signal:controller.signal}).then(d=>{if(!controller.signal.aborted){setData(d);setLoading(false)}}).catch(e=>{if(!controller.signal.aborted){setError(String(e));setLoading(false)}});
  return ()=>controller.abort();
 },[project]);
 return <section className="card"><h3>{data?data.name:'Unifilar'}</h3>
  <button onClick={onBack}>Volver a Proyectos</button>
  <button onClick={()=>window.print()}>Imprimir o guardar como PDF</button>
  {loading&&<p>Cargando…</p>}
  {error&&<p role="alert" className="error">{error}</p>}
  {data&&(data.boards.length===0?<p>Esta obra todavía no tiene tableros.</p>:(()=>{
   const {nodes,edges}=buildDiagram(data);
   return <>
    <div className="unifilar-flow" data-testid="unifilar-diagram">
     <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView nodesDraggable={false} nodesConnectable={false}>
      <Background/><Controls/>
     </ReactFlow>
    </div>
    {/* Alternativa textual accesible del diagrama (guía: gráficos complejos con alternativa semántica). */}
    <ul className="visually-hidden" aria-label="Contenido del unifilar">{data.boards.map((b:Row)=><li key={b.id}><strong>{b.name}</strong>{b.circuits.length===0?' · Sin circuitos':''}<ul>{b.circuits.map((c:Row)=><li key={c.id}>{[c.identifier,c.description,c.protection].filter(Boolean).join(' · ')}</li>)}</ul></li>)}</ul>
   </>;
  })())}
 </section>;
}
const root = document.getElementById('root');
if(root) createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
