import { prepareArtwork } from './artwork.js';
import { initialState, clone } from './model.js';
import { applyMove, isSolved } from './rules.js';
import { interactionMoves } from './interaction.js';
import { renderBoard } from './board-view.js';
import { BoardMotion } from './board-motion.js';
import { PuzzleSound } from './sound.js';
import { VictoryCelebration } from './victory.js';
import { load, save } from './storage.js';
const board = document.querySelector('#board');
const status = document.querySelector('#status');
let state = load(), selected = null;
let artworkReady = false;
const history = [];
const celebration = new VictoryCelebration(document.querySelector('#victory-canvas'), document.querySelector('#celebration-message'), board);
const sound = new PuzzleSound(document.querySelector('#sound'));
const motion = new BoardMotion(board, () => state, id => { selected = id; render(); }, play, () => sound.unlock());
function render() {
    if (!artworkReady)
        return;
    const focused = document.activeElement?.closest('[data-id]')?.getAttribute('data-id');
    renderBoard(board, state, selected);
    if (focused)
        board.querySelector(`[data-id="${focused}"]`)?.focus();
    document.querySelector('#move-count').textContent = String(state.moves).padStart(2, '0');
    document.querySelector('#undo').disabled = history.length === 0;
    document.querySelector('#reset').disabled = false;
    document.querySelector('#victory').hidden = !isSolved(state);
    if (!isSolved(state))
        celebration.stop();
}
function play(moves) {
    const wasSolved = isSolved(state);
    history.push(clone(state));
    for (const move of moves)
        state = applyMove(state, move);
    const won = !wasSolved && isSolved(state);
    void sound.play(won);
    const saved = save(state);
    status.textContent = isSolved(state) ? 'Gelukt! De staaf ligt in de onderste houder.' : saved ? 'Voortgang bewaard op dit apparaat.' : 'Je kunt spelen; opslaan is op dit apparaat niet beschikbaar.';
    render();
    if (won)
        celebration.play();
}
board.addEventListener('keydown', event => {
    if (motion.busy)
        return;
    if (event.key === 'Enter' || event.key === ' ') {
        const el = event.target.closest('[data-id]');
        if (el) {
            event.preventDefault();
            selected = el.getAttribute('data-id');
            render();
        }
        return;
    }
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = direction[event.key];
    if (!d || !selected)
        return;
    event.preventDefault();
    const move = interactionMoves(state, selected).find(m => Math.sign(m.dx) === d[0] && Math.sign(m.dy) === d[1]);
    if (move)
        motion.perform(selected, move);
});
// Escape wist alleen de selectie. De puzzel geeft geen aanwijzingen over mogelijke zetten.
document.addEventListener('keydown', event => { if (!motion.busy && !board.contains(event.target) && event.key === 'Escape') {
    selected = null;
    render();
} });
document.querySelector('#undo').addEventListener('click', () => { if (motion.busy)
    return; const previous = history.pop(); if (previous) {
    celebration.stop();
    sound.stop();
    state = previous;
    selected = null;
    save(state);
    status.textContent = 'Laatste zet teruggedraaid.';
    render();
} });
const resetDialog = document.querySelector('#reset-dialog');
document.querySelector('#reset').addEventListener('click', () => { if (!motion.busy)
    resetDialog.showModal(); });
document.querySelector('#confirm-reset').addEventListener('click', () => { celebration.stop(); sound.stop(); history.push(clone(state)); state = initialState(); selected = null; save(state); render(); resetDialog.close(); status.textContent = 'Een nieuw begin. Succes!'; });
document.querySelector('#cancel-reset').addEventListener('click', () => resetDialog.close());
document.addEventListener('visibilitychange', () => { if (document.hidden)
    sound.stop(); });
// De eerste weergave wacht eenmaal op beide kleuren. Daarna kan een overdracht
// direct de voorbereide paarse of turquoise afbeelding tonen.
async function start() {
    await prepareArtwork();
    artworkReady = true;
    render();
    document.querySelector('#loading-artwork').hidden = true;
    board.removeAttribute('aria-busy');
}
void start();
if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js').catch(() => { });
