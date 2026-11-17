import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from '../frontend/node_modules/playwright/index.mjs';

let base = process.env.E2E_URL;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(base);
  await page.getByLabel('Usuario').fill(process.env.OWNER_EMAIL);
  await page.getByLabel('Contraseña').fill(process.env.OWNER_PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.getByRole('heading', { name: 'Resumen' }).waitFor();

  async function create(section, values) {
    await page.getByRole('button', { name: section, exact: true }).click();
    for (const [label, value] of Object.entries(values)) {
      const field = page.getByLabel(label, { exact: true });
      if (await field.evaluate(element => element.tagName === 'SELECT')) {
        await field.locator('option').filter({ hasText: value }).waitFor();
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
  await create('Tableros', { 'ID de proyecto': 'Proyecto E2E', Nombre: 'Tablero E2E' });
  await create('Circuitos', { 'ID de tablero': 'Tablero E2E', Identificador: 'C1', 'Potencia (W)': '100', 'Tensión (V)': '220', Protección: '10 A', 'Sección (mm²)': '2.5', 'Longitud (m)': '5' });
  await page.getByRole('button', { name: 'Unifilar' }).click();
  await page.getByText('C1 · 10 A').waitFor();
  await create('Materiales', { Nombre: 'Cable E2E', Unidad: 'm', 'Precio (centavos)': '12500' });
  await create('Cómputo', { 'ID de proyecto': 'Proyecto E2E', 'ID de material': 'Cable E2E', Cantidad: '2' });
  const quote = await create('Presupuestos', { 'ID de proyecto': 'Proyecto E2E', 'Mano de obra (centavos)': '10000' });
  const pdf = await page.request.get(`${base}/api/quotations/${quote}/pdf`);
  assert.equal(pdf.status(), 200);
  assert.match(pdf.headers()['content-type'], /^application\/pdf/);
  assert.equal((await pdf.body()).subarray(0, 5).toString(), '%PDF-');
  await create('Actividades', { 'ID de proyecto': 'Proyecto E2E', Descripción: 'Visita E2E', Fecha: '2026-11-16' });

  await page.getByRole('button', { name: 'Planos', exact: true }).click();
  const select = page.getByLabel('Proyecto', { exact: true });
  await select.locator('option').filter({ hasText: 'Proyecto E2E' }).waitFor();
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
  await select.locator('option').filter({ hasText: 'Proyecto E2E' }).waitFor();
  await select.selectOption(String(project));
  await page.getByAltText('Plano cargado del proyecto').waitFor();
  await checkImage();
  const projects = await page.request.get(`${base}/api/projects`);
  assert.ok((await projects.json()).some(row => row.id === project && row.name === 'Proyecto E2E'));
  console.log('E2E: flujo completo, reemplazo de plano y persistencia tras reinicio verificados');
} finally {
  await browser.close();
}
