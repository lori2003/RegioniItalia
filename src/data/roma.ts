/**
 * Dati per la sezione "Studia Roma".
 * Le coordinate sono su una tela stilizzata 820x820 (non geografiche): servono
 * a capire la disposizione relativa delle zone, delle vie e dei monumenti.
 * Il Tevere scorre da nord a sud; il Vaticano sta a ovest del fiume, il Centro
 * Storico nell'ansa a est.
 */

export type RomaCategory = 'antico' | 'religioso' | 'piazza' | 'museo' | 'parco' | 'moderno';

export const ROMA_CATEGORY_LABELS: Record<RomaCategory, string> = {
  antico: 'Roma antica',
  religioso: 'Chiese e basiliche',
  piazza: 'Piazze e fontane',
  museo: 'Musei',
  parco: 'Ville e parchi',
  moderno: 'Roma moderna',
};

export const ROMA_CATEGORY_COLORS: Record<RomaCategory, string> = {
  antico: '#c2733a',
  religioso: '#6f5bd0',
  piazza: '#d64f7a',
  museo: '#2f8f9d',
  parco: '#3f9a4f',
  moderno: '#5a7184',
};

export type RomaZone = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  polygon: string;
  labelAt: [number, number];
};

export type RomaMonument = {
  id: string;
  name: string;
  category: RomaCategory;
  zoneId: string;
  at: [number, number];
  blurb: string;
  tip: string;
};

export type RomaStreet = {
  id: string;
  name: string;
  kind: 'centro' | 'consolare' | 'lungotevere' | 'raccordo';
  path: string;
  labelAt: [number, number];
  rotate?: number;
  note: string;
};

export const ROMA_VIEWBOX = { width: 820, height: 820 };

/** Il Tevere e il suo affluente Aniene, come percorsi stilizzati. */
export const ROMA_RIVERS = {
  tevere:
    'M 452 20 C 420 120 352 150 360 246 C 366 316 430 336 402 408 C 380 466 316 480 338 560 C 356 628 320 690 300 812',
  aniene: 'M 812 250 C 700 262 620 300 520 322',
};

/** Cinta muraria aureliana, accennata attorno al centro. */
export const ROMA_WALLS =
  'M 300 250 C 240 300 235 430 300 520 C 360 600 520 620 620 540 C 700 470 690 300 600 240 C 500 175 370 185 300 250 Z';

export const ROMA_ZONES: RomaZone[] = [
  {
    id: 'nord',
    name: 'Roma Nord',
    tagline: 'Parioli, Flaminio, Villa Borghese',
    description:
      "La fascia settentrionale: quartieri residenziali eleganti (Parioli, Salario), il verde di Villa Borghese e l'asse del Flaminio verso lo stadio Olimpico.",
    color: '#7bb26a',
    polygon: '70,60 760,60 760,200 560,215 300,205 70,210',
    labelAt: [150, 110],
  },
  {
    id: 'vaticano',
    name: 'Vaticano e Prati',
    tagline: 'San Pietro, Musei Vaticani, Prati',
    description:
      "La sponda ovest del Tevere: lo Stato della Città del Vaticano con San Pietro e i Musei, e il quartiere ordinato di Prati con le sue vie a scacchiera.",
    color: '#6aa3c9',
    polygon: '70,210 300,205 350,250 330,360 70,360',
    labelAt: [120, 250],
  },
  {
    id: 'centro',
    name: 'Centro Storico',
    tagline: 'Il cuore antico nell’ansa del Tevere',
    description:
      "Dentro l'ansa del fiume: Pantheon, Piazza Navona, Fontana di Trevi, Piazza di Spagna e, verso sud, i Fori e il Colosseo. È il nucleo da cui è nata Roma.",
    color: '#e0b45e',
    polygon: '330,215 560,215 560,430 470,445 400,435 340,360 350,250',
    labelAt: [430, 250],
  },
  {
    id: 'trastevere',
    name: 'Trastevere e Gianicolo',
    tagline: 'Vicoli, osterie, panorami dal colle',
    description:
      "Sull'altra riva rispetto al centro: i vicoli medievali di Trastevere, l'Isola Tiberina e la terrazza del Gianicolo con la vista su tutta la città.",
    color: '#d38f6a',
    polygon: '200,360 340,360 400,435 380,520 210,520',
    labelAt: [250, 480],
  },
  {
    id: 'est',
    name: 'Roma Est',
    tagline: 'Termini, Esquilino, San Giovanni',
    description:
      "Il settore orientale: la stazione Termini, l'Esquilino con Santa Maria Maggiore, San Giovanni in Laterano e i quartieri Tiburtino e Prenestino.",
    color: '#c58fbf',
    polygon: '560,215 770,215 770,540 620,520 560,430',
    labelAt: [680, 300],
  },
  {
    id: 'sud',
    name: 'Roma Sud',
    tagline: 'Aventino, Ostiense, Appio, Caracalla',
    description:
      "A mezzogiorno del centro: il colle dell'Aventino, il Circo Massimo, le Terme di Caracalla, Testaccio e Ostiense con la Piramide, verso la via Appia.",
    color: '#e0a06a',
    polygon: '210,520 380,520 470,445 560,430 620,520 620,700 300,700',
    labelAt: [340, 630],
  },
  {
    id: 'eur',
    name: 'EUR',
    tagline: 'La Roma razionalista del ’42',
    description:
      "Il quartiere moderno voluto negli anni '30-'40: geometrie razionaliste, il 'Colosseo Quadrato', laghetto e grandi viali. La faccia contemporanea della città.",
    color: '#9fb0bd',
    polygon: '300,700 620,700 560,810 340,810',
    labelAt: [430, 760],
  },
];

