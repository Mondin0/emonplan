import {expect,it} from 'vitest';
import {example,simulate} from './wiring';

it('resuelve las cuatro posiciones según los viajeros conectados',()=>{
 for(const a of [false,true]) for(const b of [false,true]){
  const drawing=example();
  drawing.voltage=220;
  drawing.parts[1].on=a;
  drawing.parts[2].on=b;
  const state=simulate(drawing);
  expect(state.lamps.lamp.on).toBe(a===b);
  expect(state.lamps.lamp.volts).toBe(a===b?220:null);
 }
});

it('distingue un borne flotante y un corto en la alimentación',()=>{
 const drawing=example();
 drawing.wires=drawing.wires.filter(w=>w.kind!=='Neutro');
 expect(simulate(drawing).lamps.lamp.volts).toBeNull();
 drawing.wires.push({from:'src.L',to:'src.N',kind:'Fase'});
 expect(simulate(drawing).fault).toBeTruthy();
});

it('sin alimentación, todo borne carece de referencia aunque su ID sea undefined',()=>{
 const d=example();
 d.parts=[{kind:'lamp',id:'undefined',on:false,x:0,y:0}];d.wires=[];
 expect(simulate(d).lamps.undefined).toEqual({on:false,volts:null});
});

it('conserva la continuidad a través de una caja y mantiene la tierra fuera del retorno',()=>{
 const drawing=example();
 drawing.parts.push({id:'box',kind:'box',x:0,y:0,on:false});
 drawing.wires=drawing.wires.filter(w=>w.kind!=='Neutro');
 drawing.wires.push({from:'src.N',to:'box.J1',kind:'Neutro'},{from:'box.J3',to:'lamp.N',kind:'Neutro'});
 drawing.voltage=230;
 expect(simulate(drawing).lamps.lamp).toEqual({on:true,volts:230});
 drawing.wires[ drawing.wires.length-2 ].from='src.PE';
 expect(simulate(drawing).lamps.lamp).toEqual({on:false,volts:null});
});

it('dos bornes de lámpara al mismo potencial conocido tienen tensión cero',()=>{
 const drawing=example();
 drawing.wires=drawing.wires.filter(w=>w.kind!=='Retorno');
 drawing.wires.push({from:'src.N',to:'lamp.L',kind:'Retorno'});
 expect(simulate(drawing).lamps.lamp).toEqual({on:false,volts:0});
});
