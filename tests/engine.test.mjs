import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, emptySlots, evaluate, findSolution, place, remove, validSlots } from '../engine.mjs';

function* permutations(items) { if(!items.length){yield [];return;} for(let i=0;i<items.length;i++) for(const tail of permutations(items.filter((_,j)=>i!==j))) yield [items[i],...tail]; }
function independentWin(level,values) {
  const count=level.left.length;
  const signed=(distances,weights)=>distances.reduce((sum,d,i)=>sum+d*weights[i],0);
  const sum=items=>items.reduce((a,b)=>a+b,0);
  return signed(level.left,values.slice(0,count))===0 && signed(level.right,values.slice(count))===0 && sum(values.slice(0,count))*level.root[0]===sum(values.slice(count))*level.root[1];
}
for(const [index,level] of LEVELS.entries()) {
  test(`mobile ${index+1}: independent exhaustive balance oracle and solvability`,()=>{
    let solutions=0,arrangements=0;
    for(const values of permutations(level.weights)) {
      arrangements++;const expected=independentWin(level,values);
      assert.equal(evaluate(level,values).solved,expected);
      if(expected)solutions++;
    }
    assert.ok(solutions>0);assert.ok(solutions<arrangements/2);
    assert.ok(independentWin(level,findSolution(level)));
    console.log(`MOBILE ${index+1}: ${solutions} solutions / ${arrangements} permutations`);
  });
}
test('empty and partially balanced mobiles cannot win',()=>{
  for(const level of LEVELS){const slots=emptySlots(level);assert.equal(evaluate(level,slots).solved,false);slots[0]=level.weights[0];assert.equal(evaluate(level,slots).solved,false);}
});
test('torque uses distances, while mother bar uses branch total mass',()=>{
  const result=evaluate(LEVELS[0],[1,3,2,6]);
  assert.deepEqual(result.left,{left:3,right:3});assert.deepEqual(result.totals,[4,8]);assert.deepEqual(result.root,{left:8,right:8});assert.equal(result.solved,true);
});
test('shelf placement replaces destination and swapping conserves unique weights',()=>{
  const level=LEVELS[0];let slots=place(level,emptySlots(level),1,0);slots=place(level,slots,2,1);
  assert.deepEqual(place(level,slots,1,1),[2,1,null,null]);
  assert.deepEqual(place(level,slots,3,1),[1,3,null,null]);
  assert.deepEqual(remove(level,slots,0),[null,2,null,null]);assert.deepEqual(slots,[1,2,null,null]);
});
test('invalid moves are atomic no-ops and malformed boards are rejected',()=>{
  const level=LEVELS[0],slots=emptySlots(level);
  for(const [w,i] of [[8,0],[1,-1],[1,100],[1,1.5]])assert.equal(place(level,slots,w,i),slots);
  assert.equal(remove(level,slots,0),slots);assert.equal(remove(level,slots,-1),slots);
  assert.equal(validSlots(level,[1,1,null,null]),false);assert.equal(validSlots(level,[0,2,3,6]),false);assert.equal(validSlots(level,['1',2,3,6]),false);
  assert.throws(()=>evaluate(level,[1,1,null,null]),TypeError);
});
test('hints preserve a compatible prefix and detect incompatible placements',()=>{
  for(const level of LEVELS){const full=findSolution(level);const prefix=emptySlots(level);prefix[0]=full[0];assert.equal(findSolution(level,prefix)[0],full[0]);assert.deepEqual(prefix,[full[0],...Array(prefix.length-1).fill(null)]);}
  assert.equal(findSolution(LEVELS[0],[6,1,null,null]),null);
});
