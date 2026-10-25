/**
 * A deterministic teaching timeline, not a thermodynamic simulation.
 * All events use normalized scenario progress. Intensities and liquid fractions
 * are graphical quantities; none is an experimental measurement or yield.
 */
export const DURATION = 90;

export const EVENTS = Object.freeze({
  heatStart: 0.04,
  heatFull: 0.12,
  boilingStart: 0.20,
  boilingFull: 0.28,
  vaporStart: 0.22,
  vaporFull: 0.30,
  condensationStart: 0.28,
  condensationFull: 0.35,
  collectionStart: 0.38,
  collectionFull: 0.42,
  heatOff: 0.86,
  boilingEnd: 0.89,
  vaporEnd: 0.91,
  condensationFade: 0.90,
  condensationEnd: 0.95,
  collectionFade: 0.93,
  collectionEnd: 0.97,
  coolantFade: 0.97,
  coolantOff: 1,
});

export const STAGES = Object.freeze([
  { id: 'initial', label: 'Départ', progress: 0, summary: 'Une solution d’eau salée dans le ballon ; un récipient collecteur vide.' },
  { id: 'heating', label: 'Chauffe', progress: 0.04, summary: 'Le chauffage apporte de l’énergie. L’eau de refroidissement circule dans son propre circuit.' },
  { id: 'vapor', label: 'Premières vapeurs', progress: 0.22, summary: 'L’eau se vaporise, rejoint le réfrigérant puis s’y condense. Le sel reste dans le ballon.' },
  { id: 'collection', label: 'Collecte', progress: 0.38, summary: 'Vaporisation, condensation et collecte se produisent simultanément.' },
  { id: 'stopping', label: 'Arrêt', progress: 0.86, summary: 'Le chauffage est coupé. Les derniers transferts se terminent avant l’arrêt du refroidissement.' },
  { id: 'final', label: 'Bilan', progress: 1, summary: 'De l’eau a été recueillie. Une solution saline plus concentrée reste dans le ballon.' },
].map((stage) => Object.freeze(stage)));

const INITIAL_FRACTION = 0.58;
const TRANSFERRED_FRACTION = 0.28;

function clamp01(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function smoothstep(start, end, progress) {
  const t = clamp01((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function envelope(progress, start, full, fade, end) {
  return smoothstep(start, full, progress) * (1 - smoothstep(fade, end, progress));
}

/** Integral of the collection envelope, divided by its total area.
 * This aligns liquid movement with the displayed collection activity without
 * accumulating quantities per frame. The two displayed liquid quantities sum
 * to the same graphical total; vapor hold-up is deliberately not represented.
 */
function transferAt(progress) {
  const start = EVENTS.collectionStart;
  const full = EVENTS.collectionFull;
  const fade = EVENTS.collectionFade;
  const end = EVENTS.collectionEnd;
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const riseWidth = full - start;
  const fallWidth = end - fade;
  const totalArea = riseWidth / 2 + (fade - full) + fallWidth / 2;
  if (progress < full) {
    const t = (progress - start) / riseWidth;
    return riseWidth * (t ** 3 - t ** 4 / 2) / totalArea;
  }
  if (progress <= fade) return (riseWidth / 2 + progress - full) / totalArea;
  const t = (progress - fade) / fallWidth;
  return (riseWidth / 2 + fade - full + fallWidth * (t - t ** 3 + t ** 4 / 2)) / totalArea;
}

function statusAt(progress, stage) {
  if (stage.id === 'heating' && progress <= EVENTS.heatStart) {
    return 'Le chauffage et le circuit de refroidissement vont se mettre en route.';
  }
  if (stage.id === 'vapor') {
    if (progress <= EVENTS.vaporStart) {
      return 'La vapeur va rejoindre le réfrigérant. Le sel reste dans le ballon.';
    }
    return progress <= EVENTS.condensationStart
      ? 'L’eau se vaporise et progresse vers le réfrigérant. La vapeur d’eau est invisible ; les traceurs sont symboliques.'
      : 'Dans le tube intérieur refroidi, la vapeur devient liquide. Les deux circuits restent séparés.';
  }
  if (stage.id === 'collection' && progress <= EVENTS.collectionStart) {
    return 'La première goutte va rejoindre le collecteur. Vaporisation et condensation sont déjà en cours.';
  }
  if (stage.id === 'stopping' && progress >= EVENTS.collectionEnd) {
    return 'La collecte est terminée. Le refroidissement s’arrête à son tour ; le ballon contient encore une solution saline.';
  }
  return stage.summary;
}

/**
 * Return the complete scientific/graphical state at a scenario instant.
 * Inputs outside [0,1] are clamped; NaN and non-numbers select the initial state.
 * Camera, user selection, pause and playback speed intentionally live elsewhere.
 */
export function stateAt(input) {
  const progress = clamp01(input);
  let stage = STAGES[0];
  for (const candidate of STAGES) {
    if (progress >= candidate.progress) stage = candidate;
  }
  const transfer = transferAt(progress);
  const receiverFraction = TRANSFERRED_FRACTION * transfer;

  return Object.freeze({
    progress,
    seconds: progress * DURATION,
    stageId: stage.id,
    stageLabel: stage.label,
    heat: progress >= EVENTS.heatOff ? 0 : smoothstep(EVENTS.heatStart, EVENTS.heatFull, progress),
    coolant: envelope(progress, EVENTS.heatStart, EVENTS.heatFull, EVENTS.coolantFade, EVENTS.coolantOff),
    boiling: envelope(progress, EVENTS.boilingStart, EVENTS.boilingFull, EVENTS.heatOff, EVENTS.boilingEnd),
    vapor: envelope(progress, EVENTS.vaporStart, EVENTS.vaporFull, EVENTS.heatOff, EVENTS.vaporEnd),
    condensing: envelope(progress, EVENTS.condensationStart, EVENTS.condensationFull, EVENTS.condensationFade, EVENTS.condensationEnd),
    collecting: envelope(progress, EVENTS.collectionStart, EVENTS.collectionFull, EVENTS.collectionFade, EVENTS.collectionEnd),
    transfer,
    flaskFraction: INITIAL_FRACTION - receiverFraction,
    receiverFraction,
    status: statusAt(progress, stage),
  });
}
