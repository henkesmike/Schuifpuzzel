import { DOCKS, cells, size, clone, validState } from './model.js';
const DIRECTIONS = [{ dx: -1, dy: 0, label: 'Links' }, { dx: 1, dy: 0, label: 'Rechts' }, { dx: 0, dy: -1, label: 'Omhoog' }, { dx: 0, dy: 1, label: 'Omlaag' }];
export function barPosition(s) {
    if (s.support === 'start')
        return DOCKS[0];
    if (s.support === 'finish')
        return DOCKS[1];
    return s.pieces.find(p => p.id === s.support[0]);
}
export function coupledIds(s, id) {
    return Array.isArray(s.support) && s.support.includes(id) ? s.support : [id];
}
/** Beweeg de volledige groep één vak. Alleen de eigen huidige vakken mogen overlappen. */
function canSlide(s, ids, dx, dy) {
    const obstacles = new Set(DOCKS.flatMap(d => [`${d.x},${d.y}`, `${d.x + 1},${d.y}`]));
    s.pieces.filter(p => !ids.includes(p.id)).forEach(p => cells(p).forEach(c => obstacles.add(c)));
    return ids.every(id => {
        const p = s.pieces.find(p => p.id === id), [w, h] = size(p);
        const moved = { ...p, x: p.x + dx, y: p.y + dy };
        return moved.x >= 0 && moved.y >= 0 && moved.x + w <= 5 && moved.y + h <= 4 && cells(moved).every(c => !obstacles.has(c));
    });
}
function pairAt(s, x, y, leftShape, rightShape) {
    const a = s.pieces.find(p => p.x === x && p.y === y && p.shape === leftShape);
    const b = s.pieces.find(p => p.x === x + 1 && p.y === y && p.shape === rightShape);
    return a && b ? [a.id, b.id] : undefined;
}
/** De staaf schuift apart; de dragende blokken blijven bij een overdracht staan. */
export function transfers(s) {
    const result = [];
    const add = (support, dx) => {
        if (support)
            result.push({ kind: 'transfer', label: dx > 0 ? 'Staaf naar rechts' : 'Staaf naar links', dx, dy: 0, ids: [], support });
    };
    if (s.support === 'start')
        add(pairAt(s, 3, 0, 'through', 'left'), 2);
    else if (s.support === 'finish')
        add(pairAt(s, 0, 3, 'right', 'through'), -2);
    else {
        const a = s.pieces.find(p => p.id === s.support[0]);
        if (a.shape === 'right')
            add(pairAt(s, a.x + 1, a.y, 'through', 'left'), 1);
        if (a.shape === 'through')
            add(pairAt(s, a.x - 1, a.y, 'right', 'through'), -1);
        if (a.x === 3 && a.y === 0 && a.shape === 'through')
            add('start', -2);
        if (a.x === 0 && a.y === 3 && a.shape === 'right')
            add('finish', 2);
    }
    return result;
}
export function legalMoves(s, selected) {
    if (selected === 'bar')
        return transfers(s);
    const ids = coupledIds(s, selected);
    if (!s.pieces.some(p => p.id === selected))
        return [];
    return DIRECTIONS.filter(d => canSlide(s, ids, d.dx, d.dy)).map(d => ({ ...d, ids, kind: 'slide' }));
}
/** Een zet wordt opnieuw gecontroleerd, zodat de bediening nooit regels kan omzeilen. */
export function applyMove(s, move) {
    const selected = move.kind === 'transfer' ? 'bar' : move.ids[0];
    const allowed = legalMoves(s, selected).find(m => m.kind === move.kind && m.dx === move.dx && m.dy === move.dy && JSON.stringify(m.ids) === JSON.stringify(move.ids) && JSON.stringify(m.support) === JSON.stringify(move.support));
    if (!allowed)
        throw new Error('Deze zet is niet toegestaan.');
    const next = clone(s);
    if (allowed.kind === 'transfer')
        next.support = allowed.support;
    else
        next.pieces.filter(p => allowed.ids.includes(p.id)).forEach(p => { p.x += allowed.dx; p.y += allowed.dy; });
    next.moves++;
    if (!validState(next))
        throw new Error('Ongeldige bordtoestand.');
    return next;
}
export const isSolved = (s) => s.support === 'finish';