export const ROMA_STREETS: RomaStreet[] = [
  {
    id: 'corso',
    name: 'Via del Corso',
    kind: 'centro',
    path: 'M 452 150 L 440 372',
    labelAt: [470, 265],
    note: 'Lunga e dritta, collega Piazza del Popolo a Piazza Venezia: la spina dello shopping nel centro.',
  },
  {
    id: 'fori',
    name: 'Via dei Fori Imperiali',
    kind: 'centro',
    path: 'M 440 375 L 512 408',
    labelAt: [462, 405],
    note: 'Aperta negli anni ’30, unisce Piazza Venezia al Colosseo passando accanto ai Fori.',
  },
  {
    id: 'nazionale',
    name: 'Via Nazionale',
    kind: 'centro',
    path: 'M 470 360 L 592 336',
    labelAt: [534, 340],
    note: 'Collega il centro alla stazione Termini: uffici, negozi e palazzi umbertini.',
  },
  {
    id: 'veneto',
    name: 'Via Veneto',
    kind: 'centro',
    path: 'M 488 300 C 505 265 512 240 528 216',
    labelAt: [530, 258],
    note: 'La via della “dolce vita”, tra Villa Borghese e Piazza Barberini.',
  },
  {
    id: 'lungotevere',
    name: 'Lungotevere',
    kind: 'lungotevere',
    path: 'M 372 246 C 378 316 442 336 414 408 C 392 466 328 480 350 560',
    labelAt: [300, 330],
    note: 'I viali che costeggiano il Tevere su entrambe le sponde.',
  },
  {
    id: 'flaminia',
    name: 'Via Flaminia',
    kind: 'consolare',
    path: 'M 452 150 L 430 40',
    labelAt: [412, 66],
    note: 'Consolare verso nord: portava a Rimini e all’Adriatico.',
  },
  {
    id: 'salaria',
    name: 'Via Salaria',
    kind: 'consolare',
    path: 'M 560 210 L 700 78',
    labelAt: [690, 92],
    note: 'La “via del sale”, verso nord-est e le Marche.',
  },
  {
    id: 'tiburtina',
    name: 'Via Tiburtina',
    kind: 'consolare',
    path: 'M 700 330 L 800 316',
    labelAt: [760, 306],
    note: 'Verso est, a Tivoli e all’Abruzzo.',
  },
  {
    id: 'appia',
    name: 'Via Appia Antica',
    kind: 'consolare',
    path: 'M 512 522 L 616 690',
    labelAt: [584, 618],
    note: 'La “regina delle vie”: verso sud, Capua e Brindisi. Costeggiata da tombe e catacombe.',
  },
  {
    id: 'ostiense',
    name: 'Via Ostiense',
    kind: 'consolare',
    path: 'M 396 578 L 332 780',
    labelAt: [330, 748],
    note: 'Verso sud-ovest, a Ostia e al mare.',
  },
  {
    id: 'aurelia',
    name: 'Via Aurelia',
    kind: 'consolare',
    path: 'M 150 300 L 40 322',
    labelAt: [78, 312],
    note: 'Verso ovest, lungo la costa tirrenica.',
  },
  {
    id: 'cassia',
    name: 'Via Cassia',
    kind: 'consolare',
    path: 'M 150 224 L 52 112',
    labelAt: [86, 130],
    note: 'Verso nord-ovest, in Toscana.',
  },
  {
    id: 'gra',
    name: 'Grande Raccordo Anulare (GRA)',
    kind: 'raccordo',
    path: 'M 410 30 C 640 30 800 210 800 430 C 800 640 640 800 410 800 C 190 800 20 640 20 430 C 20 210 190 30 410 30 Z',
    labelAt: [410, 24],
    note: "L'anello autostradale che circonda tutta la città.",
  },
];

