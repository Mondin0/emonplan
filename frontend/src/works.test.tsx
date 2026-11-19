// @vitest-environment jsdom
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, expect, it, vi} from 'vitest';
import {App} from './main';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const response = (data: unknown) => ({ok: true, status: 200, json: async () => data});
const failure = {ok: false, status: 500, text: async () => 'error'};
const button = (name: string) => screen.getByRole('button', {name});

it('crea el cliente en la obra y permite reintentar el guardado sin duplicarlo', async () => {
  let workAttempts = 0;
  const fetcher = vi.fn(async (path: string, options?: RequestInit) => {
    if (options?.method !== 'POST') return response([]);
    if (path === '/api/clients') return response({id: 4});
    if (path === '/api/projects') return ++workAttempts === 1 ? failure : response({id: 7});
    return failure;
  });
  vi.stubGlobal('fetch', fetcher);
  const user = userEvent.setup();
  render(<App/>);

  await user.click(await screen.findByRole('button', {name: 'Nueva obra'}));
  await user.type(screen.getByLabelText('Nombre de la obra'), 'Casa de Martín');
  await user.click(button('Agregar cliente'));
  await user.type(screen.getByLabelText('Nombre del cliente'), 'Martín');
  await user.click(button('Guardar cliente'));
  await user.click(button('Guardar obra'));
  expect((await screen.findByRole('alert')).textContent).toContain('No pudimos guardar la obra');
  expect(screen.getByLabelText('Nombre de la obra')).toHaveProperty('value', 'Casa de Martín');
  expect(screen.getByLabelText('Cliente existente')).toHaveProperty('value', '4');
  await user.click(button('Guardar obra'));

  await screen.findByRole('heading', {name: 'Casa de Martín'});
  await screen.findByRole('heading', {name: 'Presupuesto'});
  expect(screen.getByText('Martín', {exact: true})).toBeTruthy();
  expect(screen.getByText('Pendiente', {exact: true})).toBeTruthy();
  const posts = fetcher.mock.calls.filter(([, options]) => options?.method === 'POST');
  expect(posts.map(([path]) => path)).toEqual(['/api/clients', '/api/projects', '/api/projects']);
  expect(JSON.parse(String(posts[2][1]?.body))).toEqual({name: 'Casa de Martín', client_id: 4});
});

it('aísla el presupuesto y conserva la descarga si falla la lectura tras generarlo', async () => {
  const work = {id: 7, name: 'Casa de Martín', status: 'pendiente', client_id: 4};
  let generated = false;
  const fetcher = vi.fn(async (path: string, options?: RequestInit) => {
    if (path === '/api/clients') return response([{id: 4, name: 'Martín'}]);
    if (path === '/api/projects') return response([work]);
    if (path === '/api/quotations') {
      if (options?.method === 'POST') {
        generated = true;
        return response({id: 42});
      }
      return generated ? failure : response([{id: 55, project_id: 8, project_name: 'Otra obra', version: 1, total_cents: 500}]);
    }
    return response([]);
  });
  vi.stubGlobal('fetch', fetcher);
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('bloqueado'));
  render(<App/>);

  await user.click(await screen.findByRole('button', {name: 'Casa de Martín'}));
  expect(await screen.findByText('Todavía no hay presupuestos para esta obra.')).toBeTruthy();
  await user.type(screen.getByLabelText('Mano de obra (pesos)'), '100,25');
  await user.click(button('Generar presupuesto'));
  expect((await screen.findByRole('link', {name: 'Descargar PDF'})).getAttribute('href')).toBe('/api/quotations/42/pdf');
  expect(screen.queryByText('Otra obra')).toBeNull();
  await user.click(button('Copiar mensaje para WhatsApp'));
  expect(await screen.findByText('Seleccioná el mensaje y copialo manualmente.')).toBeTruthy();
  expect(screen.getByLabelText('Mensaje para WhatsApp')).toHaveProperty('value', expect.stringContaining('Casa de Martín'));
  const posts = fetcher.mock.calls.filter(([, options]) => options?.method === 'POST');
  expect(posts).toHaveLength(1);
  expect(JSON.parse(String(posts[0][1]?.body))).toEqual({project_id: 7, labor_cents: 10025});
});

it('guarda el proveedor y reintenta asociar el material sin duplicar su alta', async () => {
  let attempts = 0;
  let linked = false;
  const fetcher = vi.fn(async (path: string, options?: RequestInit) => {
    if (path === '/api/clients') return response([{id: 4, name: 'Martín'}]);
    if (path === '/api/projects') return response([{id: 7, name: 'Casa de Martín', status: 'pendiente', client_id: 4}]);
    if (path === '/api/materials' && options?.method === 'POST') return response({id: 9});
    if (path === '/api/quotations' && options?.method === 'POST') return response({id: 42});
    if (path === '/api/project-materials') {
      if (options?.method !== 'POST') return response(linked ? [{id: 3, project_id: 7, material_id: 9, quantity: 2}] : []);
      if (++attempts === 1) return failure;
      linked = true;
      return response({id: 3});
    }
    return response([]);
  });
  vi.stubGlobal('fetch', fetcher);
  const user = userEvent.setup();
  render(<App/>);

  await user.click(await screen.findByRole('button', {name: 'Casa de Martín'}));
  await user.click(await screen.findByRole('button', {name: 'Generar presupuesto'}));
  expect((await screen.findByRole('alert')).textContent).toContain('o agregá un material');
  await user.click(await screen.findByRole('button', {name: 'Agregar material'}));
  await user.click(button('Nuevo material de catálogo'));
  await user.type(screen.getByLabelText('Nombre del material'), 'Cable');
  await user.type(screen.getByLabelText('Unidad'), 'm');
  await user.type(screen.getByLabelText('Precio por unidad (pesos)'), '125,00');
  await user.type(screen.getByLabelText('Proveedor (opcional)'), 'Electricidad Centro');
  await user.type(screen.getByLabelText('Cantidad'), '2');
  await user.click(button('Guardar material'));
  expect((await screen.findByRole('alert')).textContent).toContain('El material quedó guardado en el catálogo');
  await user.click(button('Guardar material'));
  await waitFor(() => expect(fetcher.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(3));
  const posts = fetcher.mock.calls.filter(([, options]) => options?.method === 'POST');
  expect(posts.map(([path, options]) => [path, JSON.parse(String(options?.body))])).toEqual([
    ['/api/materials', {name: 'Cable', unit: 'm', price_cents: 12500, supplier: 'Electricidad Centro'}],
    ['/api/project-materials', {project_id: 7, material_id: 9, quantity: 2}],
    ['/api/project-materials', {project_id: 7, material_id: 9, quantity: 2}],
  ]);
  expect(await screen.findByText('Electricidad Centro')).toBeTruthy();
  await user.click(button('Generar presupuesto'));
  await screen.findByRole('link', {name: 'Descargar PDF'});
  expect(fetcher.mock.calls.find(([path, options]) => path === '/api/quotations' && options?.method === 'POST')?.[1]?.body)
    .toBe(JSON.stringify({project_id: 7, labor_cents: 0}));
});
