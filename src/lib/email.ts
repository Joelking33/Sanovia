import nodemailer from 'nodemailer'

// ============================================================
// CONFIGURATION SMTP
// ============================================================

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@sanovia.ci'
const APP_NAME = process.env.APP_NAME || 'Sanovia'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // Timeout plus long pour les SMTP lents
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    })
  }
  return transporter
}

// ============================================================
// VÉRIFICATION SMTP
// ============================================================

export function isSMTPConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS)
}

// ============================================================
// ENVOI D'EMAIL DE RÉINITIALISATION
// ============================================================

interface SendResetEmailParams {
  to: string
  name: string
  resetToken: string
  language?: string
}

export async function sendResetPasswordEmail({ to, name, resetToken, language = 'fr' }: SendResetEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!isSMTPConfigured()) {
    console.warn('[Email] SMTP non configuré — email de reset non envoyé. Token:', resetToken)
    // En mode développement, on "simule" l'envoi
    return { success: true }
  }

  try {
    const resetUrl = `${APP_URL}?reset=${resetToken}`

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${APP_NAME}" <${EMAIL_FROM}>`,
      to,
      subject: getResetEmailSubject(language),
      html: getResetEmailHTML({ name, resetUrl, resetToken, language }),
    }

    const info = await getTransporter().sendMail(mailOptions)
    console.log(`[Email] Reset envoyé à ${to} — Message ID: ${info.messageId}`)
    return { success: true }
  } catch (err: any) {
    console.error('[Email] Erreur envoi reset password:', err?.message || err)
    return { success: false, error: err?.message || "Erreur lors de l'envoi de l'email." }
  }
}

// ============================================================
// TEMPLATES D'EMAIL
// ============================================================

function getResetEmailSubject(language: string): string {
  const subjects: Record<string, string> = {
    fr: 'Réinitialisation de votre mot de passe — Sanovia',
    ba: 'Sanovia — Klene moo pwen ye',
    dy: 'Sanovia — I ka kene soro',
    bq: 'Sanovia — Wle pwen',
  }
  return subjects[language] || subjects.fr
}

function getResetEmailHTML({ name, resetUrl, resetToken, language }: {
  name: string
  resetUrl: string
  resetToken: string
  language: string
}): string {
  const firstName = name.split(' ')[0] || name

  const content: Record<string, { greeting: string; body: string; button: string; footer: string; expiry: string }> = {
    fr: {
      greeting: `Bonjour ${firstName},`,
      body: `Nous avons reçu une demande de réinitialisation de votre mot de passe sur <strong>Sanovia</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.`,
      button: 'Réinitialiser mon mot de passe',
      footer: 'Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :',
      expiry: 'Ce lien expire dans 1 heure.',
    },
    ba: {
      greeting: `I ni ce ${firstName},`,
      body: `An soro kene pwen klene ole i ma <strong>Sanovia</strong> la. I te a ye, i be a fe.`,
      button: 'Klene moo pwen',
      footer: 'Soro i ninnu:',
      expiry: 'Len ke i la 1 lere kofe.',
    },
    dy: {
      greeting: `I ni ce ${firstName},`,
      body: `An soro i ka kene soro ole i ma <strong>Sanovia</strong> la. I te a ye, i be a fe.`,
      button: 'Kene soro',
      footer: 'Soro i ninnu:',
      expiry: 'Len ke i la 1 lere kofe.',
    },
    bq: {
      greeting: `I ni ce ${firstName},`,
      body: `An soro pwen klene i ma <strong>Sanovia</strong> la. I te a ye, i be a fe.`,
      button: 'Klene pwen',
      footer: 'Soro i ninnu:',
      expiry: 'Len ke i la 1 lere kofe.',
    },
  }

  const t = content[language] || content.fr

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.greeting} Sanovia</title>
</head>
<body style="margin:0; padding:0; background-color:#0d1117; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#161b22; border-radius:16px; border:1px solid #21262d; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0; text-align:center;">
              <div style="display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:14px; background:linear-gradient(135deg,rgba(0,198,167,.2),rgba(0,168,232,.2)); border:1px solid rgba(0,198,167,.3); font-size:32px; margin-bottom:16px;">
                🧠
              </div>
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#e6edf3;">
                <span style="background:linear-gradient(135deg,#00c6a7,#00a8e8); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Sanovia</span>
              </h1>
              <p style="margin:4px 0 0; font-size:12px; color:#8b949e;">Assistant santé intelligent</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px; font-size:15px; color:#e6edf3; line-height:1.6;">
                ${t.greeting}
              </p>
              <p style="margin:0 0 24px; font-size:14px; color:#8b949e; line-height:1.6;">
                ${t.body}
              </p>

              <!-- Button -->
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <a href="${resetUrl}" target="_blank"
                    style="display:inline-block; padding:12px 32px; background:linear-gradient(135deg,#00c6a7,#00a8e8); color:#ffffff; text-decoration:none; border-radius:10px; font-size:14px; font-weight:600; letter-spacing:0.3px;">
                    ${t.button}
                  </a>
                </td>
              </tr>

              <!-- Expiry warning -->
              <tr>
                <td>
                  <div style="background:rgba(234,179,8,.08); border:1px solid rgba(234,179,8,.2); border-radius:8px; padding:12px 16px;">
                    <p style="margin:0; font-size:12px; color:#fbbf24; line-height:1.5;">
                      ⏱️ ${t.expiry}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Fallback link -->
              <tr>
                <td style="padding-top:20px;">
                  <p style="margin:0 0 6px; font-size:12px; color:#484f58; line-height:1.5;">
                    ${t.footer}
                  </p>
                  <p style="margin:0; font-size:11px; word-break:break-all; color:#00c6a7; background:rgba(0,198,167,.06); padding:8px 12px; border-radius:6px; border:1px solid rgba(0,198,167,.15);">
                    ${resetUrl}
                  </p>
                </td>
              </tr>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px; border-top:1px solid #21262d; text-align:center;">
              <p style="margin:0 0 4px; font-size:11px; color:#484f58;">
                Sanovia — Assistant santé intelligent pour la Côte d&apos;Ivoire
              </p>
              <p style="margin:0; font-size:11px; color:#484f58;">
                ⚠️ Si vous n&apos;avez pas demandé cette réinitialisation, ignorez cet email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================================
// ENVOI D'EMAIL GÉNÉRIQUE (pour futures utilisations)
// ============================================================

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!isSMTPConfigured()) {
    console.warn('[Email] SMTP non configuré — email non envoyé.')
    return { success: true }
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    })
    console.log(`[Email] Envoyé à ${to} — Message ID: ${info.messageId}`)
    return { success: true }
  } catch (err: any) {
    console.error('[Email] Erreur:', err?.message || err)
    return { success: false, error: err?.message || "Erreur lors de l'envoi de l'email." }
  }
}
