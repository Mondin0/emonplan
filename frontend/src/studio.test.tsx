// @vitest-environment jsdom
import React from 'react';
import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {App} from './main';

const draftKey = 'emonplan.studio.v1';
const slot = (position: number, occupancy = 'libre') =>
  screen.getByRole('button', {name: `Posición ${position}: ${occupancy}`});
const button = (name: string | RegExp) => screen.getByRole('button', {name});
const breaker = 'Térmica, posición 1, L1 superior';
const neutral = 'Bornera N, posición 5, N superior';
const earth = 'Bornera PE, posición 7, PE inferior';
const path = (index: number) => screen.getByTestId(`studio-wire-${index}`).getAttribute('d');

async function openStudio() {
  const user = userEvent.setup();
  vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, status: 200, json: async () => []})));
  render(<App />);
  await user.click(await screen.findByRole('button', {name: 'Studio'}));
  return user;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

it('abre Studio con un gabinete DIN vacío y las cuatro familias de montaje', async () => {
  await openStudio();

  expect(screen.getByRole('heading', {name: 'Studio'})).toBe(document.activeElement);
  expect(screen.getByRole('heading', {name: 'Gabinete DIN'})).toBeTruthy();
  expect(screen.getAllByRole('button', {name: /^Posición \d+: libre$/})).toHaveLength(12);
  expect(screen.getByLabelText('Nombre del proyecto')).toHaveProperty('value', 'Tablero sin título');
  expect(screen.getByLabelText('Tipo de alimentación')).toHaveProperty('value', 'monofasico');
  const catalog = within(screen.getByRole('region', {name: 'Montar'}));
  for (const name of [/Térmica.*2 módulos/, /Diferencial.*2 módulos/, /Bornera N.*1 módulo/, /Bornera PE.*1 módulo/]) {
    expect(catalog.getByRole('button', {name})).toBeTruthy();
  }
});

it('recupera los datos del proyecto y el montaje al volver a abrir Studio', async () => {
  const user = await openStudio();
  const name = screen.getByLabelText('Nombre del proyecto');
  await user.clear(name);
  await user.type(name, 'Tablero del taller');
  await user.selectOptions(screen.getByLabelText('Tipo de alimentación'), 'trifasico');
  await user.click(screen.getByRole('button', {name: /Térmica.*2 módulos/}));
  await user.click(slot(11));
  expect(slot(11, 'Térmica')).toBeTruthy();
  expect(slot(12, 'Térmica')).toBeTruthy();

  cleanup();
  await openStudio();
  expect(screen.getByLabelText('Nombre del proyecto')).toHaveProperty('value', 'Tablero del taller');
  expect(screen.getByLabelText('Tipo de alimentación')).toHaveProperty('value', 'trifasico');
  expect(slot(11, 'Térmica')).toBeTruthy();
  expect(slot(12, 'Térmica')).toBeTruthy();
  expect(screen.getByText('Guardado en este navegador')).toBeTruthy();
});

it('rechaza desbordes y solapamientos y conserva la identidad al mover una pieza', async () => {
  const user = await openStudio();
  await user.click(screen.getByRole('button', {name: /Térmica.*2 módulos/}));
  await user.click(slot(12));
  expect(screen.getByText('La pieza no cabe en esa posición.')).toBeTruthy();
  expect(slot(12)).toBeTruthy();
  await user.click(slot(11));
  const before = localStorage.getItem(draftKey)!;
  const originalId = JSON.parse(before).components[0].id;

  await user.click(screen.getByRole('button', {name: /Bornera N.*1 módulo/}));
  await user.click(slot(12, 'Térmica'));
  expect(screen.getByText('Hay posiciones ocupadas en ese destino.')).toBeTruthy();
  expect(localStorage.getItem(draftKey)).toBe(before);
  await user.click(slot(9));

  await user.click(screen.getByRole('button', {name: 'Mover Térmica, posiciones 11–12'}));
  await user.click(slot(9, 'Bornera N'));
  expect(screen.getByText('Hay posiciones ocupadas en ese destino.')).toBeTruthy();
  expect(slot(12, 'Térmica')).toBeTruthy();
  await user.click(slot(10));
  expect(slot(10, 'Térmica')).toBeTruthy();
  expect(slot(11, 'Térmica')).toBeTruthy();
  expect(slot(12)).toBeTruthy();
  expect(slot(9, 'Bornera N')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(draftKey)!).components[0].id).toBe(originalId);
});

