const pesoPattern = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/;
export const pesos = new Intl.NumberFormat('es-AR', {style: 'currency', currency: 'ARS'});

export function pesoCents(value = '') {
  if (!value) return 0;
  if (!pesoPattern.test(value)) throw new Error('Ingresá un importe en pesos, por ejemplo 15.000,25.');
  const [whole, fraction = ''] = value.replaceAll('.', '').split(',');
  const cents = Number(whole + fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) throw new Error('El importe es demasiado grande.');
  return cents;
}
