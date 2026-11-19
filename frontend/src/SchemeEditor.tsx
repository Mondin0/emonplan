import {useEffect,useState} from 'react';
import {ReactFlow,Handle,Controls,Position,Background,type NodeProps,type Node} from '@xyflow/react';
import {empty,example,pins,names,wireKinds,simulate,type Kind,type Drawing,type WireKind,type Part} from './wiring';
import './wiring.css';

type DeviceData={part:Part,title:string,pick:(pin:string)=>void,selected:string,toggle:()=>void};
function Device({data:{part,title,pick,selected,toggle}}:NodeProps<Node<DeviceData>>){
 return <div className="wire-device">
  <strong>{title}</strong>
  {pins[part.kind].map(pin=>{
   const endpoint=part.id+'.'+pin;
   return <div className="pin-row" key={pin}>
    <Handle type="target" id={'in-'+pin} position={Position.Left}/>
    <button className="nodrag" aria-pressed={selected===endpoint} aria-label={title+' borne '+pin} onClick={()=>pick(endpoint)}>{pin}</button>
    <Handle type="source" id={'out-'+pin} position={Position.Right}/>
   </div>;
  })}
  {(part.kind==='simple'||part.kind==='change')&&<button className="nodrag contact" aria-label={'Accionar '+title} onClick={toggle}>
   {part.kind==='change'?'C → '+(part.on?'2':'1'):part.on?'Cerrado':'Abierto'}
  </button>}
  {part.kind==='box'&&<small>Bornes unidos</small>}
 </div>;
}
const nodeTypes={device:Device};
const colors:Record<WireKind,string>={Fase:'#924014',Neutro:'#215a9a',Tierra:'#347047',Retorno:'#793f78',Viajero:'#4f5560'};
type Item={id:number,name:string};
type Props={project:number,title:string,api:(path:string,opts?:RequestInit)=>Promise<any>,back:()=>void};

