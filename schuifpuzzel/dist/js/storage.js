import { initialState, validState } from './model.js';
const KEY = 'staafpuzzel-v1';
/** Opslag is optioneel: privéstand of een volle opslag mag het spelen niet blokkeren. */
export function load() {
    try {
        const value = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (validState(value))
            return value;
    }
    catch { /* Begin veilig opnieuw bij beschadigde opslag. */ }
    return initialState();
}
export function save(state) {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
        return true;
    }
    catch {
        return false;
    }
}
