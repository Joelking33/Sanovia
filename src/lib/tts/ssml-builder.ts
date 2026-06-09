/**
 * ssml-builder.ts
 * Construit des balises SSML pour contrôler finement
 * le rythme, les pauses et l'intonation du TTS Google.
 *
 * SSML = Speech Synthesis Markup Language
 */

/**
 * Découpe le texte en phrases et construit un SSML
 * avec des pauses naturelles entre chaque phrase.
 */
export function buildSSML(text: string): string {
  // Découper en phrases selon la ponctuation
  const sentences = text.match(/[^.!?…]+[.!?…]+/g) ?? [text]

  const ssmlBody = sentences
    .map((sentence) => {
      const s = sentence.trim()
      if (!s) return ''

      // Question → pause plus longue (le cerveau traite la réponse)
      if (s.endsWith('?')) {
        return `<s>${s}</s><break time="650ms"/>`
      }

      // Exclamation → légère emphase + pause
      if (s.endsWith('!')) {
        return `<s><emphasis level="moderate">${s}</emphasis></s><break time="550ms"/>`
      }

      // Suspension → pause longue et dramatique
      if (s.endsWith('…')) {
        return `<s>${s}</s><break time="800ms"/>`
      }

      // Phrase normale → pause courte
      return `<s>${s}</s><break time="400ms"/>`
    })
    .filter(Boolean)
    .join('\n    ')

  // Envelopper dans <speak> avec paramètres prosodiques globaux
  return `<speak>
  <prosody rate="0.92" pitch="-1.5st" volume="medium">
    ${ssmlBody}
  </prosody>
</speak>`
}

/**
 * Construit un SSML simple (sans découpage de phrases)
 * pour les textes courts comme les messages d'erreur.
 */
export function buildSimpleSSML(text: string): string {
  return `<speak>
  <prosody rate="0.92" pitch="-1.5st">
    ${text}
  </prosody>
</speak>`
}