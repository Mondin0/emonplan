export const pins={source:['L','N','PE'],lamp:['L','N','PE'],simple:['C','1'],change:['C','1','2'],box:['J1','J2','J3']} as const;
export type Kind=keyof typeof pins;
export const names:Record<Kind,string>={source:'Alimentación',lamp:'Lámpara',simple:'Interruptor simple',change:'Conmutador',box:'Caja de paso'};
export const wireKinds=['Fase','Neutro','Tierra','Retorno','Viajero'] as const;
export type WireKind=typeof wireKinds[number];
export type Part={id:string,kind:Kind,x:number,y:number,on:boolean};
export type Wire={from:string,to:string,kind:WireKind};
export type Drawing={name:string,voltage:number|null,parts:Part[],wires:Wire[]};
export const empty=():Drawing=>({name:'',voltage:null,parts:[],wires:[]});
export function example():Drawing{
 const part=(id:string,kind:Kind,x:number,y:number):Part=>({id,kind,x,y,on:false});
 return {name:'Luz de escalera',voltage:null,parts:[part('src','source',0,0),part('s1','change',220,-90),part('s2','change',445,-90),part('lamp','lamp',665,0)],wires:[
 {from:'src.L',to:'s1.C',kind:'Fase'},{from:'s1.1',to:'s2.1',kind:'Viajero'},{from:'s1.2',to:'s2.2',kind:'Viajero'},{from:'s2.C',to:'lamp.L',kind:'Retorno'},{from:'src.N',to:'lamp.N',kind:'Neutro'},{from:'src.PE',to:'lamp.PE',kind:'Tierra'}]};
}
// Ideal conductors and closed contacts share potential. Lamps are loads, never bridges.
export function simulate(d:Drawing){
 const graph=new Map<string,{pin:string,wire?:number}[]>();
 function join(a:string,b:string,wire?:number){
  for(const [from,pin] of [[a,b],[b,a]]){
   if(!graph.has(from))graph.set(from,[]);
   graph.get(from)!.push({pin,wire});
  }
 }
 d.wires.forEach((w,i)=>join(w.from,w.to,i));
 for(const p of d.parts){
  const contact=(a:string,b:string)=>join(p.id+'.'+a,p.id+'.'+b);
  if(p.kind==='change')contact('C',p.on?'2':'1');
  if(p.kind==='simple'&&p.on)contact('C','1');
  if(p.kind==='box'){contact('J1','J2');contact('J2','J3')}
 }
 const src=d.parts.find(p=>p.kind==='source');
 function trace(pin:string){
  const parents=new Map<string,{prev:string,wire?:number}>();
  if(!src)return parents;
  const start=src.id+'.'+pin;
  parents.set(start,{prev:''});
  const queue=[start];
  for(const current of queue)for(const next of graph.get(current)??[]){
   if(parents.has(next.pin))continue;
   parents.set(next.pin,{prev:current,wire:next.wire});queue.push(next.pin);
  }
  return parents;
 }
 const phase=trace('L'),neutral=trace('N');
 const fault=phase.has(src?.id+'.N')?'Cortocircuito fase–neutro':phase.has(src?.id+'.PE')?'Fase conectada a tierra':'';
 const active=new Set<number>();
 const lamps:Record<string,{on:boolean,volts:number|null}>={};
 for(const p of d.parts.filter(p=>p.kind==='lamp')){
  const ends=['L','N'].map(k=>p.id+'.'+k);
  const paths=ends.map(pin=>phase.has(pin)?phase:neutral.has(pin)?neutral:undefined);
  const known=!fault&&paths.every(Boolean);
  const on=known&&paths[0]!==paths[1];
  lamps[p.id]={on,volts:known?(on?d.voltage:0):null};
  if(on)ends.forEach((pin,i)=>{
   while(pin){const step=paths[i]!.get(pin)!;if(step.wire!==undefined)active.add(step.wire);pin=step.prev}
  });
 }
 return {lamps,fault,active};
}
