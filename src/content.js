/**
 * French teaching copy. The experiment is a scenario, not a quantitative model.
 * Source review: evidence/science-review.md (2026-10-18).
 */
export const COMPONENTS = [
  {
    id: 'heater', number: '01', title: 'Le chauffage', kicker: 'Apporter de l’énergie',
    role: 'Le chauffage électrique fournit l’énergie nécessaire pour vaporiser une partie de l’eau.',
    detail: 'Il chauffe le ballon. L’arrêt intervient alors qu’il reste encore du liquide.',
    focus: 'flask', sourceIds: ['mit'],
  },
  {
    id: 'flask', number: '02', title: 'Le ballon', kicker: 'Séparer l’eau du sel',
    role: 'Il contient la solution de départ : de l’eau dans laquelle le sel est dissous.',
    detail: 'L’eau peut passer à l’état gazeux. Le sel, non volatil dans ces conditions, reste dans le ballon : la solution devient plus concentrée.',
    focus: 'flask', sourceIds: ['acs', 'purdue'],
  },
  {
    id: 'head', number: '03', title: 'La tête de distillation', kicker: 'Guider la vapeur',
    role: 'Elle relie le ballon au réfrigérant et dirige la vapeur vers celui-ci.',
    detail: 'Les traceurs montrent un trajet invisible à l’œil nu : la vapeur d’eau est un gaz, pas un nuage de gouttes.',
    focus: 'overview', sourceIds: ['mit', 'nasa'],
  },
  {
    id: 'thermometer', number: '04', title: 'Le thermomètre', kicker: 'Observer la vapeur',
    role: 'Sa sonde se trouve au départ du conduit latéral, sur le passage de la vapeur.',
    detail: 'Elle renseigne sur la vapeur à cet endroit. L’indication est qualitative : aucune température n’est calculée dans cette démonstration.',
    focus: 'flask', sourceIds: ['mit', 'purdue'],
  },
  {
    id: 'condenser', number: '05', title: 'Le réfrigérant', kicker: 'Redevenir liquide',
    role: 'La vapeur se refroidit contre la paroi du tube intérieur et se condense.',
    detail: 'Autour de ce tube, de l’eau de refroidissement emporte la chaleur. Les deux circuits sont séparés par le verre.',
    focus: 'condenser', sourceIds: ['mit'],
  },
  {
    id: 'cooling', number: '06', title: 'Le refroidissement', kicker: 'Un circuit indépendant',
    role: 'L’eau de refroidissement entre par le raccord bas et ressort par le raccord haut.',
    detail: 'Elle circule dans l’enveloppe du réfrigérant. Elle ne rejoint jamais le distillat.',
    focus: 'condenser', sourceIds: ['mit'],
  },
  {
    id: 'receiver', number: '07', title: 'Le collecteur', kicker: 'Recueillir le distillat',
    role: 'Il reçoit l’eau redevenue liquide, appelée distillat.',
    detail: 'Dans cet exemple eau–sel, le sel reste dans le ballon. L’expérience explique une séparation ; elle ne certifie pas la potabilité d’une eau réelle.',
    focus: 'receiver', sourceIds: ['acs'],
  },
];

