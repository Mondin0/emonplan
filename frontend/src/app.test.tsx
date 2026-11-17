// @vitest-environment jsdom
import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,waitFor,cleanup,fireEvent,act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from './main';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
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
