// @vitest-environment jsdom
import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,waitFor,cleanup,fireEvent,act,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App,buildDiagram,UNIFILAR_ROW} from './main';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
// ReactFlow mide los nodos con ResizeObserver; jsdom no lo implementa.
if(!('ResizeObserver' in globalThis)){class ResizeObserverStub{observe(){}unobserve(){}disconnect(){}}(globalThis as unknown as {ResizeObserver:unknown}).ResizeObserver=ResizeObserverStub;}
describe('acceso',()=>{it('envía credenciales y abre el resumen',async()=>{const fetcher=vi.fn().mockResolvedValueOnce({ok:false,status:401,text:async()=>''}).mockResolvedValueOnce({ok:true,status:204}).mockImplementation(async()=>({ok:true,status:200,json:async()=>[]}));vi.stubGlobal('fetch',fetcher);render(<App/>);await userEvent.type(screen.getByLabelText('Usuario'),'test@example.com');await userEvent.type(screen.getByLabelText('Contraseña'),'clave-segura');await userEvent.click(screen.getByRole('button',{name:'Ingresar'}));await waitFor(()=>expect(screen.getByText('Resumen')).toBeTruthy());expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({email:'test@example.com',password:'clave-segura'});});});

describe('planos',()=>{it('carga un archivo para el proyecto y muestra el plano guardado',async()=>{
 let saved=false;
 const fetcher=vi.fn(async (path:string,options?:RequestInit)=>{
  if(path==='/api/projects')return {ok:true,status:200,json:async()=>[{id:7,name:'Casa'}]};
  if(path==='/api/projects/7/plan-image'){
   if(options?.method==='PUT'){saved=true;return {ok:true,status:204}}
   return saved?{ok:true,status:200,blob:async()=>new Blob(['plano'],{type:'image/png'})}:{ok:false,status:404};
  }
  return {ok:true,status:200,json:async()=>[]};
 });
 vi.stubGlobal('fetch',fetcher);vi.stubGlobal('URL',{createObjectURL:vi.fn(()=> 'blob:plano'),revokeObjectURL:vi.fn()});render(<App/>);
 await userEvent.click(await screen.findByRole('button',{name:'Planos'}));
 await userEvent.selectOptions(screen.getByLabelText('Proyecto'),'7');
 await screen.findByText('Este proyecto todavía no tiene plano.');
 const file=new File(['png'],'plano.png',{type:'image/png'});
 const input=screen.getByLabelText('Imagen del plano (obligatorio)');await userEvent.upload(input,file);
 fireEvent.submit(input.closest('form')!);
 await waitFor(()=>expect(fetcher.mock.calls.some(([path,options])=>path==='/api/projects/7/plan-image'&&options?.method==='PUT'&&options.body===file)).toBe(true));
 expect(await screen.findByAltText('Plano cargado del proyecto')).toHaveProperty('src','blob:plano');
 expect(screen.getByText('Plano guardado.')).toBeTruthy();
 });});

it('conserva el plano y muestra el error si falla el reemplazo',async()=>{
 const fetcher=vi.fn(async (path:string,options?:RequestInit)=>{
  if(path==='/api/projects')return {ok:true,status:200,json:async()=>[{id:7,name:'Casa'}]};
  if(path==='/api/projects/7/plan-image')return options?.method==='PUT'?{ok:false,status:400,text:async()=>'Imagen inválida'}:{ok:true,status:200,blob:async()=>new Blob(['plano'])};
  return {ok:true,status:200,json:async()=>[]};
 });
 vi.stubGlobal('fetch',fetcher);vi.stubGlobal('URL',{createObjectURL:vi.fn(()=> 'blob:original'),revokeObjectURL:vi.fn()});render(<App/>);
 await userEvent.click(await screen.findByRole('button',{name:'Planos'}));
 await userEvent.selectOptions(screen.getByLabelText('Proyecto'),'7');
 await screen.findByAltText('Plano cargado del proyecto');
 const input=screen.getByLabelText('Imagen del plano (obligatorio)');
 await userEvent.upload(input,new File(['bad'],'plano.png',{type:'image/png'}));
 fireEvent.submit(input.closest('form')!);
 expect((await screen.findByRole('alert')).textContent).toContain('Imagen inválida');
 expect(screen.getByAltText('Plano cargado del proyecto')).toHaveProperty('src','blob:original');
});