it('mantiene las ediciones visibles y avisa si el navegador bloquea el guardado', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw new DOMException('Bloqueado', 'QuotaExceededError');});
  const user = await openStudio();
  await user.selectOptions(screen.getByLabelText('Tipo de alimentación'), 'trifasico');

  expect(screen.getByLabelText('Tipo de alimentación')).toHaveProperty('value', 'trifasico');
  expect(screen.getByText('No se pudo guardar el borrador en este navegador.')).toBeTruthy();
});

it('ST-03 conecta bornes distintos, edita el tramo y recupera su recorrido al mover y recargar', async () => {
  localStorage.setItem(draftKey, JSON.stringify({
    name: 'Tablero existente',
    supply: 'monofasico',
    components: [{id: 1, kind: 'breaker', position: 1}, {id: 2, kind: 'neutral', position: 5}],
    segments: [],
  }));
  const user = await openStudio();
  await user.click(button('Conectar'));
  await user.click(button(breaker));
  await user.click(button(breaker));
  expect(screen.queryByTestId('studio-wire-0')).toBeNull();
  await user.click(button(breaker));
  await user.click(button(neutral));
  const originalPath = path(0);
  expect(originalPath).toMatch(/^M\d+ \d+V\d+H\d+V\d+$/);
  const name = `${breaker} → ${neutral}`;
  expect(button(name).getAttribute('aria-pressed')).toBe('true');
  await user.selectOptions(screen.getByLabelText('Color'), 'azul');
  await user.type(screen.getByLabelText('Sección nominal (mm²)'), '2.5');
  await user.tab();
  expect(path(0)).toBe(originalPath);

  await user.click(button('Montar'));
  await user.click(button('Mover Térmica, posiciones 1–2'));
  await user.click(slot(3));
  cleanup();
  const reopened = await openStudio();
  await reopened.click(button('Conectar'));
  await reopened.click(button(`Térmica, posición 3, L1 superior → ${neutral}`));
  expect(path(0)).not.toBe(originalPath);
  expect(screen.getByLabelText('Color')).toHaveProperty('value', 'azul');
  expect(screen.getByLabelText('Sección nominal (mm²)')).toHaveProperty('value', '2.5');
  expect(JSON.parse(localStorage.getItem(draftKey)!).segments[0]).toMatchObject({
    from: {componentId: 1, terminal: 'L1'}, to: {componentId: 2, terminal: 'N'},
  });
});

