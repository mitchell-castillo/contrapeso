import { LEVELS, evaluate, place, remove, findSolution } from './engine.mjs';
import { STORAGE_KEY, readProgress, writeProgress, freshProgress, newRun, recordCompletion } from './progress.mjs';
const $ = id => document.getElementById(id);
const el = (tag,cls,text) => { const node = document.createElement(tag); if (cls) node.className=cls; if (text !== undefined) node.textContent=text; return node; };
let storage;
try { storage = window.localStorage; } catch { storage = { getItem(){throw new Error('storage blocked');},setItem(){throw new Error('storage blocked');} }; }
const loaded = readProgress(storage);
let progress = loaded.progress, run = progress.run ?? newRun(progress.currentLevel), selected = null, history = [], pending = null, opener = null;
let storageStatus = loaded.status;
const level = () => LEVELS[progress.currentLevel];
function announce(message) { $('status').textContent=message; }
function persist() {
  progress.run = { ...run, slots: run.slots.slice() };
  progress.drafts[progress.currentLevel] = { ...run, slots: run.slots.slice() };
  if (storageStatus!=='conflict' && !writeProgress(storage,progress)) storageStatus='unavailable';
  renderSave();
}
function renderSave() {
  const count = Object.keys(progress.completed).length;
  $('progress-count').textContent=`${count} de ${LEVELS.length} móviles completados en este navegador.`;
  const message = storageStatus === 'conflict' ? 'Otra pestaña cambió el progreso. Esta sesión no guardará más cambios. Recarga para usar la versión guardada.' : storageStatus === 'unavailable' ? 'No se puede guardar en este navegador. Puedes jugar, pero al cerrar perderás esta sesión.' : storageStatus === 'recovered' ? 'El guardado anterior no se pudo leer. Se ha iniciado un progreso nuevo en este navegador.' : 'Se guarda en este navegador. Sin cuentas ni sincronización. Borrar los datos del navegador borra tu avance.';
  $('save-status').textContent=message;
  $('save-status').parentElement.classList.toggle('warning',storageStatus!=='ok');
}
function forceText(value,filled) {
  if (value.left === value.right) return `${value.left} = ${value.right} · ${filled ? 'en equilibrio' : 'iguales por ahora'}`;
  return `${value.left} ${value.left>value.right ? '>' : '<'} ${value.right} · baja ${value.left>value.right ? 'izquierda' : 'derecha'}`;
}
function renderBalance(id,value,filled) {
  $(id).textContent=forceText(value,filled);
  $(id).classList.toggle('good',filled && value.left===value.right);
}
function renderHooks(container,distances,offset,branch) {
  const target=$(container); target.replaceChildren();
  distances.forEach((distance,i)=>{
    const index=offset+i, weight=run.slots[index], wrap=el('div','hook-wrap'), button=el('button','hook');
    button.type='button'; button.id=`hook-${index}`; button.dataset.index=String(index);
    const side=distance<0?'izquierda':'derecha';
    button.setAttribute('aria-label',`Rama ${branch}, gancho ${i+1}, ${side}, distancia ${Math.abs(distance)}, ${weight===null?'vacío':`peso ${weight}`}. ${selected===null ? 'Activar para retirar si está ocupado.' : `Colocar peso ${selected}.`}`);
    button.append(el('span','disk',weight===null?'·':String(weight)),el('span','distance',`${distance<0?'I':'D'} · ${Math.abs(distance)}`));
    button.addEventListener('click',()=>{
      const next = selected===null ? remove(level(),run.slots,index) : place(level(),run.slots,selected,index);
      commit(next,selected===null ? 'Peso retirado.' : `Peso ${selected} colocado.`);
      $('hook-'+index).focus();
    });
    button.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight') {
        event.preventDefault(); const delta=event.key==='ArrowRight'?1:-1;
        $('hook-'+((index+delta+run.slots.length)%run.slots.length)).focus();
      } else if (event.key==='Delete'||event.key==='Backspace') {
        event.preventDefault(); commit(remove(level(),run.slots,index),'Peso retirado.'); $('hook-'+index).focus();
      }
    });
    wrap.append(button); target.append(wrap);
  });
}
function render() {
  const config=level(), result=evaluate(config,run.slots), index=progress.currentLevel;
  $('level-number').textContent=`MÓVIL ${String(index+1).padStart(2,'0')} / 06`;
  $('level-title').textContent=config.name; $('level-note').textContent=config.note;
  $('move-count').textContent=`${run.moves} movimientos`;
  $('level-nav').replaceChildren(...LEVELS.map((item,i)=>{
    const button=el('button',progress.completed[i]?'done':'',String(i+1).padStart(2,'0')); button.type='button';
    button.setAttribute('aria-label',`Móvil ${i+1}: ${item.name}${progress.completed[i]?', completado':''}`);
    if(i===index) button.setAttribute('aria-current','step');
    button.addEventListener('click',()=>{ if(i===index)return; changeLevel(i); }); return button;
  }));
  $('left-total').textContent=`${result.totals[0]} de peso × brazo ${config.root[0]}`;
  $('right-total').textContent=`${result.totals[1]} de peso × brazo ${config.root[1]}`;
  renderBalance('root-balance',result.root,result.filled);
  renderBalance('left-balance',result.left,run.slots.slice(0,config.left.length).every(x=>x!==null));
  renderBalance('right-balance',result.right,run.slots.slice(config.left.length).every(x=>x!==null));
  renderHooks('left-hooks',config.left,0,'A'); renderHooks('right-hooks',config.right,config.left.length,'B');
  $('weights').replaceChildren(...config.weights.map(weight=>{
    const placed=run.slots.includes(weight), button=el('button',`weight${placed?' placed':''}`,String(weight)); button.type='button'; button.id=`weight-${weight}`;
    button.setAttribute('aria-pressed',String(selected===weight));
    button.setAttribute('aria-label',`Peso ${weight}${placed?', ya colgado: seleccionar para mover o intercambiar':''}`);
    button.addEventListener('click',()=>{selected=selected===weight?null:weight;render();$(`weight-${weight}`).focus();}); return button;
  }));
  $('selection').textContent=selected===null?'Elige un peso, o toca uno colgado para retirarlo.':`Peso ${selected} seleccionado. Elige un gancho; Escape cancela.`;
  $('undo').disabled=!history.length;
  $('win').hidden=!result.solved;
  if(result.solved) {
    const all=Object.keys(progress.completed).length===LEVELS.length;
    $('win-title').textContent=all?'Has encontrado la calma.':'Tres barras. Un equilibrio.';
    $('win-copy').textContent=`Móvil resuelto en ${run.moves} movimientos. Mejor marca: ${progress.completed[index]?.bestMoves??run.moves}.${all?' Has completado los seis móviles. Puedes volver a jugar cualquiera.':''}`;
    $('next').textContent=index===LEVELS.length-1?'Volver al primer móvil ↺':'Siguiente móvil →';
  }
  renderSave();
}
function commit(slots,message) {
  if(slots===run.slots) { announce('No hay cambios. Elige otro gancho o un peso.'); return; }
  history.push({ slots:run.slots.slice(),moves:run.moves }); if(history.length>200)history.shift();
  run={ ...run,slots,moves:Math.min(99999,run.moves+1) }; selected=null;
  const result=evaluate(level(),slots);
  if(result.solved) recordCompletion(progress,progress.currentLevel,run.moves);
  persist(); render(); announce(result.solved?`Móvil ${progress.currentLevel+1} completado. Las tres barras están en equilibrio.`:message);
}
function changeLevel(index) {
  // All chapters are open; unfinished arrangements survive chapter changes.
  progress.drafts[progress.currentLevel]={...run,slots:run.slots.slice()};
  progress.currentLevel=index; run=progress.drafts[index] ?? newRun(index); history=[];selected=null;persist();render();
  announce('Móvil cambiado. Tus posiciones y marcas se conservan.'); $('level-title').setAttribute('tabindex','-1'); $('level-title').focus();
}
function undo() {
  if(!history.length)return;
  run={ level:progress.currentLevel,...history.pop() };selected=null;persist();render();announce('Último movimiento deshecho.');(history.length?$('undo'):$('weights').children[0]).focus();
}
function confirmAction(action,title,copy,source) {
  pending=action;opener=source;$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;
  $('confirm-dialog').returnValue='';$('confirm-dialog').showModal();$('cancel').focus();
}
$('undo').addEventListener('click',undo);
$('next').addEventListener('click',()=>changeLevel((progress.currentLevel+1)%LEVELS.length));
$('restart').addEventListener('click',()=>confirmAction('restart','¿Reiniciar este móvil?','Se retirarán sus pesos y se pondrá el contador a cero. Tus móviles completados y mejores marcas se conservan.',$('restart')));
$('erase').addEventListener('click',()=>confirmAction('erase','¿Borrar todo tu progreso?','Se borrarán las seis marcas y la partida actual de Contrapeso en este navegador. Esta acción no se puede deshacer.',$('erase')));
$('confirm-dialog').addEventListener('close',()=>{
  const action=pending;pending=null;
  if($('confirm-dialog').returnValue==='confirm') {
    if(action==='erase') { progress=freshProgress(); storageStatus='ok'; }
    run=newRun(progress.currentLevel);selected=null;history=[];persist();render();
    announce(action==='erase'?'Progreso de Contrapeso borrado.':'Móvil reiniciado. Las marcas anteriores se conservan.');
  }
  opener?.focus();opener=null;
});
$('hint').addEventListener('click',()=>{
  if(evaluate(level(),run.slots).solved) { announce('Este móvil ya está en equilibrio. Puedes pasar al siguiente.');return; }
  const solution=findSolution(level(),run.slots);
  if(!solution) { announce('Los pesos colocados aún no permiten una solución. Prueba a retirar o intercambiar alguno: la barra superior depende del peso total de cada rama.');return; }
  const index=run.slots.indexOf(null), cut=level().left.length, distances=index<cut?level().left:level().right, localIndex=index<cut?index:index-cut;
  announce(`Pista: coloca el peso ${solution[index]} en la rama ${index<cut?'A':'B'}, gancho ${localIndex+1}, ${distances[localIndex]<0?'izquierda':'derecha'} a distancia ${Math.abs(distances[localIndex])}.`);
});
document.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||$('confirm-dialog').open)return;
  if(event.key==='Escape'&&selected!==null) {const active=document.activeElement?.id;selected=null;render();if(active)$(active)?.focus();announce('Selección cancelada.');}
  if(event.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName)) {event.preventDefault();undo();}
});
// This key is per game. No clear() and no access to another game's data.
window.addEventListener('storage',event=>{
  if(event.key===STORAGE_KEY||event.key===null) { storageStatus='conflict';renderSave();announce('El guardado cambió en otra pestaña. Recarga antes de seguir para usar esa versión.'); }
});
render();
if(storageStatus==='recovered') announce('Se ha recuperado un guardado ilegible iniciando una partida nueva.');
