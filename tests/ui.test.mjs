// Runs the production controller against a minimal DOM/event double.
// This verifies behavior, not browser layout, native dialog semantics or screen reader output.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LEVELS,findSolution } from '../engine.mjs';
import { STORAGE_KEY } from '../progress.mjs';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
let serial=0;
async function setup(seed,blocked=false){
  const ids=new Map();let doc;
  class Node {
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.attributes={};this.dataset={};this.className='';this.hidden=false;this.disabled=false;this._text='';this.open=false;this.classList={toggle:(cls,value)=>{const classes=new Set(this.className.split(' ').filter(Boolean));if(value)classes.add(cls);else classes.delete(cls);this.className=[...classes].join(' ');}};}
    set id(value){if(this._id)ids.delete(this._id);this._id=value;ids.set(value,this);} get id(){return this._id;}
    set textContent(value){this._text=String(value);this.children=[];} get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
    append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
    replaceChildren(...nodes){const drop=n=>{for(const c of n.children)drop(c);if(n.id&&ids.get(n.id)===n)ids.delete(n.id);};for(const node of this.children)drop(node);this._text='';this.children=[];this.append(...nodes);}
    setAttribute(key,value){this.attributes[key]=String(value);}
    addEventListener(type,callback){(this.listeners[type]??=[]).push(callback);}
    dispatch(type,event={}){const e={target:this,key:'',preventDefault(){this.prevented=true;},...event};for(const fn of this.listeners[type]??[])fn(e);return e;}
    click(){if(!this.disabled)this.dispatch('click');}
    focus(){if(!this.disabled)doc.activeElement=this;}
    showModal(){this.open=true;}
    close(value=''){this.returnValue=value;this.open=false;this.dispatch('close');}
  }
  doc=new Node('document');doc.createElement=tag=>new Node(tag);doc.getElementById=id=>ids.get(id)??null;
  for(const match of html.matchAll(/\bid="([^"]+)"/g)){const node=new Node();node.id=match[1];}
  const local=new Node();local.className='local';local.append(ids.get('save-status'));
  const data=new Map(seed?[[STORAGE_KEY,seed]]:[]),storage={getItem:key=>{if(blocked)throw Error('blocked');return data.get(key)??null;},setItem:(key,value)=>{if(blocked)throw Error('quota');data.set(key,value);}};
  const win=new Node('window');win.localStorage=storage;
  globalThis.document=doc;globalThis.window=win;
  await import(`../app.mjs?ui=${++serial}`);
  return {get:id=>ids.get(id),doc,win,data,save:()=>JSON.parse(data.get(STORAGE_KEY)),place:(weight,index)=>{ids.get(`weight-${weight}`).click();ids.get(`hook-${index}`).click();}};
}
test('all six mobiles can be completed through real controller events',async()=>{
  const ui=await setup();
  for(let i=0;i<6;i++){
    if(i)ui.get('next').click();
    findSolution(LEVELS[i]).forEach((weight,index)=>ui.place(weight,index));
    assert.equal(ui.get('win').hidden,false);assert.match(ui.get('status').textContent,/completado/);assert.equal(ui.save().completed[i].bestMoves,LEVELS[i].weights.length);
  }
  assert.match(ui.get('win-title').textContent,/calma/);assert.equal(Object.keys(ui.save().completed).length,6);
});
test('draft survives chapter change, reload and undo; reset only after confirmation',async()=>{
  let ui=await setup();ui.place(1,0);ui.get('level-nav').children[1].click();ui.get('level-nav').children[0].click();assert.equal(ui.save().run.slots[0],1);
  ui=await setup(ui.data.get(STORAGE_KEY));assert.match(ui.get('hook-0').attributes['aria-label'],/peso 1/);
  ui.place(2,1);ui.get('undo').click();assert.equal(ui.save().run.slots[1],null);
  ui.get('restart').click();assert.equal(ui.get('confirm-dialog').open,true);ui.get('confirm-dialog').close('cancel');assert.equal(ui.save().run.slots[0],1);
  ui.get('restart').click();ui.get('confirm-dialog').close('confirm');assert.deepEqual(ui.save().run.slots,[null,null,null,null]);assert.equal(ui.doc.activeElement,ui.get('restart'));
});
test('victory survives replay reset; erase cancel and confirm have distinct results',async()=>{
  const ui=await setup();findSolution(LEVELS[0]).forEach((w,i)=>ui.place(w,i));ui.get('restart').click();ui.get('confirm-dialog').close('confirm');assert.equal(ui.save().completed[0].bestMoves,4);
  ui.get('erase').click();ui.get('confirm-dialog').close('cancel');assert.equal(Object.keys(ui.save().completed).length,1);
  ui.get('erase').click();ui.get('confirm-dialog').close('confirm');assert.deepEqual(ui.save().completed,{});assert.match(ui.get('status').textContent,/borrado/);
});
test('keyboard navigation, removal, cancellation, undo and dialog guard',async()=>{
  const ui=await setup();ui.get('hook-0').dispatch('keydown',{key:'ArrowLeft'});assert.equal(ui.doc.activeElement,ui.get('hook-3'));
  ui.get('weight-1').click();ui.doc.dispatch('keydown',{key:'Escape'});assert.equal(ui.get('weight-1').attributes['aria-pressed'],'false');assert.equal(ui.doc.activeElement,ui.get('weight-1'));
  ui.place(1,0);ui.get('hook-0').dispatch('keydown',{key:'Delete'});assert.equal(ui.save().run.slots[0],null);
  ui.doc.dispatch('keydown',{key:'z'});assert.equal(ui.save().run.slots[0],1);
  ui.get('restart').click();ui.doc.dispatch('keydown',{key:'z'});assert.equal(ui.save().run.slots[0],1);ui.get('confirm-dialog').close('');assert.equal(ui.save().run.slots[0],1);
});
test('hints announce without altering board and blocked storage remains playable',async()=>{
  const ui=await setup(undefined,true);assert.match(ui.get('save-status').textContent,/No se puede guardar/);
  ui.get('hint').click();assert.match(ui.get('status').textContent,/Pista: coloca/);assert.match(ui.get('move-count').textContent,/0 movimientos/);
  ui.place(1,0);assert.match(ui.get('hook-0').attributes['aria-label'],/peso 1/);
});
test('a competing tab blocks future writes until reload',async()=>{
  const ui=await setup();ui.place(1,0);const saved=ui.data.get(STORAGE_KEY);ui.win.dispatch('storage',{key:STORAGE_KEY});ui.place(2,1);assert.equal(ui.data.get(STORAGE_KEY),saved);assert.match(ui.get('save-status').textContent,/no guardará/);
});
test('HTML provides language, landmarks, live result and destructive dialog',()=>{
  assert.match(html,/<html lang="es">/);assert.match(html,/<main>/);assert.match(html,/aria-live="polite"/);assert.match(html,/<dialog[^>]+aria-describedby="confirm-copy"/);assert.match(html,/id="cancel"[^>]+autofocus/);
});
