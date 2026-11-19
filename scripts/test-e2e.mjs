import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chromium } from '../frontend/node_modules/playwright/index.mjs';

let base = process.env.E2E_URL;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => { window.__prints = 0; window.print = () => { window.__prints += 1; }; });
  await page.goto(base);
  await page.getByLabel('Usuario').fill(process.env.OWNER_EMAIL);
  await page.getByLabel('Contraseña').fill(process.env.OWNER_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.getByRole('heading', { name: 'Resumen' }).waitFor();

  // Datos de ejemplo (U1-U6): carga repetible dentro de la base del entorno aislado.
  const sql = input => execFileSync('docker', ['compose', '-f', 'compose.yaml', '--env-file', '/dev/null', 'exec', '-T', 'db',
    'psql', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'emonplan', '-d', 'emonplan'],
    { input, encoding: 'utf8' }).trim();
  assert.equal(sql("SELECT to_regclass('example_seeds') IS NOT NULL"), 't', 'Las migraciones deben preparar el registro de seeds');
  // Exercise the upgrade from the original name-only registry without touching the installed schema.
  const migration = readFileSync('backend/migrations/005_example_seeds.sql', 'utf8');
  const legacy = sql(`BEGIN;
    CREATE SCHEMA legacy_seed_test;
    SET LOCAL search_path TO legacy_seed_test, public;
    CREATE TABLE example_seeds(name text PRIMARY KEY);
    INSERT INTO example_seeds VALUES ('v1');
    ${migration}
    SELECT name FROM example_seeds WHERE client_id IS NULL;
    ROLLBACK;`);
  assert.ok(legacy.split('\n').includes('v1'), 'La actualización debe conservar las marcas anteriores');
  const seedExamples = () => sql(readFileSync('scripts/ejemplos.sql'));
  seedExamples();
  assert.equal(sql("SELECT count(*) FROM activities WHERE description='Visita de ejemplo'"), '1');
  sql("UPDATE projects SET description='Edición local' WHERE name='Proyecto de ejemplo'; DELETE FROM activities WHERE description='Visita de ejemplo' RETURNING id");
  seedExamples();
  assert.equal(sql("SELECT count(*) FROM projects WHERE description='Edición local'"), '1');
  assert.equal(sql("SELECT count(*) FROM activities WHERE description='Visita de ejemplo'"), '0');

  async function create(section, values) {
    await page.getByRole('button', { name: section, exact: true }).click();
    for (const [label, value] of Object.entries(values)) {
      const field = page.getByLabel(label);
      if (await field.evaluate(element => element.tagName === 'SELECT')) {
        await field.locator('option').filter({ hasText: value }).waitFor({ state: 'attached' });
        await field.selectOption({ label: value });
      } else {
        await field.fill(value);
      }
    }
    const response = page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/api/'));
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    const result = await response;
    assert.equal(result.status(), 200, `${section}: ${await result.text()}`);
    return (await result.json()).id;
  }

  await create('Clientes', { Nombre: 'Cliente E2E' });
  const project = await create('Proyectos', { Nombre: 'Proyecto E2E', 'ID de cliente': 'Cliente E2E' });
  const boardE2E = await create('Tableros', { 'ID de proyecto': 'Proyecto E2E', Nombre: 'Tablero E2E' });
  const circuitE2E = await create('Circuitos', { 'ID de tablero': 'Tablero E2E', Identificador: 'C1', 'Potencia (W)': '100', 'Tensión (V)': '220', Protección: '10 A', 'Sección (mm²)': '2.5', 'Longitud (m)': '5' });
  // Unifilar por obra (U1-U5).
  await page.getByRole('button', { name: 'Proyectos', exact: true }).click();
  // U1: el menú general ya no tiene el acceso unificado.
  assert.equal(await page.getByRole('button', { name: 'Unifilar', exact: true }).count(), 0);

  const apiGet = async path => (await (await page.request.get(`${base}/api/${path}`)).json());
  const demoWorks = (await apiGet('projects')).filter(p => p.name.startsWith('[Demo cableado]'));
  assert.equal(demoWorks.length, 20);
  for (const work of demoWorks) {
    const schemes = await apiGet('projects/'+work.id+'/schemes');
    assert.equal(schemes.length, 4);
  }
  const demoSchemes = await apiGet('projects/'+demoWorks[0].id+'/schemes');
  assert.equal(demoSchemes.length, 4);
  for (const item of demoSchemes) {
    const drawing = await apiGet('projects/'+demoWorks[0].id+'/schemes/'+item.id);
    assert.ok(drawing.parts.length >= 3 && drawing.wires.length >= 4);
  }
  // Nodos y aristas esperados, derivados de la API: cada obra expone exactamente sus propios nodos,
  // identificados por ID de base de datos (sin ambigüedad con texto accesible duplicado).
  const nodosEsperados = u => u.boards.flatMap(b => [
    `unifilar-node-board-${b.id}`,
    ...b.circuits.map(c => `unifilar-node-circuit-${c.id}`),
    ...(b.circuits.length ? [] : [`unifilar-node-empty-${b.id}`]),
  ]).sort();
  const aristasEsperadas = u => u.boards.flatMap(b => b.circuits.map(c => ({
    testid: `unifilar-edge-${c.id}`, source: `board-${b.id}`, target: `circuit-${c.id}`,
  })));
  const nodosVisibles = async () => (await page.locator('[data-testid^="unifilar-node-"]')
    .evaluateAll(els => els.map(e => e.getAttribute('data-testid') ?? ''))).sort();
  const aristasVisibles = async () => (await page.locator('[data-testid^="unifilar-edge-"]')
    .evaluateAll(els => els.map(e => ({ testid: e.getAttribute('data-testid') ?? '', source: e.getAttribute('data-source') ?? '', target: e.getAttribute('data-target') ?? '' }))))
    .sort((a, b) => a.testid.localeCompare(b.testid));
  async function verificarDiagrama(obra) {
    const u = await apiGet(`projects/${obra.id}/unifilar`);
    // Los nodos y aristas aparecen recién cuando ReactFlow mide los nodos: esperar antes de comparar.
    await page.getByTestId(`unifilar-node-board-${u.boards[0].id}`).waitFor();
    const aristasEsperadasDeObra = aristasEsperadas(u);
    if (aristasEsperadasDeObra.length) {
      await page.getByTestId(aristasEsperadasDeObra[0].testid).waitFor();
    }
    assert.deepEqual(await nodosVisibles(), nodosEsperados(u), `nodos propios de ${obra.name}`);
    assert.deepEqual(await aristasVisibles(), aristasEsperadasDeObra.sort((a, b) => a.testid.localeCompare(b.testid)), `aristas de ${obra.name}`);
    return u;
  }
  const circuitosDe = u => u.boards.flatMap(b => b.circuits.map(c => ({ ...c, board: b.name })));
  async function verUnifilar(obra) {
    const boton = page.getByRole('row', { name: new RegExp(obra) }).getByRole('button', { name: /Ver unifilar/ });
    await boton.waitFor();
    await boton.focus();
    await page.keyboard.press('Enter'); // U1: apertura con el teclado.
  }
  const volver = page.getByRole('button', { name: 'Volver a Proyectos' });
  const taller = (await apiGet('projects')).find(p => p.name === 'Taller Sur');
  await verUnifilar('Taller Sur');
  await page.getByRole('heading', { name: 'Taller Sur' }).waitFor();
  // U3: nodos propios exactos, aristas correctas, protección visible y aviso de tablero vacío.
  const uTaller = await verificarDiagrama(taller);
  const circuito = circuitosDe(uTaller).find(c => c.identifier === 'C1' && c.description === 'Torno');
  assert.match(await page.getByTestId(`unifilar-node-circuit-${circuito.id}`).textContent(), /C1 · Torno · Dato ficticio/);
  await page.getByTestId(`unifilar-node-empty-${uTaller.boards.find(b => b.name === 'Tablero de reserva').id}`).waitFor();
  // Impresión/PDF: el botón dispara la impresión del navegador.
  await page.getByRole('button', { name: 'Imprimir o guardar como PDF' }).click();
  assert.equal(await page.evaluate(() => window.__prints), 1);
  await volver.click();
  await page.getByRole('heading', { name: 'Proyectos', level: 2 }).waitFor();
  // U2: cada obra muestra exactamente sus propios nodos; nada de Taller Sur asoma en la otra.
  await verUnifilar('Proyecto de ejemplo');
  const ejemplo = (await apiGet('projects')).find(p => p.name === 'Proyecto de ejemplo');
  const uEjemplo = await verificarDiagrama(ejemplo);
  const iluminacion = circuitosDe(uEjemplo).find(c => c.description === 'Iluminación de ejemplo');
  assert.match(await page.getByTestId(`unifilar-node-circuit-${iluminacion.id}`).textContent(), /C1 · Iluminación de ejemplo/);
  assert.equal(await page.getByTestId(`unifilar-node-circuit-${circuito.id}`).count(), 0);
  await volver.click();
  await verUnifilar('Taller Sur');
  await page.getByRole('heading', { name: 'Taller Sur' }).waitFor();
  assert.equal(await page.getByTestId(`unifilar-node-circuit-${iluminacion.id}`).count(), 0);
  await volver.click();
  // U3: tablero único sin circuitos en Obra en montaje.
  await verUnifilar('Obra en montaje');
  const montaje = (await apiGet('projects')).find(p => p.name === 'Obra en montaje');
  const uMontaje = await verificarDiagrama(montaje);
  await page.getByTestId(`unifilar-node-empty-${uMontaje.boards[0].id}`).waitFor();
  await volver.click();
  // U4: obra sin tableros.
  await verUnifilar('Obra vacía');
  await page.getByText('Esta obra todavía no tiene tableros.').waitFor();
  await volver.click();
  // U5: ID inválido y obra inexistente en la API.
  assert.equal((await page.request.get(`${base}/api/projects/abc/unifilar`)).status(), 400);
  assert.equal((await page.request.get(`${base}/api/projects/999999/unifilar`)).status(), 404);
  // U5: fallo de lectura en el navegador: error visible, sin mensaje de obra vacía y con salida.
  await page.route('**/api/projects/*/unifilar', route => route.abort());
  await verUnifilar('Taller Sur');
  const alerta = page.getByRole('alert');
  await alerta.waitFor();
  assert.ok((await alerta.textContent()).length > 0);
  assert.equal(await page.getByText('Esta obra todavía no tiene tableros.').count(), 0);
  await page.unroute('**/api/projects/*/unifilar');
  await volver.click();
  await page.getByRole('heading', { name: 'Proyectos', level: 2 }).waitFor();
  // Vista por obra del proyecto creado en este recorrido: nodos y aristas exactos por ID.
  await verUnifilar('Proyecto E2E');
  await page.getByRole('heading', { name: 'Proyecto E2E' }).waitFor();
  await page.getByTestId(`unifilar-node-circuit-${circuitE2E}`).waitFor();
  await page.getByTestId(`unifilar-edge-${circuitE2E}`).waitFor();
  assert.deepEqual(await nodosVisibles(), [`unifilar-node-board-${boardE2E}`, `unifilar-node-circuit-${circuitE2E}`]);
  assert.deepEqual(await aristasVisibles(), [{ testid: `unifilar-edge-${circuitE2E}`, source: `board-${boardE2E}`, target: `circuit-${circuitE2E}` }]);
  // El circuito creado sin descripción muestra identificador y protección.
  assert.equal(await page.getByTestId(`unifilar-node-circuit-${circuitE2E}`).textContent(), 'C1 · 10 A');
  await volver.click();
  const button = name => page.getByRole('button', {name, exact:true});
  const enterSchemes = async () => { await button('Esquemas de Proyecto E2E').click(); };
  await enterSchemes();
  await button('Ejemplo de dos puntos').click();
  await page.getByLabel('Tensión nominal (V)').fill('220');
  await page.getByText('Lámpara 1 · Encendida · camino cerrado · 220 V').waitFor();
  await button('Accionar Conmutador 1').click();
  await page.getByText(/Lámpara 1 · Apagada/).waitFor();
  await button('Accionar Conmutador 2').click();
  await page.getByText(/Lámpara 1 · Encendida/).waitFor();
  const body = await page.getByText('Conmutador 1', {exact:true}).boundingBox();
  await page.mouse.move(body.x+15,body.y+8);
  await page.mouse.down();
  await page.mouse.move(body.x+45,body.y+45,{steps:8});
  await page.mouse.up();
  await button('Guardar esquema').click();
  await page.getByText('Esquema guardado.').waitFor();
  const schemePath = 'projects/'+project+'/schemes';
  const [savedScheme] = await apiGet(schemePath);
  const savedDrawing = await apiGet(schemePath+'/'+savedScheme.id);
  assert.notEqual(savedDrawing.parts.find(p=>p.id==='s1').x,220);
  assert.equal(savedDrawing.wires.length,6);
  assert.equal((await page.request.get(base+'/api/projects/'+taller.id+'/schemes/'+savedScheme.id)).status(),404);
  const badDrawing = {...savedDrawing,wires:[{kind:'Fase',from:'src.bad',to:'lamp.L'}]};
  assert.equal((await page.request.put(base+'/api/'+schemePath+'/'+savedScheme.id,{headers:{Origin:base},data:badDrawing})).status(),400);
  await page.reload();
  await button('Proyectos').click();
  await enterSchemes();
  await button('Abrir Luz de escalera').click();
  await page.getByText(/Lámpara 1 · Encendida · camino cerrado · 220 V/).waitFor();
  await page.getByLabel('Nombre del esquema').fill('Escalera norte');
  await button('Guardar esquema').click();
  await button('Abrir Escalera norte').waitFor();
  assert.equal((await apiGet(schemePath)).length,1);
  await button('Hoja en blanco').click();
  for(const k of ['alimentación','interruptor simple','lámpara'])await button('Agregar '+k).click();
  async function connectPins(kind,from,to){
    await page.getByLabel('Tipo de cable').selectOption(kind);
    await button(from).press('Enter');
    await button(to).press('Enter');
  }
  await connectPins('Fase','Alimentación 1 borne L','Interruptor simple 1 borne C');
  await connectPins('Retorno','Interruptor simple 1 borne 1','Lámpara 1 borne L');
  await connectPins('Neutro','Alimentación 1 borne N','Lámpara 1 borne N');
  await button('Accionar Interruptor simple 1').click();
  await page.getByText(/Lámpara 1 · Encendida/).waitFor();
  await page.getByText('Cables y componentes (3 cables)').click();
  await button('Quitar cable').last().click();
  await page.getByText(/Lámpara 1 · Apagada/).waitFor();
  await create('Materiales', { Nombre: 'Cable E2E', Unidad: 'm', 'Precio (centavos)': '12500' });
  await create('Cómputo', { 'ID de proyecto': 'Proyecto E2E', 'ID de material': 'Cable E2E', Cantidad: '2' });
  const quote = await create('Presupuestos', { 'Obra del presupuesto': 'Proyecto E2E', 'Mano de obra (pesos)': '100,25' });
  const quoteRow = page.getByRole('row').filter({ has: page.locator(`a[href="/api/quotations/${quote}/pdf"]`) });
  await quoteRow.getByRole('cell', { name: 'Proyecto E2E', exact: true }).waitFor();
  await quoteRow.getByRole('cell', { name: '1', exact: true }).waitFor();
  await quoteRow.getByRole('cell', { name: /\$\s*350,25/ }).waitFor();
  const pdf = await page.request.get(`${base}/api/quotations/${quote}/pdf`);
  assert.equal(pdf.status(), 200);
  assert.match(pdf.headers()['content-type'], /^application\/pdf/);
  assert.equal((await pdf.body()).subarray(0, 5).toString(), '%PDF-');
  const pdfText = async response => execFileSync('pdftotext', ['-', '-'], { input: await response.body(), encoding: 'utf8' });
  assert.match(await pdfText(pdf), /Proyecto: Proyecto E2E\s/);
  async function renameProject(name) {
    const response = await page.request.put(`${base}/api/projects/${project}`, {
      headers: { Origin: base }, data: { name }
    });
    assert.equal(response.status(), 200);
  }
  await renameProject('Obra renombrada');
  const downloadedAgain = await page.request.get(`${base}/api/quotations/${quote}/pdf`);
  assert.match(await pdfText(downloadedAgain), /Proyecto: Proyecto E2E\s/);
  await renameProject('Proyecto E2E');
  await create('Actividades', { 'ID de proyecto': 'Proyecto E2E', Descripción: 'Visita E2E', Fecha: '2026-11-16' });

  await page.getByRole('button', { name: 'Planos', exact: true }).click();
  const select = page.getByLabel('Proyecto', { exact: true });
  await select.locator('option').filter({ hasText: 'Proyecto E2E' }).waitFor({ state: 'attached' });
  await select.selectOption(String(project));
  await page.getByText('Este proyecto todavía no tiene plano.').waitFor();
  const png = async color => Buffer.from(await page.evaluate(color => {
    const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2;
    const context = canvas.getContext('2d'); context.fillStyle = color; context.fillRect(0, 0, 2, 2);
    return canvas.toDataURL('image/png').split(',')[1];
  }, color), 'base64');
  async function upload(data) {
    await page.getByLabel('Imagen del plano (obligatorio)').setInputFiles({ name: 'plano.png', mimeType: 'image/png', buffer: data });
    const response = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith('/plan-image'));
    await page.getByRole('button', { name: 'Guardar plano' }).click();
    assert.equal((await response).status(), 204);
    await page.getByText('Plano guardado.').waitFor();
    await page.getByAltText('Plano cargado del proyecto').waitFor();
  }
  await upload(await png('red'));
  const replacement = await png('blue');
  await upload(replacement);
  async function checkImage() {
    const response = await page.request.get(`${base}/api/projects/${project}/plan-image`);
    assert.equal(response.status(), 200);
    assert.deepEqual(await response.body(), replacement);
  }
  await checkImage();

  execFileSync('docker', ['compose', '-f', 'compose.yaml', '--env-file', '/dev/null', 'stop'], { stdio: 'inherit' });
  execFileSync('docker', ['compose', '-f', 'compose.yaml', '--env-file', '/dev/null', 'up', '-d', '--wait', '--wait-timeout', '180'], { stdio: 'inherit' });
  base = `http://${execFileSync('docker', ['compose', '-f', 'compose.yaml', '--env-file', '/dev/null', 'port', 'frontend', '8080'], { encoding: 'utf8' }).trim()}`;
  await page.goto(base);
  await page.getByRole('button', { name: 'Planos', exact: true }).click();
  await select.locator('option').filter({ hasText: 'Proyecto E2E' }).waitFor({ state: 'attached' });
  await select.selectOption(String(project));
  await page.getByAltText('Plano cargado del proyecto').waitFor();
  await checkImage();
  const projects = await page.request.get(`${base}/api/projects`);
  assert.ok((await projects.json()).some(row => row.id === project && row.name === 'Proyecto E2E'));
  assert.deepEqual(await apiGet(schemePath+'/'+savedScheme.id), {...savedDrawing,name:'Escalera norte'});
  console.log('E2E: flujo completo, reemplazo de plano y persistencia tras reinicio verificados');
} finally {
  await browser.close();
}