export const ROMA_MONUMENTS: RomaMonument[] = [
  // --- Centro Storico ---
  {
    id: 'colosseo',
    name: 'Colosseo',
    category: 'antico',
    zoneId: 'centro',
    at: [516, 408],
    blurb: "L'anfiteatro Flavio (80 d.C.), simbolo di Roma: ospitava i combattimenti dei gladiatori.",
    tip: 'Sta all’estremità sud-est del centro, alla fine di Via dei Fori Imperiali.',
  },
  {
    id: 'fori',
    name: 'Foro Romano',
    category: 'antico',
    zoneId: 'centro',
    at: [472, 396],
    blurb: 'Il centro politico, religioso e commerciale della Roma antica, tra il Campidoglio e il Palatino.',
    tip: 'Subito a ovest del Colosseo, lungo Via dei Fori Imperiali.',
  },
  {
    id: 'palatino',
    name: 'Palatino',
    category: 'antico',
    zoneId: 'centro',
    at: [456, 418],
    blurb: 'Il colle dove secondo la leggenda Romolo fondò Roma; poi residenza degli imperatori.',
    tip: 'Tra il Foro Romano e il Circo Massimo.',
  },
  {
    id: 'vittoriano',
    name: 'Altare della Patria',
    category: 'moderno',
    zoneId: 'centro',
    at: [440, 372],
    blurb: "Il Vittoriano, monumento bianco a Vittorio Emanuele II, affaccia su Piazza Venezia.",
    tip: 'Perno del centro: da qui parte Via del Corso e Via dei Fori Imperiali.',
  },
  {
    id: 'pantheon',
    name: 'Pantheon',
    category: 'antico',
    zoneId: 'centro',
    at: [402, 302],
    blurb: 'Tempio romano dalla celebre cupola con l’oculo aperto sul cielo; straordinariamente ben conservato.',
    tip: 'Nel cuore del centro, poco a est di Piazza Navona.',
  },
  {
    id: 'navona',
    name: 'Piazza Navona',
    category: 'piazza',
    zoneId: 'centro',
    at: [366, 288],
    blurb: 'Piazza barocca sulla forma di uno stadio antico, con la Fontana dei Quattro Fiumi del Bernini.',
    tip: 'Poco a ovest del Pantheon, vicino al Tevere.',
  },
  {
    id: 'trevi',
    name: 'Fontana di Trevi',
    category: 'piazza',
    zoneId: 'centro',
    at: [458, 286],
    blurb: 'La più grande fontana barocca di Roma: si lancia una monetina per tornare in città.',
    tip: 'Tra il Pantheon e il Quirinale, in pieno centro.',
  },
  {
    id: 'spagna',
    name: 'Piazza di Spagna',
    category: 'piazza',
    zoneId: 'centro',
    at: [474, 254],
    blurb: 'Celebre per la scalinata di Trinità dei Monti e la barcaccia del Bernini.',
    tip: 'Nella parte nord del centro, ai piedi del Pincio.',
  },
  // --- Vaticano e Prati ---
  {
    id: 'sanpietro',
    name: 'Basilica di San Pietro',
    category: 'religioso',
    zoneId: 'vaticano',
    at: [172, 262],
    blurb: 'La basilica più grande della cristianità, con la cupola di Michelangelo e il colonnato del Bernini.',
    tip: 'Sulla sponda ovest del Tevere, cuore del Vaticano.',
  },
  {
    id: 'vaticani',
    name: 'Musei Vaticani',
    category: 'museo',
    zoneId: 'vaticano',
    at: [148, 222],
    blurb: 'Immense collezioni papali che culminano nella Cappella Sistina affrescata da Michelangelo.',
    tip: 'Appena a nord di San Pietro, dentro le mura vaticane.',
  },
  {
    id: 'castel',
    name: "Castel Sant'Angelo",
    category: 'antico',
    zoneId: 'vaticano',
    at: [300, 288],
    blurb: 'Nato come mausoleo di Adriano, poi fortezza e rifugio dei papi, collegato al Vaticano dal Passetto.',
    tip: 'Sul Tevere, all’inizio della via che porta a San Pietro.',
  },
  // --- Roma Nord ---
  {
    id: 'borghese',
    name: 'Villa Borghese',
    category: 'parco',
    zoneId: 'nord',
    at: [520, 172],
    blurb: 'Il grande parco storico di Roma, con la Galleria Borghese e i suoi capolavori.',
    tip: 'Sopra Piazza di Spagna, apre la fascia di Roma Nord.',
  },
  {
    id: 'popolo',
    name: 'Piazza del Popolo',
    category: 'piazza',
    zoneId: 'nord',
    at: [448, 156],
    blurb: 'Grande piazza ovale con l’obelisco egizio; storica porta nord della città.',
    tip: 'Da qui parte Via del Corso verso il centro.',
  },
  // --- Trastevere e Gianicolo ---
  {
    id: 'trastevere',
    name: 'Santa Maria in Trastevere',
    category: 'religioso',
    zoneId: 'trastevere',
    at: [322, 424],
    blurb: 'Una delle chiese più antiche di Roma, cuore dei vicoli pittoreschi di Trastevere.',
    tip: 'Sulla riva ovest, di fronte al centro storico.',
  },
  {
    id: 'gianicolo',
    name: 'Gianicolo',
    category: 'parco',
    zoneId: 'trastevere',
    at: [252, 388],
    blurb: 'Il colle con la terrazza panoramica più famosa: sotto, tutta Roma.',
    tip: 'Sopra Trastevere, verso il Vaticano.',
  },
  {
    id: 'tiberina',
    name: 'Isola Tiberina',
    category: 'antico',
    zoneId: 'trastevere',
    at: [374, 402],
    blurb: 'La piccola isola sul Tevere a forma di nave, legata da sempre alla medicina e alla cura.',
    tip: 'Nel fiume, tra il centro e Trastevere.',
  },
  // --- Roma Est ---
  {
    id: 'termini',
    name: 'Stazione Termini',
    category: 'moderno',
    zoneId: 'est',
    at: [600, 332],
    blurb: 'La principale stazione ferroviaria di Roma e grande nodo dei trasporti.',
    tip: 'Porta d’accesso di Roma Est, poco oltre Via Nazionale.',
  },
  {
    id: 'maggiore',
    name: 'Santa Maria Maggiore',
    category: 'religioso',
    zoneId: 'est',
    at: [582, 356],
    blurb: 'Una delle quattro basiliche papali, sul colle Esquilino.',
    tip: 'Tra Termini e il centro, sull’Esquilino.',
  },
  {
    id: 'laterano',
    name: 'San Giovanni in Laterano',
    category: 'religioso',
    zoneId: 'est',
    at: [624, 456],
    blurb: 'La cattedrale di Roma, prima per dignità fra tutte le chiese: “madre di tutte le chiese”.',
    tip: 'Verso sud-est, alla cinta delle mura.',
  },
  // --- Roma Sud ---
  {
    id: 'circomassimo',
    name: 'Circo Massimo',
    category: 'antico',
    zoneId: 'sud',
    at: [446, 470],
    blurb: 'L’antico circo per le corse dei carri, oggi grande spianata verde tra Palatino e Aventino.',
    tip: 'Subito a sud del Palatino, inizio di Roma Sud.',
  },
  {
    id: 'caracalla',
    name: 'Terme di Caracalla',
    category: 'antico',
    zoneId: 'sud',
    at: [504, 522],
    blurb: 'Colossali terme imperiali del III secolo, oggi sede di spettacoli all’aperto.',
    tip: 'A sud del Circo Massimo, verso la via Appia.',
  },
  {
    id: 'boccaverita',
    name: 'Bocca della Verità',
    category: 'antico',
    zoneId: 'sud',
    at: [410, 446],
    blurb: 'Il celebre mascherone nel portico di Santa Maria in Cosmedin, tra il Tevere e il Circo Massimo.',
    tip: 'Vicino al fiume, ai piedi dell’Aventino.',
  },
  {
    id: 'piramide',
    name: 'Piramide Cestia',
    category: 'antico',
    zoneId: 'sud',
    at: [394, 576],
    blurb: 'Una tomba a piramide di età augustea, incastonata nelle mura a Ostiense.',
    tip: 'Verso sud, a Ostiense, punto d’avvio della via Ostiense.',
  },
  {
    id: 'sanpaolo',
    name: 'San Paolo fuori le Mura',
    category: 'religioso',
    zoneId: 'sud',
    at: [346, 662],
    blurb: 'Grande basilica papale sorta sulla tomba di San Paolo, lungo la via Ostiense.',
    tip: 'Più a sud, fuori dal centro verso Ostiense.',
  },
  // --- EUR ---
  {
    id: 'eur',
    name: 'Palazzo della Civiltà Italiana',
    category: 'moderno',
    zoneId: 'eur',
    at: [402, 748],
    blurb: 'Il “Colosseo Quadrato”, icona razionalista del quartiere EUR.',
    tip: 'All’estremo sud, cuore dell’EUR.',
  },
];
