/**
 * text-preprocessor.ts
 * Nettoie et normalise le texte avant envoi au moteur TTS.
 *
 * Données phonétiques extraites du glossaire officiel SANOVIA
 * (SANOVIA_Glossaire_Multilingue.docx — Version 08/06/2026)
 * Validées par l'équipe IRON STACK avec des locuteurs natifs.
 */

// ─────────────────────────────────────────────────────────────
// GLOSSAIRE SANOVIA — Correspondances français → phonétique
// Utilisé pour enrichir les réponses TTS et valider l'orthographe
// ─────────────────────────────────────────────────────────────

export const GLOSSAIRE_BAOULÉ: Record<string, string> = {
  // Salutations
  'bonjour madame': 'Moh Ayi o',
  'bonjour monsieur': 'Gna Ayi o',
  'bonsoir': 'Moh arè o',
  'au revoir': 'E tè o nou',
  'merci': 'Kloua o',
  'comment vas-tu': 'Ô wou ti pka',
  'je vais bien': 'Mi woun ti pka',
  'bon rétablissement': 'yako',
  'je comprends ta douleur': 'N\'si liké n\'ga ô yo',

  // Corps humain
  'tête': 'Ti',
  'cheveux': 'Ti tré',
  'visage': 'gnrou',
  'yeux': 'ima',
  'oreilles': 'soupkô',
  'nez': 'boué',
  'bouche': 'nouan',
  'gorge': 'aloha',
  'cou': 'kômi',
  'épaule': 'Wa ti',
  'bras': 'sa',
  'main': 'sa',
  'doigts': 'Sa ma',
  'poitrine': 'Wé',
  'coeur': 'Awoulin ba',
  'poumons': 'afôkô',
  'ventre': 'Kloun',
  'foie': 'bouè',
  'reins': 'vi',
  'dos': 'Si',
  'colonne vertébrale': 'Vi ta',
  'fesses': 'Bo drai',
  'jambe': 'dja',
  'genou': 'Dja pkôlè',
  'pied': 'dja',
  'peau': 'Wounin',
  'sang': 'modja',
  'os': 'ovié',
  'muscle': 'pkôlè',

  // Symptômes
  'tu es malade': 'Ô wounin yé ô ya',
  'tu as de la fièvre': 'Ô wounin do',
  'tu as mal à la tête': 'A ti yo ô ya',
  'tu as mal au ventre': 'Ô kloun yo ô ya',
  'tu as mal au dos': 'Ô si yo ô ya',
  'tu as mal à la poitrine': 'Ô wé yo ô ya',
  'tu as mal à la gorge': 'O aloha yo ô ya',
  'tu as mal aux jambes': 'O dja yo ô ya',
  'tu as la toux': 'A bo tangô',
  'tu as de la fatigue': 'A fèli',
  'tu as des vomissements': 'A fi',
  'tu as la diarrhée': 'A lê n\'zo n\'guiè',
  'tu as des démangeaisons': 'A wounin kaka a ô',
  'tu as des boutons': 'A lê assien',
  'tu as perdu l\'appétit': 'A kloua diman liké',
  'tu as du mal à dormir': 'A kloua lafi man',
  'tu te sens faible': 'A wounin dodo ô',
  'tu as les yeux jaunes': 'A ima blo',
  'tu as les pieds gonflés': 'O dja ti wou wa',

  // Maladies
  'tu as le paludisme': 'A lê djaikouhadjo',
  'tu as la typhoïde': 'A lê djaikouhadjo kéklé',

  // Soins
  'médicament': 'Aré',
  'prends ton médicament': 'Non ô aré',
  'comprimé': 'Aré ma',
  'médecin': 'Dôhôtrô sran',
  'va chez le médecin': 'Kô nian dôhôtrô sran',
  'hôpital': 'Dôhôtrô',
  'ambulance': 'Dôhôtrô loto',
  'tu dois te reposer': 'Reposer a wou',
  'bois beaucoup d\'eau': 'Non n\'zué kaka',

  // Grossesse
  'tu es enceinte': 'A ti kouè fouè',
  'bébé': 'wa',

  // Prévention
  'lave-toi les mains': 'Wouzi a sa nou',
  'utilise un moustiquaire': 'Fa ontin ontin soi',
  'évite les eaux sales': 'Nan kô n\'zué fien nou',

  // Questions utiles
  'es-tu enceinte': 'A ti kouè fouè',
  'peux-tu marcher': 'A kloua nanti',
  'peux-tu respirer normalement': 'A kloua lo oumien pka',

  // Santé mentale
  'tu n\'arrives pas à dormir': 'A lafi man',
  'parle à quelqu\'un de confiance': 'Koko yalê o ni sran pka',
  'tu n\'es pas seul': 'A nouman a kougba',
}

