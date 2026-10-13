// Aviso global para que el sidebar recargue colecciones y taxonomías tras crearlas/editarlas
const STRUCTURE_CHANGED = 'raco:structure-changed';

export function notifyStructureChanged() {
  window.dispatchEvent(new Event(STRUCTURE_CHANGED));
}

export function onStructureChanged(handler: () => void) {
  window.addEventListener(STRUCTURE_CHANGED, handler);
  return () => window.removeEventListener(STRUCTURE_CHANGED, handler);
}