it('ST-04 elimina la pieza y sus dos tramos, y ST-03 permite quitar solo el tramo seleccionado', async () => {
  const from = {componentId: 1, terminal: 'L1'};
  const to = {componentId: 2, terminal: 'N'};
  const pe = {componentId: 3, terminal: 'PE', side: 'bottom'};
  const kept = {from: to, to: pe, color: 'verde-amarillo', section: 4};
  const parts = [
    {id: 1, kind: 'breaker', position: 1},
    {id: 2, kind: 'neutral', position: 5},
    {id: 3, kind: 'earth', position: 7},
  ];
  localStorage.setItem(draftKey, JSON.stringify({
    name: 'Tablero existente', supply: 'monofasico', components: parts,
    segments: [
      {from, to, color: 'azul', section: 2.5},
      {from: pe, to: from, color: 'marron', section: 1.5},
      kept,
    ],
  }));
  const user = await openStudio();
  await user.click(button('Mover Térmica, posiciones 1–2'));
  await user.click(button('Quitar Térmica'));
  expect(slot(1)).toBeTruthy();
  expect(slot(2)).toBeTruthy();
  const saved = () => JSON.parse(localStorage.getItem(draftKey)!);
  expect(saved().components).toEqual(parts.slice(1));
  expect(saved().segments).toEqual([kept]);

  await user.click(button('Conectar'));
  await user.click(button(earth));
  await user.click(button('Bornera N, posición 5, N inferior'));
  expect(screen.getAllByTestId(/^studio-wire-/)).toHaveLength(2);
  await user.click(button('Eliminar tramo'));
  expect(screen.getAllByTestId(/^studio-wire-/)).toHaveLength(1);
  expect(saved().segments).toEqual([kept]);
  expect(button(`${neutral} → ${earth}`)).toBeTruthy();
});

it('conserva los datos de un tramo guardado por versiones anteriores al mover una pieza', async () => {
  const segments = [{from: {componentId: 1, terminal: 'L1'}, to: {componentId: 2, terminal: 'N'}, color: 'azul', section: 2.5}];
  localStorage.setItem(draftKey, JSON.stringify({
    name: 'Tablero existente',
    supply: 'monofasico',
    components: [{id: 1, kind: 'breaker', position: 1}, {id: 2, kind: 'neutral', position: 5}],
    segments,
  }));
  const user = await openStudio();
  await user.click(screen.getByRole('button', {name: 'Mover Térmica, posiciones 1–2'}));
  await user.click(slot(3));

  const draft = JSON.parse(localStorage.getItem(draftKey)!);
  expect(draft.components[0]).toEqual({id: 1, kind: 'breaker', position: 3});
  expect(draft.segments).toEqual(segments);
});

function saveHistoryExample() {
  const from = {componentId: 1, terminal: 'L1'};
  const to = {componentId: 2, terminal: 'N'};
  const pe = {componentId: 3, terminal: 'PE', side: 'bottom'};
  const draft = {
    name: 'Tablero existente', supply: 'monofasico',
    components: [
      {id: 1, kind: 'breaker', position: 1}, {id: 2, kind: 'neutral', position: 5},
      {id: 3, kind: 'earth', position: 7}, {id: 4, kind: 'breaker', position: 9},
      {id: 5, kind: 'differential', position: 11},
    ],
    segments: [
      {from, to, color: 'azul', section: 2.5},
      {from: pe, to: from, color: 'azul', section: 2.5},
      {from: to, to: pe, color: 'ninguno', section: null},
    ],
  };
  localStorage.setItem(draftKey, JSON.stringify(draft));
  return draft;
}

const undo = () => button('Deshacer');
const redo = () => button('Rehacer');
const savedDraft = () => JSON.parse(localStorage.getItem(draftKey)!);
const materialsMode = () => within(screen.getByRole('group', {name: 'Modo del tablero'})).getByRole('button', {name: 'Materiales'});
const materialRow = (name: RegExp) => within(screen.getByRole('region', {name: 'Materiales'})).getByRole('row', {name});

it('ST-01.3 conserva el historial de la sesión cuando falla el guardado', async () => {
  const original = saveHistoryExample();
  const user = await openStudio();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Cuota agotada', 'QuotaExceededError');
  });

  await user.click(button(/Bornera N.*1 módulo/));
  await user.click(slot(3));
  expect(slot(3, 'Bornera N')).toBeTruthy();
  expect(screen.getByText('No se pudo guardar el borrador en este navegador.').getAttribute('role')).toBe('status');
  await user.click(undo());
  expect(slot(3)).toBeTruthy();
  await user.click(redo());
  expect(slot(3, 'Bornera N')).toBeTruthy();
  expect(savedDraft()).toEqual(original);

  cleanup();
  await openStudio();
  expect(slot(3)).toBeTruthy();
  expect(slot(1, 'Térmica')).toBeTruthy();
  expect(undo().getAttribute('aria-disabled')).toBe('true');
  expect(redo().getAttribute('aria-disabled')).toBe('true');
});

