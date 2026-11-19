// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, expect, it} from 'vitest';
import {Lessons} from './Lessons';

afterEach(cleanup);

const topics = [
  'Mapa de una instalación domiciliaria', 'Fase, neutro y tierra', 'Tensión y corriente',
  'Protecciones para trabajar', 'Protecciones', 'Puesta a tierra',
  'Línea de alimentación', 'Línea de tomas', 'Línea de luces', 'Conductor de protección (PE)',
  'Cajas de registro por ambiente', 'Caños para instalaciones',
  'Pelacables', 'Destornilladores', 'Alicate', 'Cinta pasacables', 'Buscapolo',
  'Detector de tensión', 'Lámpara en serie', 'Amperímetro', 'Pinza amperométrica',
  'Iluminación', 'Llave de un punto y dos lámparas', 'Tomacorrientes', 'Timbre con pulsador',
  'Automático de tanque elevado', 'Automático en modo cisterna', 'Tanque y cisterna con una bomba',
  'Fotocélula de dos hilos', 'Fotocélula de tres hilos', 'Fotocélula de cuatro hilos',
  'Fotocélula con zócalo NEMA', 'Fotocélula con sensor remoto y relé',
  'Consumo domiciliario', 'Pérdidas de energía', 'Disparo del diferencial',
  'Cómo buscar una pérdida', 'Caso integrador de obra',
];

it('ofrece un diagrama, una explicación y un ejercicio para cada tema del curso', () => {
  render(<Lessons/>);
  expect(screen.getAllByRole('heading', {level: 4})).toHaveLength(7);
  expect(screen.getAllByRole('listitem')).toHaveLength(topics.length);
  for (const name of topics) {
    fireEvent.click(screen.getByRole('button', {name}));
    expect(screen.getByRole('heading', {name})).toBeTruthy();
    const diagram = screen.getByRole('figure', {name: 'Diagrama didáctico'});
    expect(diagram.querySelector('figcaption')?.textContent?.length).toBeGreaterThan(15);
    expect(diagram.querySelector('svg, ol')).toBeTruthy();
    expect(screen.getByRole('article').querySelectorAll('p')[1].textContent?.length).toBeGreaterThan(70);
    const exercise = within(screen.getByRole('group', {name: 'Pregunta de repaso'}));
    const answers = exercise.getAllByRole('button');
    const results = answers.map(answer => {
      fireEvent.click(answer);
      return screen.getByRole('status', {name: 'Devolución'}).textContent;
    });
    expect(results.filter(result => result?.startsWith('Correcto.'))).toHaveLength(1);
    expect(results.filter(result => result?.startsWith('Revisá tu respuesta.'))).toHaveLength(answers.length - 1);
    fireEvent.click(screen.getByRole('button', {name: 'Volver a lecciones'}));
  }
});

it('permite predecir y comprobar una falla de rama en dos lámparas', async () => {
  const user = userEvent.setup();
  render(<Lessons/>);
  const button = (name: string) => screen.getByRole('button', {name});
  button('Llave de un punto y dos lámparas').focus();
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(screen.getByRole('heading', {name: 'Llave de un punto y dos lámparas'}));
  const diagram = screen.getByRole('img', {name: 'Llave de un punto y dos lámparas'});
  const before = diagram.innerHTML;
  await user.click(button('Falla en lámpara 1'));
  expect(diagram.innerHTML).not.toBe(before);
  expect(screen.getByText(/la lámpara 2 sigue encendida/i)).toBeTruthy();
  const exercise = within(screen.getByRole('group', {name: 'Pregunta de repaso'}));
  await user.click(exercise.getByRole('button', {name: 'La lámpara 2 sigue funcionando'}));
  expect(screen.getByRole('status', {name: 'Devolución'}).textContent).toContain('Correcto.');
  await user.click(button('Volver a lecciones'));
  expect(document.activeElement).toBe(button('Llave de un punto y dos lámparas'));
});


it('aplica la lógica inversa de llenado y vaciado en el nivel alto', () => {
  render(<Lessons/>);
  const click = (name: string) => fireEvent.click(screen.getByRole('button', {name}));
  const state = () => within(screen.getByRole('group', {name: 'Compará los estados'})).getByRole('status');
  click('Automático de tanque elevado');
  click('Nivel alto');
  expect(state().textContent).toContain('La bomba se detiene');
  click('Volver a lecciones');
  click('Automático en modo cisterna');
  click('Nivel alto');
  expect(state().textContent).toContain('La bomba arranca');
  click('Nivel bajo');
  expect(state().textContent).toContain('La bomba se detiene');
});