export const GLOSSAIRE_DIOULA: Record<string, string> = {
  // Salutations
  'bonjour': 'Anisogoman',
  'bonsoir': 'anyoula',
  'bonne nuit': 'Su here',
  'au revoir': 'Kan ben',
  'merci à une femme': 'Initché mousso',
  'merci à un homme': 'Initché kèrè',
  'comment vas-tu': 'I ka kênê wa',
  'je vais bien': 'N\'ka kênê',
  'je suis là pour t\'aider': 'N\'be yan daimais na',
  'prends soin de toi': 'Iyairai korossi',
  'bon rétablissement': 'Ka kene ya yanama di',
  'courage': 'Hakili sira la',
  'n\'hésite pas à revenir': 'Aw ye segin tunun',
  'je comprends ta douleur': 'N\'ma i toro paamu',

  // Corps humain
  'tête': 'Coukolo',
  'cheveux': 'kunsigi',
  'visage': 'Yan da',
  'yeux': 'Ya kili',
  'oreilles': 'tulow',
  'nez': 'you',
  'bouche': 'sa',
  'gorge': 'kanko',
  'cou': 'kan',
  'épaule': 'kunkolon',
  'bras': 'bolo',
  'main': 'têgê',
  'doigts': 'Bolo déni',
  'poitrine': 'dèmè',
  'coeur': 'doussou',
  'poumons': 'suma',
  'ventre': 'Konnon',
  'foie': 'bara',
  'reins': 'kundow',
  'dos': 'kun',
  'colonne vertébrale': 'kokuran',
  'fesses': 'bobara',
  'jambe': 'seniw',
  'genou': 'senkoro',
  'pied': 'sen',
  'peau': 'farigolo',
  'sang': 'bassi',
  'os': 'koloku',
  'muscle': 'Fari fissa',

  // Symptômes
  'tu es malade': 'I menkainai',
  'tu as de la fièvre': 'I fari gbanna',
  'tu as mal à la tête': 'I coukolo bi diminan',
  'tu as mal au ventre': 'I konnon bi diminan',
  'tu as la toux': 'Sorgorsorgor bi là',
  'tu as de la fatigue': 'I sèguaila',
  'tu as des vomissements': 'Vonnon lorgor bi là',
  'tu as la diarrhée': 'I konnon bé borila',

  // Maladies
  'tu as le paludisme': 'Soumaya bi là',

  // Soins
  'médicament': 'Fla',
  'prends ton médicament': 'I ya fla ta',
  'médecin': 'Dortoror tchai',
  'va chez le médecin': 'Ta dortoror tchai fai',
  'hôpital': 'Dortoror sô',

  // Grossesse
  'tu es enceinte': 'I kônonman lé',

  // Alimentation
  'bois de l\'eau potable': 'Non n\'zué pka',

  // Santé mentale
  'tu n\'arrives pas à dormir': 'A lafi man',
}

// ─────────────────────────────────────────────────────────────
// NORMALISATION PHONÉTIQUE
// Corrige les caractères écrits en "alphabet officiel" vers
// la phonétique populaire validée par SANOVIA
// ─────────────────────────────────────────────────────────────