/** Copy follows the applied state, never the direction of timeline travel. */
export function describeComponent(id, state) {
  const { progress, stageId, heat, boiling, vapor, condensing, collecting, coolant, transfer } = state;
  const initial = stageId === 'initial';
  const final = stageId === 'final';

  switch (id) {
    case 'heater':
      if (initial) return 'Le chauffage est éteint. Le montage est prêt pour le début de la démonstration.';
      if (progress < 0.86 && heat === 0) return 'Le chauffage se met en route. L’apport d’énergie va progressivement réchauffer la solution.';
      if (heat > 0) return 'Le chauffage apporte de l’énergie à la solution. Il ne chauffe pas directement le collecteur.';
      return 'Le chauffage est coupé. Le ballon contient encore de la solution : on ne poursuit pas jusqu’à l’assèchement.';

    case 'flask':
      if (final) return 'Une partie de l’eau a été recueillie dans le collecteur. Le sel reste dissous dans le ballon, dans une solution plus concentrée ; il reste du liquide.';
      if (boiling > 0) return 'Une partie de l’eau se vaporise. À mesure que l’eau quitte le ballon, le liquide restant se concentre en sel.';
      if (heat > 0) return 'La solution se réchauffe. Le sel reste dissous dans l’eau ; aucun cristal n’est représenté.';
      if (transfer > 0) return 'L’ébullition a cessé. Il reste une solution saline plus concentrée dans le ballon.';
      return 'Le ballon contient la solution d’eau salée de départ. Le sel dissous n’est pas visible sous forme de grains.';

    case 'head':
      if (vapor > 0) return 'La vapeur d’eau traverse la tête vers le réfrigérant. Les traceurs sont des symboles : le gaz lui-même est invisible.';
      if (progress > 0.5) return 'Le passage de vapeur est terminé. Le conduit reste relié au réfrigérant.';
      return 'La vapeur issue du chauffage n’a pas encore rejoint ce passage. Il conduira l’eau à l’état gazeux vers le réfrigérant.';

    case 'thermometer':
      if (vapor > 0) return 'Le passage de vapeur réchauffe la sonde. L’indication ne représente pas une mesure de la température du liquide dans le ballon.';
      if (progress > 0.5) return 'Le passage de vapeur est terminé et la sonde refroidit. La démonstration n’en calcule pas la température.';
      return 'La sonde attend l’arrivée de la vapeur. Elle est placée dans la tête de distillation, au départ du conduit latéral.';

    case 'condenser':
      if (condensing > 0) return 'Au contact de la paroi refroidie, la vapeur redevient liquide. L’eau formée descend dans le tube intérieur vers le collecteur.';
      if (vapor > 0) return 'La vapeur approche du réfrigérant. Le refroidissement prépare la paroi à la condensation.';
      if (coolant > 0 && progress < 0.5) return 'L’eau de refroidissement circule déjà autour du tube intérieur, avant l’arrivée de la vapeur.';
      if (collecting > 0) return 'La condensation est terminée. Les dernières gouttes rejoignent le collecteur dans le tube intérieur.';
      if (progress > 0.5) return 'La condensation est terminée. Le distillat a rejoint le collecteur ; les circuits restent séparés.';
      return 'Le tube intérieur est prêt à recevoir la vapeur. Son enveloppe accueillera l’eau de refroidissement.';

    case 'cooling':
      if (coolant > 0) return 'L’eau entre en bas et sort en haut, autour du tube intérieur. Elle emporte la chaleur sans se mélanger à l’eau distillée.';
      if (final) return 'La circulation est arrêtée dans cet état final. Cette eau est restée dans son circuit indépendant.';
      return 'Le circuit est prêt. Son eau circulera de l’entrée basse vers la sortie haute du réfrigérant.';

    case 'receiver':
      if (collecting > 0) return 'Le distillat arrive goutte à goutte. Son niveau monte pendant que celui de la solution saline diminue dans le ballon.';
      if (transfer > 0) return 'La collecte est terminée. Le récipient contient l’eau séparée du sel dans ce scénario.';
      return 'Le collecteur est vide : aucune goutte de distillat ne l’a encore atteint.';

    default:
      return 'Sélectionnez un composant pour suivre son rôle à cet instant.';
  }
}

export const SOURCES = [
  {
    id: 'acs', title: 'ACS · Séparer l’eau du sel',
    url: 'https://www.acs.org/content/dam/acsorg/education/k-8/inquiry-in-action/fifth-grade/g5-l5.1-reading.pdf',
    claim: 'Vaporisation de l’eau, sel restant sur place, puis condensation (p. 2).',
  },
  {
    id: 'mit', title: 'MIT · Distillation I',
    url: 'https://live.ocw.mit.edu/courses/res-5-0001-digital-lab-techniques-manual-spring-2007/e5c70455310f147ba02fdd948461be64_GtuMlWMajtw.pdf',
    claim: 'Montage, thermomètre, sens du refroidissement et arrêt avant assèchement (p. 1–3).',
  },
  {
    id: 'purdue', title: 'Purdue · Ébullition des solutions',
    url: 'https://www.chem.purdue.edu/gchelp/solutions/eboil.html',
    claim: 'Le sel dissous élève la température d’ébullition par rapport à l’eau pure, à pression identique.',
  },
  {
    id: 'nasa', title: 'NASA · Une vapeur invisible',
    url: 'https://science.nasa.gov/kids/earth/how-do-clouds-form/',
    claim: 'La vapeur d’eau est un gaz invisible ; les gouttelettes sont de l’eau liquide.',
  },
];

export const SIMPLIFICATIONS = [
  '90 secondes de récit, pas 90 secondes d’expérience réelle. La frise indique l’avancement du scénario, pas un rendement.',
  'Traceurs, gouttes et couleurs servent à suivre les phénomènes. La vapeur d’eau est invisible et l’eau salée n’est pas naturellement colorée.',
  'Niveaux et proportions sont illustratifs. Aucun volume expérimental, débit réel ou bilan thermique n’est prédit.',
  'Les indications de température sont qualitatives. La solution salée ne bout pas exactement à la même température que l’eau pure.',
  'Le scénario représente de l’eau et du sel, sans impureté volatile ni entraînement de gouttes salées. Il s’arrête avant assèchement et avant cristallisation.',
];