it('descarta el archivo y respuestas pendientes al cambiar de proyecto',async()=>{
 let finishFirst!:(value:unknown)=>void;
 const first=new Promise(resolve=>{finishFirst=resolve});
 const fetcher=vi.fn(async (path:string)=>{
  if(path==='/api/projects')return {ok:true,status:200,json:async()=>[{id:7,name:'Casa'},{id:8,name:'Obra'}]};
  if(path==='/api/projects/7/plan-image')return first;
  if(path==='/api/projects/8/plan-image')return {ok:true,status:200,blob:async()=>new Blob(['plano'])};
  return {ok:true,status:200,json:async()=>[]};
 });
 vi.stubGlobal('fetch',fetcher);vi.stubGlobal('URL',{createObjectURL:vi.fn(()=> 'blob:obra'),revokeObjectURL:vi.fn()});render(<App/>);
 await userEvent.click(await screen.findByRole('button',{name:'Planos'}));
 await userEvent.selectOptions(screen.getByLabelText('Proyecto'),'7');
 await userEvent.upload(screen.getByLabelText('Imagen del plano (obligatorio)'),new File(['png'],'plano.png',{type:'image/png'}));
 await userEvent.selectOptions(screen.getByLabelText('Proyecto'),'8');
 expect((screen.getByLabelText('Imagen del plano (obligatorio)') as HTMLInputElement).files).toHaveLength(0);
 await screen.findByAltText('Plano cargado del proyecto');
 await act(async()=>{finishFirst({ok:false,status:404});await first});
 expect(screen.getByRole('status').textContent).not.toContain('todavía no tiene plano');
});

