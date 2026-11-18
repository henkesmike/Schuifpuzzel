import { dragStops, clampOffset, nearestStop } from './drag-plan.js';
/** Tijdelijke sleepcoördinaten staan los van het echte bord. Pas na het landen wordt een zet uitgevoerd. */
export class BoardMotion {
    board;
    state;
    select;
    commit;
    unlockSound;
    gesture = null;
    settling = false;
    get busy() { return this.settling || this.gesture !== null; }
    constructor(board, state, select, commit, unlockSound) {
        this.board = board;
        this.state = state;
        this.select = select;
        this.commit = commit;
        this.unlockSound = unlockSound;
        board.addEventListener('pointerdown', e => this.start(e));
        board.addEventListener('pointermove', e => this.drag(e));
        board.addEventListener('pointerup', e => this.end(e, false));
        board.addEventListener('pointercancel', e => this.end(e, true));
        board.addEventListener('lostpointercapture', e => this.end(e, true));
    }
    point(event) {
        const matrix = this.board.getScreenCTM();
        return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : new DOMPoint();
    }
    nodes(id) {
        const state = this.state();
        const coupled = Array.isArray(state.support) && (id === 'bar' || state.support.includes(id));
        const ids = coupled ? [...state.support, 'bar'] : [id];
        return ids.map(id => this.board.querySelector(`[data-id="${id}"]`)).filter(Boolean).map(element => ({ element, base: element.getAttribute('transform') || '' }));
    }
    offset(nodes, x, y) {
        nodes.forEach(n => n.element.setAttribute('transform', `${n.base} translate(${x},${y})`));
    }
    start(event) {
        if (this.busy || !event.isPrimary || event.button !== 0)
            return;
        const target = event.target.closest('[data-select-id], [data-id]');
        const id = target?.getAttribute('data-select-id') ?? target?.getAttribute('data-id');
        if (!id)
            return;
        event.preventDefault();
        this.unlockSound();
        this.select(id);
        this.gesture = { pointer: event.pointerId, start: this.point(event), axis: null, stops: dragStops(this.state(), id), nodes: this.nodes(id), movingNodes: [], x: 0, y: 0 };
        this.board.setPointerCapture(event.pointerId);
        this.board.classList.add('dragging');
    }
    drag(event) {
        const g = this.gesture;
        if (!g || g.pointer !== event.pointerId)
            return;
        const p = this.point(event), dx = p.x - g.start.x, dy = p.y - g.start.y;
        // Net als de Android-versie begrenzen we de beweging tot de vrije ruimte.
        // Een eenmaal gekozen as blijft vast om onrustig verspringen tijdens slepen te voorkomen.
        if (!g.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 4)
            g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        g.x = g.axis === 'x' ? clampOffset(dx, g.stops.filter(s => s.y === 0), 'x') : 0;
        g.y = g.axis === 'y' ? clampOffset(dy, g.stops.filter(s => s.x === 0), 'y') : 0;
        // Bij omkeren kan een blokbeweging in een staafbeweging veranderen, of andersom.
        // Zet eerst alle onderdelen terug en verplaats alleen de bedoelde onderdelen.
        this.offset(g.nodes, 0, 0);
        const intended = g.stops.find(stop => stop.moves.length &&
            (g.axis === 'x' ? stop.y === 0 && Math.sign(stop.x) === Math.sign(dx) : stop.x === 0 && Math.sign(stop.y) === Math.sign(dy)));
        g.movingNodes = intended?.moves[0].kind === 'transfer'
            ? g.nodes.filter(node => node.element.getAttribute('data-id') === 'bar') : g.nodes;
        this.offset(g.movingNodes, g.x, g.y);
    }
    end(event, cancelled) {
        const g = this.gesture;
        if (!g || event.pointerId !== g.pointer)
            return;
        if (!cancelled)
            this.drag(event);
        this.gesture = null;
        this.board.classList.remove('dragging');
        if (this.board.hasPointerCapture(g.pointer))
            this.board.releasePointerCapture(g.pointer);
        const stops = g.stops.filter(s => !g.axis || (g.axis === 'x' ? s.y === 0 : s.x === 0));
        const destination = cancelled ? g.stops[0] : nearestStop(g.x, g.y, stops);
        void this.settle(g.movingNodes, g.x, g.y, destination);
    }
    /** Knoppen en toetsen gebruiken precies dezelfde rustige landingsanimatie. */
    perform(selected, move) {
        if (this.busy)
            return;
        this.unlockSound();
        const destination = dragStops(this.state(), selected).find(s => s.moves.length === 1 && s.moves[0].kind === move.kind && s.moves[0].dx === move.dx && s.moves[0].dy === move.dy);
        if (destination) {
            const nodes = this.nodes(selected).filter(node => move.kind !== 'transfer' || node.element.getAttribute('data-id') === 'bar');
            void this.settle(nodes, 0, 0, destination);
        }
    }
    async settle(nodes, fromX, fromY, to) {
        this.settling = true;
        const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 190;
        await new Promise(resolve => {
            const start = performance.now();
            const frame = (time) => {
                const progress = duration === 0 ? 1 : Math.min(1, (time - start) / duration);
                const ease = 1 - Math.pow(1 - progress, 3);
                this.offset(nodes, fromX + (to.x - fromX) * ease, fromY + (to.y - fromY) * ease);
                if (progress < 1)
                    requestAnimationFrame(frame);
                else
                    resolve();
            };
            requestAnimationFrame(frame);
        });
        this.settling = false;
        if (to.moves.length)
            this.commit(to.moves);
    }
}
