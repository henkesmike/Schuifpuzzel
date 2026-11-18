import { State, initialState, validState } from './model.js';
const KEY='staafpuzzel-v1';
/** Opslag is optioneel: privéstand of een volle opslag mag het spelen niet blokkeren. */
export function load():State {
  try { const value:unknown=JSON.parse(localStorage.getItem(KEY)||'null'); if(validState(value)) return value; } catch { /* Begin veilig opnieuw bij beschadigde opslag. */ }
  return initialState();
}
export function save(state:State):boolean {
  try {localStorage.setItem(KEY,JSON.stringify(state));return true;} catch {return false;}
}