it('ST-02 lleva el foco al primer destino válido al montar o mover con teclado', async () => {
  const original = saveHistoryExample();
  localStorage.setItem(draftKey, JSON.stringify({...original, components: original.components.slice(0, 1), segments: []}));
  const user = await openStudio();
  const catalogPart = button(/Diferencial.*2 módulos/);
  catalogPart.focus();
  await user.keyboard(' ');
  expect(document.activeElement).toBe(slot(3));
  await user.keyboard('{Enter}');
  const mountedPart = button('Mover Diferencial, posiciones 3–4');
  mountedPart.focus();
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(slot(3, 'Diferencial'));
  await user.tab();
  await user.tab();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(slot(6, 'Diferencial')).toBeTruthy();
});

it('ST-03.3 conserva una sección inválida y permite corregirla o vaciarla sin modificar el historial antes de tiempo', async () => {
  const original = saveHistoryExample();
  const user = await openStudio();
  await user.click(button('Conectar'));
  const firstWire = button(`${breaker} → ${neutral}`);
  await user.click(firstWire);
  const section = screen.getByLabelText('Sección nominal (mm²)');

  await user.clear(section);
  await user.type(section, '2,5x');
  await user.tab();
  expect(section).toHaveProperty('value', '2,5x');
  expect(section.getAttribute('aria-invalid')).toBe('true');
  const description = document.getElementById(section.getAttribute('aria-describedby')!);
  expect(description?.textContent).toMatch(/mayor que cero/);
  expect(savedDraft()).toEqual(original);
  expect(undo().getAttribute('aria-disabled')).toBe('true');

  await user.click(button(`${earth.replace('superior', 'inferior')} → ${breaker}`));
  expect(section).toHaveProperty('value', '2.5');
  expect(section.getAttribute('aria-invalid')).toBe('false');
  await user.click(firstWire);
  await user.clear(section);
  await user.tab();
  expect(savedDraft().segments[0]).toEqual({...original.segments[0], section: null});
});

it('ST-05.1 confirma con Enter sin perder el foco y guarda una sola operación al salir', async () => {
  const original = saveHistoryExample();
  const user = await openStudio();
  await user.click(button('Conectar'));
  await user.click(button(`${breaker} → ${neutral}`));
  const section = screen.getByLabelText('Sección nominal (mm²)');
  await user.clear(section);
  await user.type(section, '4{Enter}');
  expect(document.activeElement).toBe(section);
  expect(savedDraft().segments[0].section).toBe(4);
  await user.tab();
  await user.click(undo());
  expect(savedDraft()).toEqual(original);
  expect(undo().getAttribute('aria-disabled')).toBe('true');
  await user.click(redo());
  expect(savedDraft().segments[0].section).toBe(4);
  expect(redo().getAttribute('aria-disabled')).toBe('true');
});

it('ST-05.1 deshace y rehace el movimiento y la sección confirmada como acciones completas', async () => {
  const original = saveHistoryExample();
  const user = await openStudio();
  await user.click(button('Conectar'));
  const originalPath = path(0);
  await user.click(button('Montar'));
  await user.click(button('Mover Térmica, posiciones 1–2'));
  await user.click(slot(3));
  await user.click(button('Conectar'));
  const movedPath = path(0);
  expect(movedPath).not.toBe(originalPath);
  await user.click(button(`Térmica, posición 3, L1 superior → ${neutral}`));
  const section = screen.getByLabelText('Sección nominal (mm²)');
  await user.clear(section);
  await user.type(section, '14.5{Enter}');
  expect(savedDraft().segments[0]).toEqual({...original.segments[0], section: 14.5});

  await user.click(undo());
  expect(savedDraft().segments[0]).toEqual(original.segments[0]);
  expect(path(0)).toBe(movedPath);
  await user.click(undo());
  expect(savedDraft()).toEqual(original);
  expect(path(0)).toBe(originalPath);
  expect(undo().getAttribute('aria-disabled')).toBe('true');
  await user.click(redo());
  expect(path(0)).toBe(movedPath);
  await user.click(redo());
  expect(savedDraft().segments[0]).toEqual({...original.segments[0], section: 14.5});
});

