import { NextRequest } from 'next/server'
import { diagnoseAPI } from '@/lib/ai'

/**
 * GET /api/diagnostics
 * Vérifie la santé de TOUS les fournisseurs IA
 * Retourne : statut Gemini + OpenRouter + Cache
 *
 * Utilisation : GET /api/diagnostics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Diagnostics] Lancement du diagnostic IA complet...')

    const result = await diagnoseAPI()

    return Response.json({
      app: 'Sanovia v4.0',
      architecture: 'Multi-fournisseur (Gemini + OpenRouter + Offline)',
      timestamp: new Date().toISOString(),
      ...result
    }, { status: 200 })

  } catch (err: any) {
    console.error('[Diagnostics Error]', err)
    return Response.json({
      app: 'Sanovia v4.0',
      status: 'error',
      error: err?.message || 'Erreur lors du diagnostic',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