describe('unifilar por obra',()=>{
 function proyectosFetcher(handlers:Record<string,(options?:RequestInit)=>Promise<any>>){
  return vi.fn(async (path:string,options?:RequestInit)=>{
   const handler=handlers[path];
   if(handler)return handler(options);
   return {ok:true,status:200,json:async()=>[]};
  });
 }
 const tallerSur={id:7,name:'Taller Sur',boards:[
  {id:1,name:'Tablero de máquinas',circuits:[{id:2,identifier:'C1',description:'Torno',protection:'10 A'}]},
  {id:3,name:'Tablero de reserva',circuits:[]}]};
 const obras=[{id:7,name:'Taller Sur'},{id:8,name:'Proyecto de ejemplo'},{id:9,name:'Obra vacía'},{id:10,name:'Obra en montaje'}];
 // Alternativa textual del diagrama: la lista oculta lleva nombre propio para consultarla sin ambigüedad.
 const lista=()=>screen.getByRole('list',{name:'Contenido del unifilar'});

 async function abrir(screen_:typeof screen,nombre:string){
  await userEvent.click(await screen_.findByRole('button',{name:'Proyectos'}));
  const row=screen_.getByRole('row',{name:new RegExp(nombre)});
  await userEvent.click(within(row).getByRole('button',{name:/Ver unifilar/}));
 }

 // U1: el menú general ya no tiene «Unifilar»; cada fila abre su propia obra y se puede volver.
 it('abre el unifilar desde la fila de Proyectos y vuelve al listado',async()=>{
  vi.stubGlobal('fetch',proyectosFetcher({'/api/projects':async()=>({ok:true,status:200,json:async()=>obras}),
   '/api/projects/7/unifilar':async()=>({ok:true,status:200,json:async()=>tallerSur})}));
  render(<App/>);
  await userEvent.click(await screen.findByRole('button',{name:'Proyectos'}));
  await screen.findByRole('row',{name:/Taller Sur/});
  expect(screen.queryByRole('button',{name:'Unifilar'})).toBeNull();
  await abrir(screen,'Taller Sur');
  expect(await screen.findByRole('heading',{name:'Taller Sur'})).toBeTruthy();
  expect(within(lista()).getByText('C1 · Torno · 10 A')).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Volver a Proyectos'}));
  expect(screen.getByRole('heading',{name:'Proyectos',level:2})).toBeTruthy();
  expect(screen.queryByRole('heading',{name:'Taller Sur'})).toBeNull();
 });

 // U3: cada circuito cuelga de su tablero y los tableros sin circuitos lo avisan.
 it('conecta los circuitos con su tablero y marca los vacíos',async()=>{
  vi.stubGlobal('fetch',proyectosFetcher({'/api/projects':async()=>({ok:true,status:200,json:async()=>obras}),
   '/api/projects/7/unifilar':async()=>({ok:true,status:200,json:async()=>tallerSur}),
   '/api/projects/10/unifilar':async()=>({ok:true,status:200,json:async()=>({id:10,name:'Obra en montaje',boards:[{id:4,name:'Tablero de montaje',circuits:[]}]})})}));
  render(<App/>);
  await abrir(screen,'Taller Sur');
  await screen.findByRole('heading',{name:'Taller Sur'});
  // U3: cada circuito cuelga de su tablero en la lista y en el diagrama, con protección aunque haya descripción.
  const maquinas=within(lista()).getByText('Tablero de máquinas').closest('li')!;
  expect(within(maquinas).getByText('C1 · Torno · 10 A')).toBeTruthy();
  const reserva=within(lista()).getByText('Tablero de reserva').closest('li')!;
  expect(within(reserva).getByText(/Sin circuitos/)).toBeTruthy();
  expect(within(reserva).queryByText('C1 · Torno · 10 A')).toBeNull();
  // Nodos del diagrama identificados por ID de base de datos, no por texto visible.
  expect(screen.getByTestId('unifilar-node-board-1').textContent).toBe('Tablero de máquinas');
  expect(screen.getByTestId('unifilar-node-circuit-2').textContent).toBe('C1 · Torno · 10 A');
  expect(screen.getByTestId('unifilar-node-empty-3').textContent).toBe('Sin circuitos');
  expect(document.querySelector('.react-flow__controls')).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Volver a Proyectos'}));
  await abrir(screen,'Obra en montaje');
  expect(await screen.findByRole('heading',{name:'Obra en montaje'})).toBeTruthy();
  const montaje=within(lista()).getByText('Tablero de montaje').closest('li')!;
  expect(within(montaje).getByText(/Sin circuitos/)).toBeTruthy();
  expect(screen.getByTestId('unifilar-node-empty-4').textContent).toBe('Sin circuitos');
 });

 // U4: obra sin tableros muestra el nombre, el aviso y la acción para volver.
 it('muestra el aviso de obra sin tableros',async()=>{
  vi.stubGlobal('fetch',proyectosFetcher({'/api/projects':async()=>({ok:true,status:200,json:async()=>obras}),
   '/api/projects/9/unifilar':async()=>({ok:true,status:200,json:async()=>({id:9,name:'Obra vacía',boards:[]})})}));
  render(<App/>);
  await abrir(screen,'Obra vacía');
  expect(await screen.findByRole('heading',{name:'Obra vacía'})).toBeTruthy();
  expect(screen.getByText('Esta obra todavía no tiene tableros.')).toBeTruthy();
  expect(screen.getByRole('button',{name:'Volver a Proyectos'})).toBeTruthy();
 });

 // U2: la respuesta tardía de una obra nunca asoma en la siguiente.
 it('descarta la respuesta tardía de la obra anterior',async()=>{
  let release!:(value:unknown)=>void;
  const first=new Promise(resolve=>{release=resolve});
  vi.stubGlobal('fetch',proyectosFetcher({'/api/projects':async()=>({ok:true,status:200,json:async()=>obras}),
   '/api/projects/7/unifilar':async()=>{await first;return {ok:true,status:200,json:async()=>tallerSur}},
   '/api/projects/9/unifilar':async()=>({ok:true,status:200,json:async()=>({id:9,name:'Obra vacía',boards:[]})})}));
  render(<App/>);
  await abrir(screen,'Taller Sur');
  await userEvent.click(screen.getByRole('button',{name:'Volver a Proyectos'}));
  await abrir(screen,'Obra vacía');
  expect(await screen.findByText('Esta obra todavía no tiene tableros.')).toBeTruthy();
  await act(async()=>{release({ok:true,status:200,json:async()=>tallerSur});await first});
  expect(screen.getByText('Esta obra todavía no tiene tableros.')).toBeTruthy();
  expect(screen.queryByRole('list',{name:'Contenido del unifilar'})).toBeNull();
  expect(screen.queryByTestId('unifilar-node-circuit-2')).toBeNull();
  expect(screen.queryByRole('heading',{name:'Taller Sur'})).toBeNull();
 });

 // U5: un fallo de lectura muestra un error, no el mensaje de obra vacía, y permite volver.
 it('muestra el error al fallar la lectura y permite volver sin datos viejos',async()=>{
  vi.stubGlobal('fetch',proyectosFetcher({'/api/projects':async()=>({ok:true,status:200,json:async()=>obras}),
   '/api/projects/7/unifilar':async()=>({ok:false,status:500,text:async()=>'database error'})}));
  render(<App/>);
  await abrir(screen,'Taller Sur');
  expect((await screen.findByRole('alert')).textContent).toContain('database error');
  expect(screen.queryByText('Esta obra todavía no tiene tableros.')).toBeNull();
  expect(screen.queryByRole('list',{name:'Contenido del unifilar'})).toBeNull();
  expect(screen.queryByTestId('unifilar-node-circuit-2')).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Volver a Proyectos'}));
  expect(screen.getByRole('heading',{name:'Proyectos',level:2})).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
 });

 // U3: el diagrama usa IDs de base de datos y reparte los circuitos sin superponerlos,
 // aunque dos circuitos tengan el mismo identificador visible.
 it('construye el diagrama con IDs propios y distribución ordenada',()=>{
  const {nodes,edges}=buildDiagram({id:7,name:'Taller Sur',boards:[
   {id:1,name:'Tablero de máquinas',circuits:[
    {id:2,identifier:'C1',description:'Torno',protection:'10 A'},
    {id:5,identifier:'C2',description:'Fresa',protection:''},
    {id:6,identifier:'C1',description:'Prensa',protection:'15 A'}]},
   {id:3,name:'Tablero de reserva',circuits:[]}]});
  expect(nodes.map(n=>n.id)).toEqual(['board-1','circuit-2','circuit-5','circuit-6','board-3','empty-3']);
  expect(nodes.map(n=>n.data.testid)).toEqual([
   'unifilar-node-board-1','unifilar-node-circuit-2','unifilar-node-circuit-5','unifilar-node-circuit-6',
   'unifilar-node-board-3','unifilar-node-empty-3']);
  expect(nodes[0].position).toEqual({x:0,y:0});
  expect(nodes[1].position).toEqual({x:300,y:0});
  expect(nodes[2].position).toEqual({x:300,y:UNIFILAR_ROW});
  expect(nodes[3].position).toEqual({x:300,y:2*UNIFILAR_ROW});
  expect(nodes[4].position).toEqual({x:0,y:3*UNIFILAR_ROW});
  expect(nodes[5].position).toEqual({x:300,y:3*UNIFILAR_ROW});
  expect(edges).toEqual([
   {id:'2',type:'unifilar',source:'board-1',target:'circuit-2'},
   {id:'5',type:'unifilar',source:'board-1',target:'circuit-5'},
   {id:'6',type:'unifilar',source:'board-1',target:'circuit-6'}]);
 });

 // Impresión/PDF recuperada: el botón dispara la impresión del navegador.
 it('permite imprimir o guardar el unifilar como PDF',async()=>{
  vi.stubGlobal('print',vi.fn());
  vi.stubGlobal('fetch',proyectosFetcher({'/api/projects':async()=>({ok:true,status:200,json:async()=>obras}),
   '/api/projects/7/unifilar':async()=>({ok:true,status:200,json:async()=>tallerSur})}));
  render(<App/>);
  await abrir(screen,'Taller Sur');
  await screen.findByTestId('unifilar-diagram');
  await userEvent.click(screen.getByRole('button',{name:'Imprimir o guardar como PDF'}));
  expect(window.print).toHaveBeenCalledTimes(1);
 });
});