export function SchemeEditor({project,title,api,back}:Props){
 const path='projects/'+project+'/schemes';
 const [items,setItems]=useState<Item[]>([]),[id,setId]=useState<number|null>(null);
 const [d,setD]=useState<Drawing|null>(null),[busy,setBusy]=useState(false),[status,message]=useState('');
 const [selectedNode,selectNode]=useState('');
 const [listing,setListing]=useState(true);
 const [first,selectPin]=useState(''),[kind,setKind]=useState<WireKind>('Fase'),[generation,resetView]=useState(0);
 useEffect(()=>{
  const c=new AbortController();
  api(path,{signal:c.signal}).then(list=>{if(!c.signal.aborted)setItems(list)}).catch(e=>{if(!c.signal.aborted)message(String(e))}).finally(()=>{if(!c.signal.aborted)setListing(false)});
  return ()=>c.abort();
 },[api,path]);
 function open(drawing:Drawing,nextId:number|null=null){
  setD(drawing);setId(nextId);selectNode('');selectPin('');message('');resetView(g=>g+1);
 }
 async function load(selected:number){
  setBusy(true);
  try{open(await api(path+'/'+selected),selected)}catch(e){message(String(e))}finally{setBusy(false)}
 }
 async function save(){
  if(!d)return;
  setBusy(true);
  try{
   const saved=await api(path+(id?'/'+id:''),{method:id?'PUT':'POST',body:JSON.stringify(d)});
   setId(saved.id);setItems(old=>[...old.filter(i=>i.id!==saved.id),{id:saved.id,name:d.name}]);
   message('Esquema guardado.');
  }catch(e){message(String(e))}finally{setBusy(false)}
 }
 function edit(next:Drawing){setD(next);message('')}
 function connect(pin:string){
  if(!d)return;
  if(!first){selectPin(pin);return}
  selectPin('');
  if(first===pin)return;
  if(d.wires.some(w=>[w.from,w.to].includes(first)&&[w.from,w.to].includes(pin))){message('Los bornes ya están conectados.');return}
  edit({...d,wires:[...d.wires,{from:first,to:pin,kind}]});
 }
 function add(type:Kind){
  if(!d)return;
  let n=1;while(d.parts.some(p=>p.id===type+n))n++;
  edit({...d,parts:[...d.parts,{kind:type,id:type+n,x:(d.parts.length%4)*205,y:Math.floor(d.parts.length/4)*245,on:false}]});
 }
 const labels:Record<string,string>={},counts:Partial<Record<Kind,number>>={};
 for(const p of d?.parts??[]){counts[p.kind]=(counts[p.kind]??0)+1;labels[p.id]=names[p.kind]+' '+counts[p.kind]}
 const endpoint=(pin:string)=>{const [id,terminal]=pin.split('.');return labels[id]+' · '+terminal};
 const state=simulate(d??empty());
 return <section className="card scheme">
  <button onClick={back}>Volver a Proyectos</button><h3>{title}</h3>
  <fieldset disabled={busy||listing}><legend>Esquemas de la obra</legend>
  <div className="wire-tools"><button onClick={()=>open(empty())}>Hoja en blanco</button>
   <button onClick={()=>open(example())}>Ejemplo de dos puntos</button>
   {items.map(s=><button key={s.id} onClick={()=>load(s.id)}>Abrir {s.name}</button>)}
  </div></fieldset>
  {d&&<fieldset disabled={busy}><legend>Editor de cableado</legend>
   <div className="wire-tools"><label>Nombre del esquema<input value={d.name} maxLength={100} onChange={e=>edit({...d,name:e.target.value})}/></label>
   <label>Tensión nominal (V)<input type="number" min="0" step="any" value={d.voltage??''} onChange={e=>edit({...d,voltage:e.target.value===''?null:e.target.valueAsNumber})}/></label>
   <button disabled={!d.name.trim()||(d.voltage!==null&&!(d.voltage>0))} onClick={save}>Guardar esquema</button></div>
   <h4>Componentes</h4><div className="wire-tools">{(Object.keys(names) as Kind[]).map(k=><button key={k} disabled={k==='source'&&d.parts.some(p=>p.kind===k)} onClick={()=>add(k)}>Agregar {names[k].toLowerCase()}</button>)}</div>
   <div className="wire-tools connect"><label>Tipo de cable<select value={kind} onChange={e=>setKind(e.target.value as WireKind)}>{wireKinds.map(k=><option key={k}>{k}</option>)}</select></label>
   <p aria-live="polite">{first?'Desde '+endpoint(first)+'. Seleccioná el otro borne.':'Seleccioná dos bornes para conectar un cable.'}</p>
   {first&&<button onClick={()=>selectPin('')}>Cancelar conexión</button>}</div>
   <div className="wiring-flow"><ReactFlow key={generation} nodeTypes={nodeTypes} fitView minZoom={0.2} nodesConnectable={false} deleteKeyCode={null}
    nodes={d.parts.map(part=>({id:part.id,type:'device',selected:selectedNode===part.id,position:{x:part.x,y:part.y},data:{part,title:labels[part.id],pick:connect,selected:first,toggle:()=>edit({...d,parts:d.parts.map(p=>p.id===part.id?{...p,on:!p.on}:p)})}}))}
    onNodesChange={changes=>{
     for(const c of changes)if(c.type==='select')selectNode(old=>c.selected?c.id:old===c.id?'':old);
     const moved=new Map(changes.flatMap(c=>c.type==='position'&&c.position?[[c.id,c.position] as const]:[]));
     if(moved.size)setD(old=>old&&({...old,parts:old.parts.map(p=>({...p,...moved.get(p.id)}))}));
    }}
    edges={d.wires.map((w,i)=>{const [source,a]=w.from.split('.'),[target,b]=w.to.split('.');return {id:w.from+'-'+w.to,source,target,sourceHandle:'out-'+a,targetHandle:'in-'+b,label:w.kind,animated:state.active.has(i),style:{stroke:colors[w.kind],strokeWidth:state.active.has(i)?4:2}}})}>
    <Background/><Controls showInteractive={false}/></ReactFlow></div>
   <h4>Simulación ideal</h4><div aria-live="polite">{d.voltage!==null&&!(d.voltage>0)?<p role="alert">Ingresá una tensión nominal mayor que cero.</p>:state.fault?<p role="alert">{state.fault} · simulación inválida</p>:Object.entries(state.lamps).map(([key,lamp])=><p key={key}>{labels[key]} · {lamp.on?'Encendida · camino cerrado':'Apagada · sin alimentación entre bornes'} · {lamp.volts!==null?lamp.volts+' V':lamp.on?'Ingresá la tensión nominal':'Tensión indeterminada'}</p>)}</div>
   <details><summary>Cables y componentes ({d.wires.length} cables)</summary>
    <ul>{d.wires.map((w,i)=><li key={w.from+'-'+w.to}>{w.kind} · {endpoint(w.from)} → {endpoint(w.to)} {state.active.has(i)&&' · Camino cerrado'} <button onClick={()=>edit({...d,wires:d.wires.filter((_,j)=>j!==i)})}>Quitar cable</button></li>)}</ul>
    {d.parts.map(p=><button key={p.id} onClick={()=>{selectPin('');edit({...d,parts:d.parts.filter(n=>n.id!==p.id),wires:d.wires.filter(w=>![w.from,w.to].some(pin=>pin.startsWith(p.id+'.')))})}}>Quitar {labels[p.id]}</button>)}
   </details></fieldset>}
  <p role="status">{status}</p></section>;
}
