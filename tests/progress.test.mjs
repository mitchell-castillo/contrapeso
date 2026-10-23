import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS,findSolution } from '../engine.mjs';
import { STORAGE_KEY,freshProgress,normalize,newRun,readProgress,writeProgress,recordCompletion } from '../progress.mjs';
const memory=()=>{const map=new Map();return{map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};
test('storage roundtrip preserves positions, all drafts and completion best',()=>{
  const storage=memory(),p=freshProgress();p.run=newRun(0);p.run.slots[0]=1;p.run.moves=1;p.drafts[0]=p.run;writeProgress(storage,p);
  const loaded=readProgress(storage);assert.equal(loaded.status,'ok');assert.deepEqual(loaded.progress.run.slots,[1,null,null,null]);assert.deepEqual(loaded.progress.drafts[0].slots,[1,null,null,null]);
  recordCompletion(p,0,8);recordCompletion(p,0,4);recordCompletion(p,0,7);assert.equal(p.completed[0].bestMoves,4);
});
test('blocked storage and corrupt/versioned data recover safely',()=>{
  const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
  assert.equal(readProgress(blocked).status,'unavailable');assert.equal(writeProgress(blocked,freshProgress()),false);
  for(const raw of ['{broken','null','{"version":99}'])assert.equal(readProgress({getItem:()=>raw}).status,'recovered');
  assert.equal(readProgress(memory()).status,'ok');
});
test('validation rejects duplicate weights, invalid moves, out-of-range chapter and fake records',()=>{
  const p=normalize({version:1,currentLevel:20,completed:{0:{bestMoves:-1},9:{bestMoves:8}},run:{level:0,slots:[1,1,null,null],moves:2}});
  assert.equal(p.currentLevel,0);assert.deepEqual(p.completed,{});assert.equal(p.run,null);
  assert.equal(normalize({version:1,currentLevel:0,run:{level:0,slots:[1,null,null,null],moves:0}}).run,null);
});
test('all six completed chapters and interrupted completion normalize correctly',()=>{
  const p=freshProgress();LEVELS.forEach((l,i)=>recordCompletion(p,i,l.weights.length));p.currentLevel=5;p.run={level:5,slots:findSolution(LEVELS[5]),moves:6};
  assert.equal(Object.keys(normalize(p).completed).length,6);
  p.completed={};assert.equal(normalize(p).completed[5].bestMoves,6);
});
test('only the own key is written, keeping unrelated storage intact',()=>{
  const storage=memory();storage.setItem('other-game','keep');writeProgress(storage,freshProgress());assert.equal(storage.getItem('other-game'),'keep');assert.deepEqual([...storage.map.keys()],['other-game',STORAGE_KEY]);
});
