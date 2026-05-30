import { NextRequest } from 'next/server'
import { diagnoseAPI } from '@/lib/ai'

export async function GET(request: NextRequest) {
  try {
    console.log('[Diagnostics] Lancement du diagnostic OpenRouter...')
    const result = await diagnoseAPI()
    return Response.json({
      app: 'Sanovia v9.1',
      architecture: 'OpenRouter (uniquement) -> Hors-ligne (mots-cles sante)',
      timestamp: new Date().toISOString(),
      ...result
    }, { status: 200 })
  } catch (err: any) {
    console.error('[Diagnostics Error]', err)
    return Response.json({
      app: 'Sanovia v9.1',
      status: 'error',
      error: err?.message || 'Erreur lors du diagnostic',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
