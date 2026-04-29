import { NextResponse } from 'next/server'

/**
 * GET /api/debug/ai
 * Endpoint de diagnostic pour vérifier la configuration IA sur Vercel
 *
 * ATTENTION: A SUPPRIMER en production !
 */
export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: []
  }

  // 1. Vérifier OPENROUTER_API_KEY
  const apiKey = process.env.OPENROUTER_API_KEY
  if (apiKey) {
    const masked = apiKey.slice(0, 8) + '...' + apiKey.slice(-4)
    diagnostics.checks.push({
      name: 'OPENROUTER_API_KEY',
      status: 'OK',
      detail: `Clé trouvée (${masked})`,
      keyLength: apiKey.length,
      keyPrefix: apiKey.slice(0, 10)
    })
  } else {
    diagnostics.checks.push({
      name: 'OPENROUTER_API_KEY',
      status: 'MISSING',
      detail: 'Clé non configurée. Ajoutez-la dans Vercel > Settings > Environment Variables'
    })
  }

  // 2. Vérifier le modèle configuré
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
  diagnostics.checks.push({
    name: 'OPENROUTER_MODEL',
    status: 'OK',
    detail: `Modèle: ${model}`
  })

  // 3. Vérifier DATABASE_URL
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    diagnostics.checks.push({
      name: 'DATABASE_URL',
      status: 'OK',
      detail: `Trouvée`
    })
  } else {
    diagnostics.checks.push({
      name: 'DATABASE_URL',
      status: 'MISSING',
      detail: 'Non configurée'
    })
  }

  // 4. Vérifier JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET
  if (jwtSecret) {
    diagnostics.checks.push({
      name: 'JWT_SECRET',
      status: 'OK',
      detail: `Trouvé (longueur: ${jwtSecret.length})`
    })
  } else {
    diagnostics.checks.push({
      name: 'JWT_SECRET',
      status: 'MISSING',
      detail: 'Non configuré'
    })
  }

  // 5. Tester la connexion OpenRouter
  if (apiKey) {
    try {
      const testStart = Date.now()
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://sanovia.vercel.app',
          'X-Title': 'Sanovia Debug',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Dis juste OK' }],
          max_tokens: 10,
          temperature: 0
        })
      })

      const latency = Date.now() - testStart
      const responseText = await response.text()

      let parsedError = null
      try {
        parsedError = JSON.parse(responseText)
      } catch {
        parsedError = { raw: responseText.slice(0, 500) }
      }

      if (response.ok) {
        diagnostics.checks.push({
          name: 'OPENROUTER_API_TEST',
          status: 'OK',
          detail: `Réponse en ${latency}ms`,
          model: parsedError?.model,
          usage: parsedError?.usage
        })
      } else {
        diagnostics.checks.push({
          name: 'OPENROUTER_API_TEST',
          status: 'ERROR',
          detail: `HTTP ${response.status} en ${latency}ms`,
          error: parsedError?.error || parsedError
        })
      }
    } catch (err: any) {
      diagnostics.checks.push({
        name: 'OPENROUTER_API_TEST',
        status: 'ERROR',
        detail: err?.message || 'Erreur de connexion réseau'
      })
    }
  } else {
    diagnostics.checks.push({
      name: 'OPENROUTER_API_TEST',
      status: 'SKIPPED',
      detail: 'Impossible de tester sans OPENROUTER_API_KEY'
    })
  }

  // Résumé
  const allOk = diagnostics.checks.every(c => c.status === 'OK')
  diagnostics.summary = allOk ? 'Tout est configuré correctement !' : 'Des problèmes ont été détectés.'
  diagnostics.criticalIssues = diagnostics.checks
    .filter(c => c.status === 'MISSING' || c.status === 'ERROR')
    .map(c => c.name)

  return NextResponse.json(diagnostics, { status: allOk ? 200 : 503 })
}
