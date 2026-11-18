/**
 * Bereid beide kleuren eenmaal voor voordat de speler kan schuiven.
 * decode() pakt de PNG alvast uit, zodat de eerste kleurwisseling niet hoeft te wachten.
 */
const SHAPES = ['square', 'vertical', 'horizontal', 'right', 'left', 'through'];
const FILES = [
    ...SHAPES.flatMap(shape => ['mint', 'violet'].map(color => `${shape}-${color}.png`)),
    ...['dock-left', 'dock-right'].flatMap(shape => ['cream', 'violet'].map(color => `${shape}-${color}.png`)),
    'rod-pink.png'
];
// Houd ook de nog onzichtbare kleurvarianten in het geheugen gereed.
const decodedArtwork = [];
let preparation = null;
export function prepareArtwork() {
    preparation ??= Promise.all(FILES.map(async (file) => {
        const image = new Image();
        image.src = `./assets/${file}`;
        try {
            await image.decode();
            decodedArtwork.push(image);
        }
        catch {
            // Eén ontbrekend plaatje mag het hele spel niet blokkeren.
            // De normale SVG-weergave kan dat bestand later opnieuw proberen.
        }
    })).then(() => { });
    return preparation;
}
