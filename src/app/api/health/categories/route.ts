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
          name: 'Kololonw',
          description: 'Kololonw baara',
          icon: 'heart-pulse',
          subcategories: [
            { id: 'brulures', name: 'Oro' },
            { id: 'coupures', name: 'Fen banna' },
            { id: 'saignements', name: 'Soron' },
            { id: 'etouffement', name: 'Dogokene' },
            { id: 'fractures', name: 'U be nene' },
            { id: 'morsures', name: 'U ye fen' },
            { id: 'allergies', name: 'Banna baara' },
            { id: 'noyade', name: 'Ne' },
            { id: 'chaleur', name: 'Fle' },
            { id: 'empoisonnement', name: 'Fen oron' }
          ]
        },
        {
          id: 'grossesse',
          name: 'Glo',
          description: 'Glo baara',
          icon: 'baby',
          subcategories: [
            { id: 'trimestre1', name: 'Kene fle' },
            { id: 'trimestre2', name: 'Kene filanan' },
            { id: 'trimestre3', name: 'Kene saba' },
            { id: 'alimentation', name: 'Kene' },
            { id: 'signes_alerte', name: 'Kan man soro' },
            { id: 'preparation_accouchement', name: 'Glo baara' },
            { id: 'post_partum', name: 'Glo kefe' },
            { id: 'allaitement', name: 'Glo' }
          ]
        }
      ],
      dy: [
        {
          id: 'premiers_secours',
          name: 'Banje eere',
          description: 'Banje eere la deme',
          icon: 'heart-pulse',
          subcategories: [
            { id: 'brulures', name: 'Oro' },
            { id: 'coupures', name: 'Fen banna' },
            { id: 'saignements', name: 'Soron' },
            { id: 'etouffement', name: 'Dogokene' },
            { id: 'fractures', name: 'U be nene' },
            { id: 'morsures', name: 'U ye fen' },
            { id: 'allergies', name: 'Banna baara' },
            { id: 'noyade', name: 'Ne' },
            { id: 'chaleur', name: 'Fle' },
            { id: 'empoisonnement', name: 'Fen oron' }
          ]
        },
        {
          id: 'grossesse',
          name: 'Glo',
          description: 'Glo baara',
          icon: 'baby',
          subcategories: [
            { id: 'trimestre1', name: 'Kene fle' },
            { id: 'trimestre2', name: 'Kene filanan' },
            { id: 'trimestre3', name: 'Kene saba' },
            { id: 'alimentation', name: 'Kene' },
            { id: 'signes_alerte', name: 'Kan man soro' },
            { id: 'preparation_accouchement', name: 'Glo baara' },
            { id: 'post_partum', name: 'Glo kefe' },
            { id: 'allaitement', name: 'Glo' }
          ]
        }
      ],
      bq: [
        {
          id: 'premiers_secours',
          name: 'Kololonw',
          description: 'Kololonw baara',
          icon: 'heart-pulse',
          subcategories: [
            { id: 'brulures', name: 'Oro' },
            { id: 'coupures', name: 'Fen banna' },
            { id: 'saignements', name: 'Soron' },
            { id: 'etouffement', name: 'Dogokene' },
            { id: 'fractures', name: 'U be nene' },
            { id: 'morsures', name: 'U ye fen' },
            { id: 'allergies', name: 'Banna baara' },
            { id: 'noyade', name: 'Ne' },
            { id: 'chaleur', name: 'Fle' },
            { id: 'empoisonnement', name: 'Fen oron' }
          ]
        },
        {
          id: 'grossesse',
          name: 'Glo',
          description: 'Glo baara',
          icon: 'baby',
          subcategories: [
            { id: 'trimestre1', name: 'Kene fle' },
            { id: 'trimestre2', name: 'Kene filanan' },
            { id: 'trimestre3', name: 'Kene saba' },
            { id: 'alimentation', name: 'Kene' },
            { id: 'signes_alerte', name: 'Kan man soro' },
            { id: 'preparation_accouchement', name: 'Glo baara' },
            { id: 'post_partum', name: 'Glo kefe' },
            { id: 'allaitement', name: 'Glo' }
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
