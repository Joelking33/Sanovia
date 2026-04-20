import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticate, optionalAuth, success, badRequest, error } from '@/lib/middleware'
import { chatWithAI } from '@/lib/ai'

/**
 * GET /api/health/tips
 * Récupérer des conseils de santé
 *
 * Query params:
 * - category (string, requis) — "premiers_secours" ou "grossesse"
 * - subcategory (string, optionnel) — sous-catégorie spécifique
 * - language (string, optionnel, défaut: "fr") — Langue
 * - severity (string, optionnel) — "info", "warning", "urgent", "critical"
 * - page (number, optionnel, défaut: 1)
 * - limit (number, optionnel, défaut: 20)
 *
 * Headers: Authorization: Bearer <token> (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const language = searchParams.get('language') || 'fr'
    const severity = searchParams.get('severity')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    if (!category) {
      return badRequest('Le paramètre "category" est requis. Valeurs : "premiers_secours", "grossesse".')
    }

    // Construire les filtres
    const where: Record<string, any> = {
      category,
      isActive: true
    }

    if (subcategory) where.subcategory = subcategory
    if (severity) where.severity = severity

    const total = await db.healthTip.count({ where })

    const tips = await db.healthTip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Adapter la réponse en fonction de la langue demandée
    const localizedTips = tips.map(tip => {
      let title = tip.title
      let content = tip.content

      if (language === 'ba' && tip.titleBa) {
        title = tip.titleBa
        content = tip.contentBa || tip.content
      } else if (language === 'dy' && tip.titleDy) {
        title = tip.titleDy
        content = tip.contentDy || tip.content
      } else if (language === 'bq' && tip.titleBq) {
        title = tip.titleBq
        content = tip.contentBq || tip.content
      }

      return {
        id: tip.id,
        category: tip.category,
        subcategory: tip.subcategory,
        title,
        content,
        severity: tip.severity,
        tags: tip.tags.split(',').map(t => t.trim()),
        language
      }
    })

    return success({
      tips: localizedTips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (err: any) {
    console.error('[Health Tips GET Error]', err)
    return error('Erreur lors de la récupération des conseils de santé.')
  }
}

/**
 * POST /api/health/tips
 * Poser une question de santé à Sanoovia IA (sans créer de conversation)
 *
 * Body:
 * - question (string, requis) — La question de santé
 * - category (string, optionnel, défaut: "general") — Catégorie
 * - language (string, optionnel, défaut: "fr") — Langue de réponse
 *
 * Headers: Authorization: Bearer <token> (optionnel, mais recommandé)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, category, language } = body

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return badRequest('La question est requise.')
    }

    if (question.length > 3000) {
      return badRequest('La question ne peut pas dépasser 3000 caractères.')
    }

    const selectedCategory = category || 'general'
    const selectedLanguage = language || 'fr'

    // Vérifier l'authentification (optionnelle)
    const authResult = await optionalAuth(request)

    // Si authentifié, mettre à jour la langue de l'utilisateur
    if (authResult.success && authResult.userId) {
      try {
        await db.user.update({
          where: { id: authResult.userId },
          data: { lastLoginAt: new Date() }
        })
      } catch {
        // Ignorer les erreurs de mise à jour
      }
    }

    // Obtenir la réponse de l'IA
    const aiResponse = await chatWithAI(
      question.trim(),
      selectedLanguage,
      selectedCategory
    )

    return success({
      question: question.trim(),
      answer: aiResponse,
      category: selectedCategory,
      language: selectedLanguage,
      disclaimer: 'Attention : Les conseils de Sanoovia ne remplacent pas un avis médical professionnel. En cas d\'urgence, appelez le 15, 112 ou 111.'
    })

  } catch (err: any) {
    console.error('[Health Tips POST Error]', err)
    return error('Erreur lors du traitement de votre question de santé.')
  }
}
