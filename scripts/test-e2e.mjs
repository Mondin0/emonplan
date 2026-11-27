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
  const lessonButton = name => page.getByRole('button', { name, exact: true });
  const diagram = name => page.getByRole('img', { name, exact: true });
  assert.equal(await lessonButton('Lecciones').count(), 0);
  await page.getByLabel('Usuario').fill(process.env.OWNER_EMAIL);
  await page.getByLabel('Contraseña').fill(process.env.OWNER_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.getByRole('heading', { name: 'Resumen' }).waitFor();

  const studioSession = await page.context().storageState();
  const studioSlot = (surface, position, occupant = 'libre') =>
    surface.getByRole('button', {name: `Posición ${position}: ${occupant}`, exact: true});
  const studioMaterials = surface => surface.getByRole('group', {name: 'Modo del tablero'})
    .getByRole('button', {name: 'Materiales', exact: true});
  async function confirmStudioKeyboardFocus(target) {
    assert.equal(await target.evaluate(element => element === document.activeElement && element.matches(':focus-visible')), true);
    assert.equal(await target.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth) > 0 &&
      getComputedStyle(element).outlineStyle !== 'none'), true);
  }
  await lessonButton('Studio').click();
  await page.getByRole('heading', {name: 'Gabinete DIN'}).waitFor();
  assert.equal(await page.getByRole('button', {name: /^Posición \d+: libre$/}).count(), 12);
  await page.getByLabel('Nombre del proyecto').fill('Tablero del taller');
  await page.getByLabel('Tipo de alimentación').selectOption('trifasico');
  await page.getByRole('button', {name: /Térmica.*2 módulos/}).click();
  await studioSlot(page, 12).click();
  await page.getByText('La pieza no cabe en esa posición.').waitFor();
  await studioSlot(page, 11).click();
  await studioSlot(page, 12, 'Térmica').waitFor();
  await page.getByRole('button', {name: /Diferencial.*2 módulos/}).click();
  await studioSlot(page, 10).click();
  await page.getByText('Hay posiciones ocupadas en ese destino.').waitFor();

  // El primer destino libre para el diferencial es 2–3 si la posición 1 está ocupada.
  await page.getByRole('button', {name: /Bornera N.*1 módulo/}).click();
  await studioSlot(page, 1).click();
  await page.getByRole('button', {name: /Diferencial.*2 módulos/}).press('Space');
  await confirmStudioKeyboardFocus(studioSlot(page, 2));
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await studioSlot(page, 3, 'Diferencial').waitFor();
  await lessonButton('Deshacer').click();
  await lessonButton('Deshacer').click();

  await page.reload();
  await lessonButton('Studio').click();
  assert.equal(await page.getByLabel('Nombre del proyecto').inputValue(), 'Tablero del taller');
  assert.equal(await page.getByLabel('Tipo de alimentación').inputValue(), 'trifasico');
  await studioSlot(page, 11, 'Térmica').waitFor();
  const mountedBreaker = page.getByRole('button', {name: 'Mover Térmica, posiciones 11–12'});
  await mountedBreaker.focus();
  await page.keyboard.press('Enter');
  await confirmStudioKeyboardFocus(studioSlot(page, 1));
  for (let position = 1; position < 9; position++) await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await studioSlot(page, 9, 'Térmica').waitFor();
  await studioSlot(page, 10, 'Térmica').waitFor();
  await studioSlot(page, 11).waitFor();
  await studioSlot(page, 12).waitFor();

  await page.getByRole('button', {name: /Bornera N.*1 módulo/}).click();
  await studioSlot(page, 5).click();
  await page.getByRole('button', {name: /Bornera PE.*1 módulo/}).click();
  await studioSlot(page, 7).click();
  await lessonButton('Conectar').click();
  const breakerTerminal = lessonButton('Térmica, posición 9, L1 superior');
  const neutralTerminal = lessonButton('Bornera N, posición 5, N superior');
  const earthTerminal = lessonButton('Bornera PE, posición 7, PE inferior');
  await breakerTerminal.click();
  await breakerTerminal.click();
  assert.equal(await page.getByTestId(/^studio-wire-/).count(), 0);
  await breakerTerminal.click();
  await neutralTerminal.click();
  await page.getByLabel('Color', {exact: true}).selectOption('azul');
  await page.getByLabel('Sección nominal (mm²)').fill('2.5');
  await earthTerminal.click();
  await breakerTerminal.click();
  await page.getByLabel('Color', {exact: true}).selectOption('azul');
  await page.getByLabel('Sección nominal (mm²)').fill('2.5');
  await neutralTerminal.click();
  await earthTerminal.click();
  const keptWire = lessonButton('Bornera N, posición 5, N superior → Bornera PE, posición 7, PE inferior');
  await page.getByLabel('Color', {exact: true}).selectOption('verde-amarillo');
  await page.getByLabel('Sección nominal (mm²)').fill('4');
  const oldRoute = await page.getByTestId('studio-wire-0').getAttribute('d');
  await lessonButton('Montar').click();
  await lessonButton('Mover Térmica, posiciones 9–10').click();
  await studioSlot(page, 11).click();
  await lessonButton('Conectar').click();
  assert.notEqual(await page.getByTestId('studio-wire-0').getAttribute('d'), oldRoute);
  await page.reload();
  await lessonButton('Studio').click();
  await lessonButton('Conectar').click();
  await lessonButton('Térmica, posición 11, L1 superior → Bornera N, posición 5, N superior').click();
  assert.equal(await page.getByLabel('Color', {exact: true}).inputValue(), 'azul');
  assert.equal(await page.getByLabel('Sección nominal (mm²)').inputValue(), '2.5');
  await lessonButton('Montar').click();
  await lessonButton('Mover Térmica, posiciones 11–12').click();
  await lessonButton('Quitar Térmica').click();
  await studioSlot(page, 11).waitFor();
  await studioSlot(page, 12).waitFor();
  await studioSlot(page, 5, 'Bornera N').waitFor();
  await studioSlot(page, 7, 'Bornera PE').waitFor();
  await lessonButton('Conectar').click();
  assert.equal(await page.getByTestId(/^studio-wire-/).count(), 1);
  await keptWire.click();
  assert.equal(await page.getByLabel('Color', {exact: true}).inputValue(), 'verde-amarillo');
  assert.equal(await page.getByLabel('Sección nominal (mm²)').inputValue(), '4');
  await studioMaterials(page).click();
  const blueTramos = page.getByRole('row', {name: /^Azul.*2,5 mm².*2$/});
  assert.equal(await blueTramos.count(), 0);
  await lessonButton('Deshacer').focus();
  await page.keyboard.press('Enter');
  await blueTramos.waitFor();
  await page.getByRole('row', {name: /^Térmica.*2 módulos.*1$/}).waitFor();
  await lessonButton('Rehacer').click();
  assert.equal(await blueTramos.count(), 0);
  await lessonButton('Deshacer').click();
  await page.reload();
  await lessonButton('Studio').click();
  await studioMaterials(page).click();
  await blueTramos.waitFor();
  assert.equal(await lessonButton('Deshacer').getAttribute('aria-disabled'), 'true');
  assert.equal(await lessonButton('Rehacer').getAttribute('aria-disabled'), 'true');

  const touchContext = await browser.newContext({storageState: studioSession, hasTouch: true, isMobile: true, viewport: {width: 390, height: 844}});
  try {
    const touchPage = await touchContext.newPage();
    await touchPage.goto(base);
    await touchPage.getByRole('button', {name: 'Studio', exact: true}).tap();
    await touchPage.getByRole('button', {name: /Bornera PE.*1 módulo/}).tap();
    await studioSlot(touchPage, 1).tap();
    await studioSlot(touchPage, 1, 'Bornera PE').waitFor();
    await touchPage.getByRole('button', {name: /Bornera N.*1 módulo/}).tap();
    await studioSlot(touchPage, 4).tap();
    const touchButton = name => touchPage.getByRole('button', {name, exact: true});
    await touchButton('Conectar').tap();
    await touchButton('Bornera PE, posición 1, PE superior').tap();
    await touchButton('Bornera N, posición 4, N superior').tap();
    await touchButton('Bornera PE, posición 1, PE inferior').tap();
    await touchButton('Bornera N, posición 4, N inferior').tap();
    assert.equal(await touchPage.getByTestId(/^studio-wire-/).count(), 2);
    await touchButton('Eliminar tramo').tap();
    assert.equal(await touchPage.getByTestId(/^studio-wire-/).count(), 1);
    await touchButton('Bornera PE, posición 1, PE superior → Bornera N, posición 4, N superior').waitFor();
    await studioMaterials(touchPage).tap();
    await touchPage.getByRole('row', {name: /^Sin asignar.*Sin sección.*1$/}).waitFor();
    await touchButton('Deshacer').tap();
    await touchPage.getByRole('row', {name: /^Sin asignar.*Sin sección.*2$/}).waitFor();
    await touchButton('Rehacer').tap();
    await touchPage.getByRole('row', {name: /^Sin asignar.*Sin sección.*1$/}).waitFor();
    await touchButton('Deshacer').tap();
    const earthRow = touchPage.getByRole('row', {name: /^Bornera PE.*1 módulo.*1$/});
    const neutralRow = touchPage.getByRole('row', {name: /^Bornera N.*1 módulo.*1$/});
    const twoWires = touchPage.getByRole('row', {name: /^Sin asignar.*Sin sección.*2$/});
    await touchButton('Montar').tap();
    await touchButton('Mover Bornera PE, posición 1').tap();
    await touchButton('Quitar Bornera PE').tap();
    await studioMaterials(touchPage).tap();
    await earthRow.waitFor({state: 'detached'});
    await neutralRow.waitFor();
    await touchPage.getByText('Todavía no hay tramos.', {exact: true}).waitFor();
    await studioSlot(touchPage, 1).waitFor();
    assert.equal(await touchPage.getByTestId(/^studio-wire-/).count(), 0);
    await touchButton('Deshacer').tap();
    await earthRow.waitFor();
    await neutralRow.waitFor();
    await twoWires.waitFor();
    await studioSlot(touchPage, 1, 'Bornera PE').waitFor();
    assert.equal(await touchPage.getByTestId(/^studio-wire-/).count(), 2);

    await touchPage.reload();
    await touchButton('Studio').tap();
    await studioMaterials(touchPage).tap();
    await earthRow.waitFor();
    await neutralRow.waitFor();
    await twoWires.waitFor();
    await studioSlot(touchPage, 1, 'Bornera PE').waitFor();
    await studioSlot(touchPage, 4, 'Bornera N').waitFor();
    assert.equal(await touchPage.getByTestId(/^studio-wire-/).count(), 2);
    assert.equal(await touchButton('Deshacer').getAttribute('aria-disabled'), 'true');
    assert.equal(await touchButton('Rehacer').getAttribute('aria-disabled'), 'true');
    assert.equal(await touchPage.evaluate(() => document.documentElement.scrollWidth), 390);
  } finally {
    await touchContext.close();
  }
  await lessonButton('Inicio').click();

  const projectMvp = 'Casa de Martín';
  const clientMvp = 'Martín Piloto';
  const cableMvp = 'Cable Piloto';
  const pilotApi = async name => {
    const response = await page.request.get(`${base}/api/${name}`);
    assert.equal(response.status(), 200);
    return response.json();
  };
  assert.deepEqual(await pilotApi('projects'), []);
  assert.deepEqual(await pilotApi('clients'), []);
  assert.deepEqual(await pilotApi('materials'), []);
  await page.setViewportSize({width: 390, height: 844});
  await lessonButton('Nueva obra').click();
  await page.getByLabel('Nombre de la obra').fill(projectMvp);
  await lessonButton('Agregar cliente').click();
  await page.getByLabel('Nombre del cliente').fill(clientMvp);
  await lessonButton('Guardar cliente').click();
  await lessonButton('Guardar obra').click();
  await page.getByRole('heading', { name: projectMvp, exact: true }).waitFor();
  await page.getByText(clientMvp, { exact: true }).waitFor();
  await page.getByText('Pendiente', { exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Presupuesto', exact: true }).waitFor();
  const pilotWork = (await pilotApi('projects')).find(row => row.name === projectMvp);

  const pilotLabor = page.getByLabel('Mano de obra (pesos)', { exact: true });
  await pilotLabor.fill('100,255');
  await lessonButton('Generar presupuesto').click();
  assert.match(await pilotLabor.evaluate(input => input.validationMessage), /importe en pesos/);
  await pilotLabor.fill('100,25');
  await lessonButton('Generar presupuesto').click();
  await lessonButton('Compartir presupuesto versión 1').waitFor();

  async function verifyPilotPdf(version, total) {
    await lessonButton(`Compartir presupuesto versión ${version}`).click();
    const downloadLink = page.getByRole('link', { name: 'Descargar PDF', exact: true });
    const href = await downloadLink.getAttribute('href');
    const id = /^\/api\/quotations\/(\d+)\/pdf$/.exec(href)?.[1];
    assert.ok(id);
    const [download] = await Promise.all([
      page.waitForEvent('download'), downloadLink.click(),
    ]);
    assert.equal(download.suggestedFilename(), `presupuesto-${id}.pdf`);
    const data = readFileSync(await download.path());
    assert.equal(data.subarray(0, 5).toString(), '%PDF-');
    const content = execFileSync('pdftotext', ['-', '-'], { input: data, encoding: 'utf8' });
    assert.ok(content.includes(`versión ${version}`));
    assert.ok(content.includes(`Proyecto: ${projectMvp}`));
    assert.ok(content.includes(`Total: $${total}`));
  }

  await verifyPilotPdf(1, '100,25');
  await lessonButton('Agregar material').click();
  await lessonButton('Nuevo material de catálogo').click();
  await page.getByLabel('Nombre del material').fill(cableMvp);
  await page.getByLabel('Unidad', { exact: true }).fill('m');
  await page.getByLabel('Precio por unidad (pesos)').fill('125,00');
  await page.getByLabel('Proveedor (opcional)').fill('Electricidad Centro');
  const pilotQuantity = page.getByLabel('Cantidad', { exact: true });
  await pilotQuantity.fill('0');
  await lessonButton('Guardar material').click();
  assert.match(await pilotQuantity.evaluate(input => input.validationMessage), /cantidad mayor a cero/);
  await pilotQuantity.fill('2');
  await lessonButton('Guardar material').click();
  await page.getByText('Electricidad Centro', { exact: true }).waitFor();
  const pilotMaterial = (await pilotApi('materials')).find(item => item.name === cableMvp);
  assert.equal(pilotMaterial.supplier, 'Electricidad Centro');
  assert.equal(pilotMaterial.price_cents, 12500);
  await lessonButton('Generar presupuesto').click();
  await verifyPilotPdf(2, '350,25');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await lessonButton('Copiar mensaje para WhatsApp').click();
  await page.getByText('Mensaje copiado. Pegalo en WhatsApp y adjuntá el PDF.', { exact: true }).waitFor();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /Hola, Martín Piloto\..*Casa de Martín/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.setViewportSize({width: 1280, height: 720});

  await lessonButton('Materiales').click();
  await page.getByRole('row').filter({ hasText: cableMvp }).getByText('Electricidad Centro').waitFor();
  await lessonButton('Obras').click();
  await lessonButton('Nueva obra').click();
  await page.getByLabel('Nombre de la obra').fill('Segunda obra piloto');
  await page.getByLabel('Cliente existente').selectOption(String(pilotWork.client_id));
  await lessonButton('Guardar obra').click();
  await page.getByRole('heading', { name: 'Segunda obra piloto', exact: true }).waitFor();
  await page.getByText('Todavía no hay presupuestos para esta obra.', { exact: true }).waitFor();
  assert.equal(await page.getByText(cableMvp, { exact: true }).count(), 0);
  assert.equal((await pilotApi('clients')).length, 1);
  await lessonButton('Agregar material').click();
  await page.getByLabel('Material del catálogo').selectOption(String(pilotMaterial.id));
  await pilotQuantity.fill('1');
  await lessonButton('Guardar material').click();
  await lessonButton(`Editar cantidad de ${cableMvp}`).click();
  await pilotQuantity.fill('3');
  await lessonButton('Guardar material').click();
  await page.getByText(/^3 m ·/).waitFor();
  await lessonButton(`Quitar ${cableMvp} de la obra`).click();
  await page.getByText('Podés presupuestar solo la mano de obra y agregar materiales cuando los tengas.').waitFor();
  await lessonButton('Inicio').click();
  await page.reload();
  await lessonButton(projectMvp).click();
  await verifyPilotPdf(1, '100,25');

  await lessonButton('Lecciones').click();
  await lessonButton('Iluminación').press('Enter');
  await page.getByRole('heading', { name: 'Iluminación' }).waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await lessonButton('Interruptor').evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Enter');
  assert.equal(await lessonButton('Interruptor').getAttribute('aria-pressed'), 'true');
  await lessonButton('Lámpara').click();
  assert.equal(await lessonButton('Lámpara').getAttribute('aria-pressed'), 'true');
  const openDiagram = await diagram('Iluminación').innerHTML();
  await lessonButton('Cerrado').press('Enter');
  assert.notEqual(await diagram('Iluminación').innerHTML(), openDiagram);
  await page.getByText('El contacto completa el lazo.', { exact: false }).waitFor();
  await lessonButton('Abierto').press('Enter');
  assert.equal(await diagram('Iluminación').innerHTML(), openDiagram);
  await lessonButton('Volver a lecciones').click();
  await lessonButton('Disparo del diferencial').click();
  const normalDiagram = await diagram('Disparo del diferencial').innerHTML();
  await lessonButton('Fuga hipotética').press('Enter');
  assert.notEqual(await diagram('Disparo del diferencial').innerHTML(), normalDiagram);
  await page.getByText('Antes del disparo, parte de la corriente', { exact: false }).waitFor();
  await lessonButton('Normal').press('Enter');
  assert.equal(await diagram('Disparo del diferencial').innerHTML(), normalDiagram);

  const practiceWrites = [];
  const recordWrite = request => {
    if (request.url().includes('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      practiceWrites.push(request.method());
    }
  };
  page.on('request', recordWrite);
  await page.setViewportSize({width: 390, height: 844});
  await lessonButton('Inicio').click();
  await lessonButton('Abrir capacitación').press('Enter');
  await page.getByRole('heading', {name: 'Electricidad domiciliaria'}).waitFor();
  assert.equal(await page.locator('.lesson-module').count(), 7);
  assert.equal(await page.locator('.lesson-catalog button').count(), 38);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  const lessonTitles = await page.locator('.lesson-catalog button').allTextContents();
  for (const title of lessonTitles) {
    await lessonButton(title).press('Enter');
    const teachingDiagram = page.getByRole('figure', {name: 'Diagrama didáctico'});
    await teachingDiagram.waitFor({state: 'visible'});
    assert.equal(await teachingDiagram.locator('figcaption').isVisible(), true, title);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, title);
    await lessonButton('Volver a lecciones').press('Enter');
  }
  await lessonButton('Mapa de una instalación domiciliaria').press('Enter');
  const flow = page.getByRole('list', {name: 'Recorrido', exact: true});
  const direction = () => flow.evaluate(list => getComputedStyle(list).flexDirection);
  assert.equal(await direction(), 'column');
  await page.setViewportSize({width: 1280, height: 720});
  assert.equal(await direction(), 'row');
  await page.setViewportSize({width: 390, height: 844});
  await lessonButton('Volver a lecciones').press('Enter');
  await lessonButton('Tanque y cisterna con una bomba').press('Enter');
  await lessonButton('Cisterna baja').press('Enter');
  await page.getByText('Bomba detenida', {exact: true}).waitFor();
  await lessonButton('Ambos permisos').press('Enter');
  await page.getByText('Bomba en marcha', {exact: true}).waitFor();
  await lessonButton('Volver a lecciones').press('Enter');
  await lessonButton('Llave de un punto y dos lámparas').press('Enter');
  const doubleLamp = diagram('Llave de un punto y dos lámparas');
  const bothOn = await doubleLamp.innerHTML();
  await lessonButton('Falla en lámpara 1').press('Enter');
  assert.notEqual(await doubleLamp.innerHTML(), bothOn);
  await page.getByText(/la lámpara 2 sigue encendida/i).waitFor();
  await lessonButton('La lámpara 2 sigue funcionando').press('Enter');
  await page.getByText(/^Correcto\./).waitFor();
  await lessonButton('Volver a lecciones').press('Enter');
  assert.equal(await lessonButton('Llave de un punto y dos lámparas').evaluate(element => element === document.activeElement), true);
  await lessonButton('Pelacables').press('Enter');
  const stripper = page.getByRole('img', {name: /pelacables manual con mordazas/i});
  await stripper.waitFor();
  await stripper.evaluate(image => image.decode());
  await lessonButton('Volver a lecciones').click();
  await lessonButton('Automático en modo cisterna').press('Enter');
  await lessonButton('Nivel alto').press('Enter');
  await page.getByText('La bomba arranca para sacar agua', {exact: false}).waitFor();
  await lessonButton('Nivel bajo').press('Enter');
  await page.getByText('La bomba se detiene al alcanzar el nivel bajo', {exact: false}).waitFor();
  await lessonButton('Volver a lecciones').press('Enter');
  await lessonButton('Fotocélula de cuatro hilos').press('Enter');
  await lessonButton('Noche').press('Enter');
  await page.getByText('Lámpara encendida', {exact: true}).waitFor();
  await lessonButton('Entre fase conmutada y neutro de salida').press('Enter');
  await page.getByText(/^Correcto[.]/).waitFor();
  await lessonButton('Volver a lecciones').press('Enter');
  await lessonButton('Cómo buscar una pérdida').press('Enter');
  await lessonButton('Circuito, hora, humedad y cargas conectadas').press('Enter');
  await page.getByText(/^Correcto\./).waitFor();
  await lessonButton('Siguiente lección').press('Enter');
  await lessonButton('Ir a Obras').press('Enter');
  await page.getByRole('heading', {name: 'Obras', exact: true, level: 2}).waitFor();
  await page.getByText(projectMvp, {exact: true}).waitFor();
  await lessonButton('Clientes').click();
  await page.getByRole('heading', {name: 'Clientes', exact: true, level: 2}).waitFor();
  await page.getByText(clientMvp, {exact: true}).waitFor();
  await lessonButton('Materiales').click();
  await page.getByRole('heading', {name: 'Materiales', exact: true, level: 2}).waitFor();
  await page.getByText(cableMvp, {exact: true}).waitFor();
  page.off('request', recordWrite);
  assert.deepEqual(practiceWrites, []);
  await page.setViewportSize({width: 1280, height: 720});

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
  await lessonButton('Lecciones').click();
  await lessonButton('Clientes').click();
  await page.getByRole('cell', { name: 'Cliente E2E', exact: true }).waitFor();
  await lessonButton('Proyectos').click();
  await page.getByRole('cell', { name: 'Proyecto E2E', exact: true }).waitFor();

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
  await lessonButton('Obras').click();
  await lessonButton(projectMvp).click();
  await verifyPilotPdf(2, '350,25');
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