it('ST-05.3 conserva Rehacer tras una maniobra inválida y lo descarta al montar otra pieza', async () => {
  const user = await openStudio();
  await user.click(button(/Térmica.*2 módulos/));
  await user.click(slot(1));
  await user.click(undo());
  expect(slot(1)).toBeTruthy();
  await user.click(button(/Diferencial.*2 módulos/));
  await user.click(slot(12));
  expect(redo().getAttribute('aria-disabled')).toBe('false');
  await user.click(slot(3));
  expect(slot(3, 'Diferencial')).toBeTruthy();
  expect(redo().getAttribute('aria-disabled')).toBe('true');
  await user.click(redo());
  expect(slot(1)).toBeTruthy();
  expect(slot(3, 'Diferencial')).toBeTruthy();
});

it('ST-06.1 y ST-06.2 agrupa piezas y tramos, y separa los tramos al cambiar una sección', async () => {
  saveHistoryExample();
  const user = await openStudio();
  await user.click(materialsMode());
  expect(materialRow(/^Térmica.*2 módulos.*2$/)).toBeTruthy();
  expect(materialRow(/^Diferencial.*2 módulos.*1$/)).toBeTruthy();
  expect(materialRow(/^Azul.*2,5 mm².*2$/)).toBeTruthy();
  expect(materialRow(/^Sin asignar.*Sin sección.*1$/)).toBeTruthy();
  await user.click(button('Conectar'));
  await user.click(button(`${breaker} → ${neutral}`));
  const section = screen.getByLabelText('Sección nominal (mm²)');
  await user.clear(section);
  await user.type(section, '4');
  await user.click(materialsMode());
  expect(materialRow(/^Azul.*2,5 mm².*1$/)).toBeTruthy();
  expect(materialRow(/^Azul.*4 mm².*1$/)).toBeTruthy();
});

it('ST-05.2 y ST-06.3 recupera la pieza y sus dos tramos desde Materiales y guarda el resultado', async () => {
  const original = saveHistoryExample();
  const user = await openStudio();
  await user.click(button('Mover Térmica, posiciones 1–2'));
  await user.click(button('Quitar Térmica'));
  const removed = {...original, components: original.components.slice(1), segments: original.segments.slice(2)};
  expect(savedDraft()).toEqual(removed);
  await user.click(materialsMode());
  expect(materialRow(/^Térmica.*2 módulos.*1$/)).toBeTruthy();
  expect(screen.queryByRole('row', {name: /^Azul/})).toBeNull();
  await user.click(undo());
  expect(savedDraft()).toEqual(original);
  expect(materialRow(/^Térmica.*2 módulos.*2$/)).toBeTruthy();
  expect(materialRow(/^Azul.*2,5 mm².*2$/)).toBeTruthy();
  await user.click(redo());
  expect(savedDraft()).toEqual(removed);
  expect(screen.queryByRole('row', {name: /^Azul/})).toBeNull();
  await user.click(undo());

  cleanup();
  const reopened = await openStudio();
  await reopened.click(materialsMode());
  expect(materialRow(/^Térmica.*2 módulos.*2$/)).toBeTruthy();
  expect(materialRow(/^Azul.*2,5 mm².*2$/)).toBeTruthy();
  expect(undo().getAttribute('aria-disabled')).toBe('true');
  expect(redo().getAttribute('aria-disabled')).toBe('true');
});
