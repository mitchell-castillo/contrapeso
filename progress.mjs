import { LEVELS, emptySlots, validSlots, evaluate } from './engine.mjs';
export const STORAGE_KEY = 'daily-games:contrapeso:v1';
export const freshProgress = () => ({ version: 1, currentLevel: 0, completed: {}, run: null, drafts: {}, updatedAt: null });
export function normalize(value) {
  const result = freshProgress();
  if (!value || value.version !== 1) return result;
  if (Number.isInteger(value.currentLevel) && value.currentLevel >= 0 && value.currentLevel < LEVELS.length) result.currentLevel = value.currentLevel;
  if (value.completed && typeof value.completed === 'object') for (let i=0;i<LEVELS.length;i++) {
    const moves = value.completed[i]?.bestMoves;
    if (Number.isInteger(moves) && moves >= LEVELS[i].weights.length && moves <= 99999) result.completed[i] = { bestMoves: moves };
  }
  function cleanRun(run,index) {
    const level=LEVELS[index];
    if (!run || run.level!==index || !validSlots(level,run.slots) || !Number.isInteger(run.moves) || run.moves<run.slots.filter(w=>w!==null).length || run.moves>99999) return null;
    if (evaluate(level,run.slots).solved) recordCompletion(result,index,run.moves);
    return {level:index,slots:run.slots.slice(),moves:run.moves};
  }
  for(let i=0;i<LEVELS.length;i++) { const draft=cleanRun(value.drafts?.[i],i); if(draft)result.drafts[i]=draft; }
  result.run=cleanRun(value.run,result.currentLevel) ?? result.drafts[result.currentLevel] ?? null;
  if (typeof value.updatedAt === 'string') result.updatedAt = value.updatedAt;
  return result;
}
export function recordCompletion(progress,index,moves) {
  const previous = progress.completed[index]?.bestMoves ?? Infinity;
  progress.completed[index] = { bestMoves: Math.min(previous,moves) };
}
export function readProgress(storage) {
  let raw;
  try { raw = storage.getItem(STORAGE_KEY); } catch { return { progress: freshProgress(), status: 'unavailable' }; }
  if (raw === null) return { progress: freshProgress(), status: 'ok' };
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return { progress: freshProgress(), status: 'recovered' };
    return { progress: normalize(value), status: 'ok' };
  } catch { return { progress: freshProgress(), status: 'recovered' }; }
}
export function writeProgress(storage,progress) {
  try { storage.setItem(STORAGE_KEY,JSON.stringify({ ...progress, updatedAt: new Date().toISOString() })); return true; } catch { return false; }
}
export function newRun(index) { return { level: index, slots: emptySlots(LEVELS[index]), moves: 0 }; }