it('abre el editor de la obra y permite probar una conmutación',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(path:string)=>({ok:true,json:async()=>path==='/api/projects'?[{id:7,name:'Casa'}]:[]})));
 render(<App/>);
 await userEvent.click(await screen.findByRole('button',{name:'Proyectos'}));
 await userEvent.click(await screen.findByRole('button',{name:'Esquemas de Casa'}));
 await userEvent.click(screen.getByRole('button',{name:'Ejemplo de dos puntos'}));
 expect(screen.getByText(/Lámpara 1 · Encendida/)).toBeTruthy();
 await userEvent.click(screen.getByLabelText('Accionar Conmutador 1'));
 expect(screen.getByText(/Lámpara 1 · Apagada/)).toBeTruthy();
});

it('carga pesos y muestra la obra, versión y total emitidos', async () => {
 const fetcher = vi.fn(async (path:string, options?:RequestInit) => {
  const data = path === '/api/projects' ? [{id:7,name:'Casa actual'}] :
   path === '/api/quotations' ? [{id:3,project_name:'Casa original',version:2,total_cents:1750025}] : [];
  return {ok:true,status:200,json:async()=>data};
 });
 vi.stubGlobal('fetch',fetcher);
 render(<App/>);
 await userEvent.click(await screen.findByRole('button',{name:'Presupuestos'}));
 const input = screen.getByLabelText('Mano de obra (pesos)');
 await userEvent.selectOptions(screen.getByLabelText('Obra del presupuesto'),'7');
 await userEvent.type(input,'15000,259');
 await userEvent.click(screen.getByRole('button',{name:'Guardar'}));
 expect(screen.getByRole('alert').textContent).toContain('15.000,25');
 expect(fetcher.mock.calls.some(([,opts])=>opts?.method==='POST')).toBe(false);
 await userEvent.clear(input);
 await userEvent.type(input,'15.000,25');
 await userEvent.click(screen.getByRole('button',{name:'Guardar'}));
 expect(fetcher.mock.calls.find(([path,opts])=>path==='/api/quotations' && opts?.method==='POST')?.[1]?.body)
  .toBe(JSON.stringify({project_id:7,labor_cents:1500025}));
 const row = (await screen.findByText('Casa original')).closest('tr')!;
 expect(within(row).getByText('2')).toBeTruthy();
 expect(within(row).getByText(/\$\s*17\.500,25/)).toBeTruthy();
 expect(within(row).getByRole('link',{name:'PDF'}).getAttribute('href')).toBe('/api/quotations/3/pdf');
});
