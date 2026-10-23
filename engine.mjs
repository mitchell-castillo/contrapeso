// Pure rules. A negative hook distance is left of the fulcrum.
export const LEVELS = Object.freeze([
  { name: 'Primer equilibrio', note: 'Una rama pesa el doble. Su brazo debe medir la mitad.', weights: [1,2,3,6], left: [-3,1], right: [-3,1], root: [2,1] },
  { name: 'Brazos desiguales', note: 'Compara productos: un peso pequeño puede compensar uno grande.', weights: [2,3,4,6], left: [-3,2], right: [-3,2], root: [2,1] },
  { name: 'Tres ganchos', note: 'En el lado con dos ganchos, suma las dos fuerzas.', weights: [1,2,3,4,5,7], left: [-2,-1,1], right: [-2,-1,2], root: [1,1] },
  { name: 'El brazo largo', note: 'La barra superior también multiplica el peso de cada rama por su distancia.', weights: [1,2,3,4,6,8], left: [-4,-1,3], right: [-2,-1,2], root: [3,1] },
  { name: 'Doble balanza', note: 'Las ramas deben pesar lo mismo, pero sus fuerzas internas son distintas.', weights: [2,3,4,5,7,9], left: [-4,-1,2], right: [-3,-2,3], root: [1,1] },
  { name: 'Punto de calma', note: 'Tres equilibrios, una sola composición. Todo lo necesario está a la vista.', weights: [1,2,3,4,6,9], left: [-3,-1,1], right: [-4,-1,2], root: [3,2] }
].map(level => Object.freeze({ ...level, weights: Object.freeze(level.weights), left: Object.freeze(level.left), right: Object.freeze(level.right), root: Object.freeze(level.root) })));

export const hookCount = level => level.left.length + level.right.length;
export const emptySlots = level => Array(hookCount(level)).fill(null);
export function validSlots(level, slots) {
  if (!Array.isArray(slots) || slots.length !== hookCount(level)) return false;
  const used = slots.filter(x => x !== null);
  return used.every(x => level.weights.includes(x)) && new Set(used).size === used.length;
}
export function forces(distances, weights) {
  return distances.reduce((a,d,i) => {
    a[d < 0 ? 'left' : 'right'] += Math.abs(d) * (weights[i] ?? 0);
    return a;
  }, { left: 0, right: 0 });
}
export function evaluate(level, slots) {
  if (!validSlots(level, slots)) throw new TypeError('Invalid slots');
  const cut = level.left.length;
  const leftWeights = slots.slice(0,cut), rightWeights = slots.slice(cut);
  const total = weights => weights.reduce((sum,w) => sum + (w ?? 0),0);
  const left = forces(level.left,leftWeights), right = forces(level.right,rightWeights);
  const root = { left: total(leftWeights)*level.root[0], right: total(rightWeights)*level.root[1] };
  const filled = slots.every(x => x !== null);
  return { left, right, root, totals: [total(leftWeights),total(rightWeights)], filled,
    solved: filled && [left,right,root].every(x => x.left === x.right) };
}
// Places a shelf weight, or swaps a weight already on the mobile. Pure and atomic.
export function place(level, slots, weight, index) {
  if (!validSlots(level, slots) || !level.weights.includes(weight) || !Number.isInteger(index) || index < 0 || index >= slots.length) return slots;
  const previous = slots.indexOf(weight);
  if (previous === index) return slots;
  const next = slots.slice();
  if (previous >= 0) next[previous] = slots[index];
  next[index] = weight;
  return next;
}
export function remove(level, slots, index) {
  if (!validSlots(level,slots) || !Number.isInteger(index) || index < 0 || index >= slots.length || slots[index] === null) return slots;
  const next = slots.slice(); next[index] = null; return next;
}
export function findSolution(level, prefix = emptySlots(level)) {
  if (!validSlots(level,prefix)) return null;
  const slots = prefix.slice(), available = level.weights.filter(w => !slots.includes(w));
  function visit(remaining) {
    const index = slots.indexOf(null);
    if (index < 0) return evaluate(level,slots).solved ? slots.slice() : null;
    for (const weight of remaining) {
      slots[index] = weight;
      const found = visit(remaining.filter(w => w !== weight));
      if (found) return found;
    }
    slots[index] = null;
    return null;
  }
  return visit(available);
}