// Patterns issus du glossaire : formes officielles → phonétique WhatsApp
const PHONETICS_MAP: Record<string, Record<string, string>> = {
  dioula: {
    // Voyelles officielles → phonétique populaire (validées SANOVIA)
    'ɛ': 'è',   // ex: kɛnɛ → kênê
    'ɔ': 'o',   // ex: kɔnɔn → konnon
    'ŋ': 'ng',  // nasale vélaire
    'ɲ': 'gn',  // palatale nasale
    'ê': 'ê',   // conservé tel quel (déjà phonétique)
    'î': 'i',
    'â': 'a',
    // Corrections spécifiques au glossaire SANOVIA
    'kɛnɛ': 'kênê',       // "santé/bien"
    'kɔnɔn': 'konnon',    // "ventre"
    'sɔrɔ': 'sorgo',      // (toussement)
    'dɔn': 'don',
    'bɔ': 'bo',
  },
  baoulé: {
    // Le baoulé de SANOVIA utilise déjà la phonétique populaire
    // On corrige uniquement les cas d'apostrophes non standard
    '\u2019': '\'',   // apostrophe typographique → droite
    '\u2018': '\'',
    // Accents spéciaux baoulé → équivalents oraux
    'ô': 'ô',   // conservé (intelligible par le TTS français)
    'è': 'è',   // conservé
    'à': 'a',
    'â': 'a',
    'ê': 'ê',
  },
}

/**
 * Normalise les caractères spéciaux d'une langue locale
 * vers leur équivalent phonétique lisible par le TTS.
 */
function normalizeLocalLanguage(text: string, langue: string): string {
  const map = PHONETICS_MAP[langue]
  if (!map) return text

  let normalized = text
  // Remplacer les mots complets en premier (priorité sur les caractères isolés)
  for (const [original, replacement] of Object.entries(map)) {
    if (original.length > 1) {
      normalized = normalized.replaceAll(original, replacement)
    }
  }
  // Ensuite les caractères isolés
  for (const [original, replacement] of Object.entries(map)) {
    if (original.length === 1) {
      normalized = normalized.replaceAll(original, replacement)
    }
  }
  return normalized
}

/**
 * Préprocesse le texte pour le TTS :
 * - Supprime emojis et icônes
 * - Nettoie le markdown (**, __, ##, liens, etc.)
 * - Normalise la ponctuation pour de meilleures pauses
 * - Adapte les caractères selon la langue locale (glossaire SANOVIA)
 */
export function preprocessText(text: string, langue: string = 'fr'): string {
  let processed = text

  // 1. Supprimer les emojis (tous les blocs Unicode courants)
  processed = processed
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')

  // 2. Nettoyer le markdown
  processed = processed
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/>\s?/g, '')

  // 3. Normaliser la ponctuation pour des pauses naturelles
  processed = processed
    .replace(/\.{3,}/g, '…')
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/,\s*/g, ', ')
    .replace(/;\s*/g, '; ')
    .replace(/:\s*/g, ' : ')
    .replace(/\s+/g, ' ')
    .trim()

  // 4. Normaliser les caractères des langues locales (glossaire SANOVIA)
  const localLanguages = ['dioula', 'baoulé', 'bété', 'mooré', 'wolof', 'hausa', 'bambara']
  if (localLanguages.includes(langue)) {
    processed = normalizeLocalLanguage(processed, langue)
  }

  return processed
}

/**
 * Traduit un terme français vers sa phonétique dans la langue cible.
 * Utile pour enrichir les réponses de l'IA avec les bons termes locaux.
 *
 * @example
 * translateTerm('ventre', 'dioula') // → 'Konnon'
 * translateTerm('tête', 'baoulé')   // → 'Ti'
 */
export function translateTerm(
  termeFrancais: string,
  langue: 'dioula' | 'baoulé'
): string | null {
  const key = termeFrancais.toLowerCase().trim()
  if (langue === 'dioula') return GLOSSAIRE_DIOULA[key] ?? null
  if (langue === 'baoulé') return GLOSSAIRE_BAOULÉ[key] ?? null
  return null
}