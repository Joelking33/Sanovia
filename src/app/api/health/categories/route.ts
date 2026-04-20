import { NextRequest } from 'next/server'
import { success, error } from '@/lib/middleware'

/**
 * GET /api/health/categories
 * Récupérer les catégories de santé disponibles
 *
 * Query params:
 * - language (string, optionnel, défaut: "fr") — Langue de la réponse
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'fr'

    const categories = {
      fr: [
        {
          id: 'premiers_secours',
          name: 'Premiers Secours',
          description: 'Conseils et gestes de premiers secours d\'urgence',
          icon: 'heart-pulse',
          subcategories: [
            { id: 'brulures', name: 'Brûlures' },
            { id: 'coupures', name: 'Coupures et blessures' },
            { id: 'saignements', name: 'Saignements' },
            { id: 'etouffement', name: 'Étouffement' },
            { id: 'fractures', name: 'Fractures et entorses' },
            { id: 'morsures', name: 'Morsures et piqûres' },
            { id: 'allergies', name: 'Réactions allergiques' },
            { id: 'noyade', name: 'Noyade' },
            { id: 'chaleur', name: 'Coup de chaleur' },
            { id: 'empoisonnement', name: 'Empoisonnement' }
          ]
        },
        {
          id: 'grossesse',
          name: 'Grossesse',
          description: 'Suivi de grossesse et conseils maternels',
          icon: 'baby',
          subcategories: [
            { id: 'trimestre1', name: '1er trimestre (1-12 semaines)' },
            { id: 'trimestre2', name: '2ème trimestre (13-27 semaines)' },
            { id: 'trimestre3', name: '3ème trimestre (28-40 semaines)' },
            { id: 'alimentation', name: 'Alimentation pendant la grossesse' },
            { id: 'signes_alerte', name: 'Signes d\'alerte' },
            { id: 'preparation_accouchement', name: 'Préparation à l\'accouchement' },
            { id: 'post_partum', name: 'Post-partum' },
            { id: 'allaitement', name: 'Allaitement' }
          ]
        }
      ],
      ba: [
        {
          id: 'premiers_secours',
          name: 'Kɔlɔlɔnw',
          description: 'Kɔlɔlɔnw baara',
          icon: 'heart-pulse',
          subcategories: [
            { id: 'brulures', name: 'Ɔrɔ' },
            { id: 'coupures', name: 'Fɛn banna' },
            { id: 'saignements', name: 'Sɔrɔn' },
            { id: 'etouffement', name: 'Dɔgɔkɛnɛ' },
            { id: 'fractures', name: 'U bɛ nɛnɛ' },
            { id: 'morsures', name: 'U yɛ fɛn' },
            { id: 'allergies', name: 'Banna baara' },
            { id: 'noyade', name: 'Nɛ' },
            { id: 'chaleur', name: 'Flɛ' },
            { id: 'empoisonnement', name: 'Fɛn ɔrɔn' }
          ]
        },
        {
          id: 'grossesse',
          name: 'Glɔ',
          description: 'Glɔ baara',
          icon: 'baby',
          subcategories: [
            { id: 'trimestre1', name: 'Kɛnɛ flɛ' },
            { id: 'trimestre2', name: 'Kɛnɛ filanan' },
            { id: 'trimestre3', name: 'Kɛnɛ saba' },
            { id: 'alimentation', name: 'Kɛnɛ' },
            { id: 'signes_alerte', name: 'Kan man sɔrɔ' },
            { id: 'preparation_accouchement', name: 'Glɔ baara' },
            { id: 'post_partum', name: 'Glɔ kɛfɛ' },
            { id: 'allaitement', name: 'Glɔ' }
          ]
        }
      ],
      dy: [
        {
          id: 'premiers_secours',
          name: 'Banjɛ ɛɛrɛ',
          description: 'Banjɛ ɛɛrɛ la dɛmɛ',
          icon: 'heart-pulse',
          subcategories: [
            { id: 'brulures', name: 'Ɔrɔ' },
            { id: 'coupures', name: 'Fɛn banna' },
            { id: 'saignements', name: 'Sɔrɔn' },
            { id: 'etouffement', name: 'Dɔgɔkɛnɛ' },
            { id: 'fractures', name: 'U bɛ nɛnɛ' },
            { id: 'morsures', name: 'U yɛ fɛn' },
            { id: 'allergies', name: 'Banna baara' },
            { id: 'noyade', name: 'Nɛ' },
            { id: 'chaleur', name: 'Flɛ' },
            { id: 'empoisonnement', name: 'Fɛn ɔrɔn' }
          ]
        },
        {
          id: 'grossesse',
          name: 'Glɔ',
          description: 'Glɔ baara',
          icon: 'baby',
          subcategories: [
            { id: 'trimestre1', name: 'Kɛnɛ flɛ' },
            { id: 'trimestre2', name: 'Kɛnɛ filanan' },
            { id: 'trimestre3', name: 'Kɛnɛ saba' },
            { id: 'alimentation', name: 'Kɛnɛ' },
            { id: 'signes_alerte', name: 'Kan man sɔrɔ' },
            { id: 'preparation_accouchement', name: 'Glɔ baara' },
            { id: 'post_partum', name: 'Glɔ kɛfɛ' },
            { id: 'allaitement', name: 'Glɔ' }
          ]
        }
      ],
      bq: [
        {
          id: 'premiers_secours',
          name: 'Kɔlɔlɔnw',
          description: 'Kɔlɔlɔnw baara',
          icon: 'heart-pulse',
          subcategories: [
            { id: 'brulures', name: 'Ɔrɔ' },
            { id: 'coupures', name: 'Fɛn banna' },
            { id: 'saignements', name: 'Sɔrɔn' },
            { id: 'etouffement', name: 'Dɔgɔkɛnɛ' },
            { id: 'fractures', name: 'U bɛ nɛnɛ' },
            { id: 'morsures', name: 'U yɛ fɛn' },
            { id: 'allergies', name: 'Banna baara' },
            { id: 'noyade', name: 'Nɛ' },
            { id: 'chaleur', name: 'Flɛ' },
            { id: 'empoisonnement', name: 'Fɛn ɔrɔn' }
          ]
        },
        {
          id: 'grossesse',
          name: 'Glɔ',
          description: 'Glɔ baara',
          icon: 'baby',
          subcategories: [
            { id: 'trimestre1', name: 'Kɛnɛ flɛ' },
            { id: 'trimestre2', name: 'Kɛnɛ filanan' },
            { id: 'trimestre3', name: 'Kɛnɛ saba' },
            { id: 'alimentation', name: 'Kɛnɛ' },
            { id: 'signes_alerte', name: 'Kan man sɔrɔ' },
            { id: 'preparation_accouchement', name: 'Glɔ baara' },
            { id: 'post_partum', name: 'Glɔ kɛfɛ' },
            { id: 'allaitement', name: 'Glɔ' }
          ]
        }
      ]
    }

    const selectedCategories = categories[language] || categories.fr

    return success({
      categories: selectedCategories,
      availableLanguages: [
        { code: 'fr', name: 'Français' },
        { code: 'ba', name: 'Baoulé' },
        { code: 'dy', name: 'Dioula' },
        { code: 'bq', name: 'Bété' }
      ]
    })

  } catch (err: any) {
    console.error('[Health Categories Error]', err)
    return error('Erreur lors de la récupération des catégories.')
  }
}
