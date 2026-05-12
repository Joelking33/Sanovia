// ============================================================
// SANOvIA — Système d'internationalisation (i18n)
// Supporte : fr (Français), ba (Baoulé), dy (Dioula), bq (Bété)
// ============================================================

export type Language = 'fr' | 'ba' | 'dy' | 'bq'

export interface LanguageInfo {
  code: Language
  label: string
  flag: string
  speechCode: string
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'ba', label: 'Baoulé', flag: '🇨🇮', speechCode: 'fr-FR' },
  { code: 'dy', label: 'Dioula', flag: '🇨🇮', speechCode: 'fr-FR' },
  { code: 'bq', label: 'Bété', flag: '🇨🇮', speechCode: 'fr-FR' },
]

// ============================================================
// TRADUCTIONS COMPLÈTES
// ============================================================

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'Chargement...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia est un assistant informatif, pas un médecin. Les informations fournies ne remplacent pas un avis médical professionnel.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Connexion',
    'login.subtitle': 'Assistant santé intelligent pour la Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Mot de passe',
    'login.passwordPlaceholder': 'Votre mot de passe',
    'login.submit': 'Se connecter',
    'login.forgotPassword': 'Mot de passe oublié ?',
    'login.noAccount': 'Pas encore de compte ?',
    'login.createAccount': 'Créer un compte',
    'login.errorEmpty': 'Veuillez remplir tous les champs.',
    'login.errorGeneric': 'Erreur de connexion.',
    'login.orGoogle': 'Ou se connecter avec Google',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Créer un compte',
    'register.subtitle': 'Rejoignez Sanovia pour accéder à l\'assistant santé',
    'register.name': 'Nom complet',
    'register.namePlaceholder': 'Votre nom complet',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Mot de passe',
    'register.passwordPlaceholder': 'Min. 8 caractères, 1 majuscule, 1 chiffre',
    'register.confirmPassword': 'Confirmer le mot de passe',
    'register.confirmPasswordPlaceholder': 'Confirmez votre mot de passe',
    'register.language': 'Langue préférée',
    'register.submit': 'Créer mon compte',
    'register.hasAccount': 'Déjà un compte ?',
    'register.login': 'Se connecter',
    'register.errorEmpty': 'Veuillez remplir tous les champs.',
    'register.errorPasswordLength': 'Le mot de passe doit contenir au moins 8 caractères.',
    'register.errorPasswordStrength': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.',
    'register.errorPasswordMismatch': 'Les mots de passe ne correspondent pas.',
    'register.errorGeneric': 'Erreur d\'inscription.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Mot de passe oublié ?',
    'forgot.subtitle': 'Réinitialisation du mot de passe',
    'forgot.description': 'Entrez l\'adresse email associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.',
    'forgot.email': 'Adresse email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Envoyer le lien de réinitialisation',
    'forgot.backToLogin': '← Retour à la connexion',
    'forgot.errorEmpty': 'Veuillez entrer votre adresse email.',
    'forgot.success': 'Si cette adresse email est associée à un compte, un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception (et spam).',
    'forgot.errorGeneric': 'Erreur lors de la demande.',
    'forgot.devMode': 'Mode développement — SMTP non configuré.',
    'forgot.useToken': 'Utiliser ce token pour réinitialiser',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Définir un nouveau mot de passe',
    'reset.subtitle': 'Nouveau mot de passe',
    'reset.description': 'Créez un mot de passe fort pour sécuriser votre compte Sanovia.',
    'reset.token': 'Token de réinitialisation',
    'reset.tokenPlaceholder': 'Collez le token de réinitialisation ici...',
    'reset.tokenHint': 'Token pré-rempli (mode développement)',
    'reset.password': 'Nouveau mot de passe',
    'reset.passwordPlaceholder': 'Min. 8 caractères, 1 majuscule, 1 chiffre',
    'reset.confirmPassword': 'Confirmer le mot de passe',
    'reset.confirmPasswordPlaceholder': 'Confirmez votre nouveau mot de passe',
    'reset.submit': 'Réinitialiser mon mot de passe',
    'reset.backToLogin': '← Retour à la connexion',
    'reset.expiry': 'Le lien de réinitialisation expire dans 1 heure. Si vous n\'avez pas reçu l\'email, vérifiez vos spams ou refaites une demande.',
    'reset.successTitle': 'Mot de passe mis à jour !',
    'reset.successMessage': 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
    'reset.loginButton': 'Se connecter',
    'reset.errorNoToken': 'Le token de réinitialisation est requis.',
    'reset.errorEmpty': 'Veuillez remplir tous les champs.',
    'reset.errorPasswordLength': 'Le mot de passe doit contenir au moins 8 caractères.',
    'reset.errorPasswordUpper': 'Le mot de passe doit contenir au moins une majuscule.',
    'reset.errorPasswordDigit': 'Le mot de passe doit contenir au moins un chiffre.',
    'reset.errorPasswordMismatch': 'Les mots de passe ne correspondent pas.',
    'reset.errorMismatch': 'Les mots de passe ne correspondent pas.',
    'reset.errorGeneric': 'Erreur lors de la réinitialisation.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': 'Bonjour {name} ! Je suis votre assistant d\'information santé.\nJe peux vous aider sur des questions de santé, de prévention et de bien-être.',
    'chat.voiceHint': 'Vous pouvez aussi m\'envoyer des messages vocaux ! Cliquez sur le micro pour enregistrer.\nJ\'écouterai en {lang} et vous répondrai également à voix.',
    'chat.disclaimer': 'Je ne suis pas un médecin. Ces informations sont à titre éducatif.\nConsultez toujours un professionnel de santé pour votre situation personnelle.',
    'chat.suggestion1': 'Comment traiter une petite brûlure ?',
    'chat.suggestion2': 'Signes de grossesse au premier trimestre',
    'chat.suggestion3': 'Symptômes du paludisme',
    'chat.placeholder': 'Posez votre question de santé...',
    'chat.newChat': 'Nouveau chat',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Aucune conversation pour le moment.\nCommencez par poser une question de santé !',
    'chat.newConversation': 'Nouvelle conversation',
    'chat.logout': 'Se déconnecter',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'ENREGISTREMENT',
    'voice.cancel': 'Annuler',
    'voice.send': 'Envoyer',
    'voice.cancelTooltip': 'Annuler l\'enregistrement',
    'voice.sendTooltip': 'Envoyer le message vocal',
    'voice.transcribing': 'Transcription en cours en {lang}...',
    'voice.tooShort': 'Enregistrement trop court. Parlez plus longtemps.',
    'voice.noSpeech': 'Aucune parole détectée. Veuillez réessayer.',
    'voice.transcriptionError': 'Erreur lors de la transcription. Vérifiez votre connexion.',
    'voice.noMic': 'Impossible d\'accéder au microphone. Vérifiez les permissions de votre navigateur.',
    'voice.micTooltip': 'Enregistrer un message vocal',
    'voice.languageHint': 'Langue vocale : {lang} — Changez la langue dans le sélecteur en haut',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Écouter la réponse vocale',
    'tts.generating': 'Génération...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Arrêter',
    'tts.replay': 'Rejouer',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Urgences CI',
    'urgency.samu': 'SAMU / Urgences médicales',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police secours',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Centre Anti-Poison',
    'urgency.psychiatric': 'SOS Psychiatrique',
    'urgency.blood': 'Centre Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Ligne Info Santé',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Santé',
    'category.premiers_secours': 'Urgences',
    'category.grossesse': 'Grossesse',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Aujourd\'hui',
    'date.yesterday': 'Hier',
    'date.daysAgo': 'Il y a {n} jours',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Erreur réseau. Vérifiez votre connexion.',
    'error.session': 'Session expirée. Veuillez vous reconnecter.',
  },

  ba: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'A kɛ ɛnɛ...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia yɛ sran man tɔɔrɔ, a tɛ tɔɔrɔ. Kunnafoniw tɛ tɔɔrɔ kɛnɛ bɛɛ.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Jɛ kɛ',
    'login.subtitle': 'Sran man tɔɔrɔ Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Kunafɔn min bɛɛ',
    'login.passwordPlaceholder': 'I kunafɔn min bɛɛ',
    'login.submit': 'Jɛ kɛ',
    'login.forgotPassword': 'Kunafɔn wɔlɔ ?',
    'login.noAccount': 'I tɛ komɛn tɛ ?',
    'login.createAccount': 'Komɛn kɛ',
    'login.errorEmpty': 'Bɛɛw kɛ.',
    'login.errorGeneric': 'Jɛ kɛ banna.',
    'login.orGoogle': 'Google jɛ kɛ',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Komɛn kɛ',
    'register.subtitle': 'Sanovia sɔrɔ sran man tɔɔrɔ',
    'register.name': 'I tɔgɔ',
    'register.namePlaceholder': 'I tɔgɔ',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Kunafɔn min bɛɛ',
    'register.passwordPlaceholder': 'Min. 8, 1 nufɛlɛn, 1 nɔmbɛrɛ',
    'register.confirmPassword': 'Kunafɔn sɔrɔ',
    'register.confirmPasswordPlaceholder': 'Kunafɔn sɔrɔ',
    'register.language': 'Kan',
    'register.submit': 'Komɛn kɛ',
    'register.hasAccount': 'I tɛ komɛn tɛ ?',
    'register.login': 'Jɛ kɛ',
    'register.errorEmpty': 'Bɛɛw kɛ.',
    'register.errorPasswordLength': 'Kunafɔn 8 kɛnɛ.',
    'register.errorPasswordStrength': 'Kunafɔn nufɛlɛn, ninsɔrɔn ni nɔmbɛrɛ kɛ.',
    'register.errorPasswordMismatch': 'Kunafɔnw tɛ mɔrɔ.',
    'register.errorGeneric': 'Komɛn banna.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Kunafɔn wɔlɔ ?',
    'forgot.subtitle': 'Kunafɔn ɛlɛmɔn',
    'forgot.description': 'I email kɛ.',
    'forgot.email': 'Email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Kunafɔn link min bɛɛ',
    'forgot.backToLogin': '← Jɛ kɛ',
    'forgot.errorEmpty': 'I email kɛ.',
    'forgot.success': 'Email bɛɛ. I email kɛ.',
    'forgot.errorGeneric': 'Baara banna.',
    'forgot.devMode': 'Mode baara — SMTP tɛ.',
    'forgot.useToken': 'Token sɔrɔ',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Kunafɔn ɛlɛmɔn',
    'reset.subtitle': 'Kunafɔn ɛlɛmɔn',
    'reset.description': 'Kunafɔn kɛnɛ.',
    'reset.token': 'Token',
    'reset.tokenPlaceholder': 'Token kɛ...',
    'reset.tokenHint': 'Token (mode baara)',
    'reset.password': 'Kunafɔn ɛlɛmɔn',
    'reset.passwordPlaceholder': 'Min. 8, 1 nufɛlɛn, 1 nɔmbɛrɛ',
    'reset.confirmPassword': 'Kunafɔn sɔrɔ',
    'reset.confirmPasswordPlaceholder': 'Kunafɔn sɔrɔ',
    'reset.submit': 'Kunafɔn ɛlɛmɔn',
    'reset.backToLogin': '← Jɛ kɛ',
    'reset.expiry': 'Link 1 l\'ɛrɛ. I email tɛ, sɔrɔ ɛnɛ.',
    'reset.successTitle': 'Kunafɔn kɛnɛ !',
    'reset.successMessage': 'Kunafɔn kɛnɛ. Jɛ kɛ.',
    'reset.loginButton': 'Jɛ kɛ',
    'reset.errorNoToken': 'Token kɛ.',
    'reset.errorEmpty': 'Bɛɛw kɛ.',
    'reset.errorPasswordLength': 'Kunafɔn 8 kɛnɛ.',
    'reset.errorPasswordUpper': 'Kunafɔn nufɛlɛn kɛ.',
    'reset.errorPasswordDigit': 'Kunafɔn nɔmbɛrɛ kɛ.',
    'reset.errorPasswordMismatch': 'Kunafɔnw tɛ mɔrɔ.',
    'reset.errorMismatch': 'Kunafɔnw tɛ mɔrɔ.',
    'reset.errorGeneric': 'Baara banna.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': '{name} ! Luɛ Sanoovia, sran man tɔɔrɔ.\nSran man kunnafoni bɛɛ dɛmɛ.',
    'chat.voiceHint': 'I bɛ mɛsɛjɛ wɛrɛ fɔ ! Mɛkro kɛ.\n{lang} fɔ, n\'a rɛpɔn.',
    'chat.disclaimer': 'Luɛ sran man tɔɔrɔ tɛ. Kunnafoni ye.\nTɔɔrɔ kɛnɛ.',
    'chat.suggestion1': 'Ɔrɔ yɛlɛma ?',
    'chat.suggestion2': 'Glɔ glɔbɛlɛ sɔrɔnɔw',
    'chat.suggestion3': 'Paludisme sɔrɔnɔw',
    'chat.placeholder': 'Sran man fɔn...',
    'chat.newChat': 'Kunnafoni ɛlɛmɔn',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Kunnafoni tɛ.\nSran man fɔn !',
    'chat.newConversation': 'Kunnafoni ɛlɛmɔn',
    'chat.logout': 'Kɛnɛ',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'FƆN',
    'voice.cancel': 'Tɛbɛ',
    'voice.send': 'Min bɛɛ',
    'voice.cancelTooltip': 'Fɔn tɛbɛ',
    'voice.sendTooltip': 'Mɛsɛjɛ min bɛɛ',
    'voice.transcribing': 'Kunnafɔn kɛ {lang}...',
    'voice.tooShort': 'Fɔn kɛnɛ. Fɔ ɛnɛ.',
    'voice.noSpeech': 'Parɔlɛ tɛ. Sɔrɔ ɛnɛ.',
    'voice.transcriptionError': 'Kunnafɔn banna.',
    'voice.noMic': 'Mɛkro tɛ. Permissions kɛ.',
    'voice.micTooltip': 'Mɛsɛjɛ fɔ',
    'voice.languageHint': 'Kan : {lang} — Kan ɛlɛmɔn',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Réponse fɔ',
    'tts.generating': 'Kɛ ɛnɛ...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Tɛmɛ',
    'tts.replay': 'Sɔrɔ ɛnɛ',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Banjɛ CI',
    'urgency.samu': 'SAMU',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Anti-Poison',
    'urgency.psychiatric': 'SOS Kɛnɛmɔkɔn',
    'urgency.blood': 'Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Info Santé',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Sran',
    'category.premiers_secours': 'Banjɛ',
    'category.grossesse': 'Glɔ',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Lɛla',
    'date.yesterday': 'Dɛmɛ',
    'date.daysAgo': '{n} lɛla',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Baara banna. I connexion kɛ.',
    'error.session': 'Session banna. Jɛ kɛ ɛnɛ.',
  },

  dy: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'Ka kɛ ɛnɛ...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia ye banjɛ ɛɛrɛ la jɛlen ye, tɔɔrɔ tɛ ye. Kunnafoniw tɛ tɔɔrɔ kɛnɛ bɛɛ.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Se connecter',
    'login.subtitle': 'Banjɛ ɛɛrɛ tɔɔrɔ Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Kunnafɔn',
    'login.passwordPlaceholder': 'I kunnafɔn',
    'login.submit': 'Se connecter',
    'login.forgotPassword': 'Kunnafɔn wɔlɔ ?',
    'login.noAccount': 'I tɛ compte tɛ ?',
    'login.createAccount': 'Compte kɛ',
    'login.errorEmpty': 'Bɛɛw kɛ.',
    'login.errorGeneric': 'Connexion banna.',
    'login.orGoogle': 'Google se connecter',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Compte kɛ',
    'register.subtitle': 'Sanovia banjɛ ɛɛrɛ tɔɔrɔ',
    'register.name': 'I tɔgɔ',
    'register.namePlaceholder': 'I tɔgɔ',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Kunnafɔn',
    'register.passwordPlaceholder': 'Min. 8, 1 nufɛlɛn, 1 nɔmbɛrɛ',
    'register.confirmPassword': 'Kunnafɔn sɔrɔ',
    'register.confirmPasswordPlaceholder': 'Kunnafɔn sɔrɔ',
    'register.language': 'Kan',
    'register.submit': 'Compte kɛ',
    'register.hasAccount': 'I tɛ compte tɛ ?',
    'register.login': 'Se connecter',
    'register.errorEmpty': 'Bɛɛw kɛ.',
    'register.errorPasswordLength': 'Kunnafɔn 8 kɛnɛ.',
    'register.errorPasswordStrength': 'Kunnafɔn nufɛlɛn, ninsɔrɔn ni nɔmbɛrɛ kɛ.',
    'register.errorPasswordMismatch': 'Kunnafɔnw tɛ mɔrɔ.',
    'register.errorGeneric': 'Compte banna.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Kunnafɔn wɔlɔ ?',
    'forgot.subtitle': 'Kunnafɔn ɛlɛmɔn',
    'forgot.description': 'I email kɛ.',
    'forgot.email': 'Email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Kunnafɔn link min bɛɛ',
    'forgot.backToLogin': '← Se connecter',
    'forgot.errorEmpty': 'I email kɛ.',
    'forgot.success': 'Email bɛɛ. I email kɛ.',
    'forgot.errorGeneric': 'Baara banna.',
    'forgot.devMode': 'Mode baara — SMTP tɛ.',
    'forgot.useToken': 'Token sɔrɔ',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Kunnafɔn ɛlɛmɔn',
    'reset.subtitle': 'Kunnafɔn ɛlɛmɔn',
    'reset.description': 'Kunnafɔn kɛnɛ.',
    'reset.token': 'Token',
    'reset.tokenPlaceholder': 'Token kɛ...',
    'reset.tokenHint': 'Token (mode baara)',
    'reset.password': 'Kunnafɔn ɛlɛmɔn',
    'reset.passwordPlaceholder': 'Min. 8, 1 nufɛlɛn, 1 nɔmbɛrɛ',
    'reset.confirmPassword': 'Kunnafɔn sɔrɔ',
    'reset.confirmPasswordPlaceholder': 'Kunnafɔn sɔrɔ',
    'reset.submit': 'Kunnafɔn ɛlɛmɔn',
    'reset.backToLogin': '← Se connecter',
    'reset.expiry': 'Link 1 l\'ɛrɛ.',
    'reset.successTitle': 'Kunnafɔn kɛnɛ !',
    'reset.successMessage': 'Kunnafɔn kɛnɛ. Se connecter.',
    'reset.loginButton': 'Se connecter',
    'reset.errorNoToken': 'Token kɛ.',
    'reset.errorEmpty': 'Bɛɛw kɛ.',
    'reset.errorPasswordLength': 'Kunnafɔn 8 kɛnɛ.',
    'reset.errorPasswordUpper': 'Kunnafɔn nufɛlɛn kɛ.',
    'reset.errorPasswordDigit': 'Kunnafɔn nɔmbɛrɛ kɛ.',
    'reset.errorPasswordMismatch': 'Kunnafɔnw tɛ mɔrɔ.',
    'reset.errorMismatch': 'Kunnafɔnw tɛ mɔrɔ.',
    'reset.errorGeneric': 'Baara banna.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': '{name} ! I tɔɔrɔ Sanoovia ye, banjɛ ɛɛrɛ tɔɔrɔ.\nBanjɛ ɛɛrɛ kunnafoni bɛɛ dɛmɛ.',
    'chat.voiceHint': 'I bɛ mɛsɛjɛ wɛrɛ fɔ ! Mɛkro kɛ.\n{lang} fɔ, n\'a rɛpɔn.',
    'chat.disclaimer': 'Tɔɔrɔ tɛ ye. Kunnafoni ye.\nTɔɔrɔ kɛnɛ.',
    'chat.suggestion1': 'Ɔrɔ yɛlɛma ?',
    'chat.suggestion2': 'Glɔ glɔbɛlɛ sɔrɔnɔw',
    'chat.suggestion3': 'Paludisme sɔrɔnɔw',
    'chat.placeholder': 'Banjɛ ɛɛrɛ fɔn...',
    'chat.newChat': 'Kunnafoni ɛlɛmɔn',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Kunnafoni tɛ.\nBanjɛ ɛɛrɛ fɔn !',
    'chat.newConversation': 'Kunnafoni ɛlɛmɔn',
    'chat.logout': 'Kɛnɛ',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'FƆN',
    'voice.cancel': 'Tɛbɛ',
    'voice.send': 'Min bɛɛ',
    'voice.cancelTooltip': 'Fɔn tɛbɛ',
    'voice.sendTooltip': 'Mɛsɛjɛ min bɛɛ',
    'voice.transcribing': 'Kunnafɔn kɛ {lang}...',
    'voice.tooShort': 'Fɔn kɛnɛ. Fɔ ɛnɛ.',
    'voice.noSpeech': 'Parɔlɛ tɛ. Sɔrɔ ɛnɛ.',
    'voice.transcriptionError': 'Kunnafɔn banna.',
    'voice.noMic': 'Mɛkro tɛ. Permissions kɛ.',
    'voice.micTooltip': 'Mɛsɛjɛ fɔ',
    'voice.languageHint': 'Kan : {lang} — Kan ɛlɛmɔn',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Réponse fɔ',
    'tts.generating': 'Ka kɛ ɛnɛ...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Tɛmɛ',
    'tts.replay': 'Sɔrɔ ɛnɛ',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Banjɛ CI',
    'urgency.samu': 'SAMU',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Anti-Poison',
    'urgency.psychiatric': 'SOS Kɛnɛmɔkɔn',
    'urgency.blood': 'Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Info Banjɛ',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Banjɛ',
    'category.premiers_secours': 'Banjɛ',
    'category.grossesse': 'Glɔ',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Bii',
    'date.yesterday': 'Jina',
    'date.daysAgo': '{n} bii',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Baara banna. I connexion kɛ.',
    'error.session': 'Session banna. Se connecter ɛnɛ.',
  },

  bq: {
    // ─── Commun ────────────────────────────────────────
    'loading': 'Ka kɛ ɛnɛ...',
    'sanovia': 'Sanovia',
    'appName': 'Sanovia',
    'disclaimer': 'Sanovia yɛ sran ɛlɛmɔn wle, tɔɔrɔ tɛ. Kunnafoniw tɛ tɔɔrɔ kɛnɛ bɛɛ.',

    // ─── Login ─────────────────────────────────────────
    'login.title': 'Jɛ kɛ',
    'login.subtitle': 'Sran ɛlɛmɔn tɔɔrɔ Côte d\'Ivoire',
    'login.email': 'Email',
    'login.emailPlaceholder': 'votre@email.com',
    'login.password': 'Kunafɔn',
    'login.passwordPlaceholder': 'I kunafɔn',
    'login.submit': 'Jɛ kɛ',
    'login.forgotPassword': 'Kunafɔn wɔlɔ ?',
    'login.noAccount': 'I tɛ komɛn tɛ ?',
    'login.createAccount': 'Komɛn kɛ',
    'login.errorEmpty': 'Bɛɛw kɛ.',
    'login.errorGeneric': 'Jɛ kɛ banna.',
    'login.orGoogle': 'Google jɛ kɛ',

    // ─── Register ──────────────────────────────────────
    'register.title': 'Komɛn kɛ',
    'register.subtitle': 'Sanovia sran ɛlɛmɔn tɔɔrɔ',
    'register.name': 'I tɔgɔ',
    'register.namePlaceholder': 'I tɔgɔ',
    'register.email': 'Email',
    'register.emailPlaceholder': 'votre@email.com',
    'register.password': 'Kunafɔn',
    'register.passwordPlaceholder': 'Min. 8, 1 nufɛlɛn, 1 nɔmbɛrɛ',
    'register.confirmPassword': 'Kunafɔn sɔrɔ',
    'register.confirmPasswordPlaceholder': 'Kunafɔn sɔrɔ',
    'register.language': 'Kan',
    'register.submit': 'Komɛn kɛ',
    'register.hasAccount': 'I tɛ komɛn tɛ ?',
    'register.login': 'Jɛ kɛ',
    'register.errorEmpty': 'Bɛɛw kɛ.',
    'register.errorPasswordLength': 'Kunafɔn 8 kɛnɛ.',
    'register.errorPasswordStrength': 'Kunafɔn nufɛlɛn, ninsɔrɔn ni nɔmbɛrɛ kɛ.',
    'register.errorPasswordMismatch': 'Kunafɔnw tɛ mɔrɔ.',
    'register.errorGeneric': 'Komɛn banna.',

    // ─── Forgot Password ───────────────────────────────
    'forgot.title': 'Kunafɔn wɔlɔ ?',
    'forgot.subtitle': 'Kunafɔn ɛlɛmɔn',
    'forgot.description': 'I email kɛ.',
    'forgot.email': 'Email',
    'forgot.emailPlaceholder': 'votre@email.com',
    'forgot.submit': 'Kunafɔn link min bɛɛ',
    'forgot.backToLogin': '← Jɛ kɛ',
    'forgot.errorEmpty': 'I email kɛ.',
    'forgot.success': 'Email bɛɛ. I email kɛ.',
    'forgot.errorGeneric': 'Baara banna.',
    'forgot.devMode': 'Mode baara — SMTP tɛ.',
    'forgot.useToken': 'Token sɔrɔ',

    // ─── Reset Password ────────────────────────────────
    'reset.title': 'Kunafɔn ɛlɛmɔn',
    'reset.subtitle': 'Kunafɔn ɛlɛmɔn',
    'reset.description': 'Kunafɔn kɛnɛ.',
    'reset.token': 'Token',
    'reset.tokenPlaceholder': 'Token kɛ...',
    'reset.tokenHint': 'Token (mode baara)',
    'reset.password': 'Kunafɔn ɛlɛmɔn',
    'reset.passwordPlaceholder': 'Min. 8, 1 nufɛlɛn, 1 nɔmbɛrɛ',
    'reset.confirmPassword': 'Kunafɔn sɔrɔ',
    'reset.confirmPasswordPlaceholder': 'Kunafɔn sɔrɔ',
    'reset.submit': 'Kunafɔn ɛlɛmɔn',
    'reset.backToLogin': '← Jɛ kɛ',
    'reset.expiry': 'Link 1 l\'ɛrɛ.',
    'reset.successTitle': 'Kunafɔn kɛnɛ !',
    'reset.successMessage': 'Kunafɔn kɛnɛ. Jɛ kɛ.',
    'reset.loginButton': 'Jɛ kɛ',
    'reset.errorNoToken': 'Token kɛ.',
    'reset.errorEmpty': 'Bɛɛw kɛ.',
    'reset.errorPasswordLength': 'Kunafɔn 8 kɛnɛ.',
    'reset.errorPasswordUpper': 'Kunafɔn nufɛlɛn kɛ.',
    'reset.errorPasswordDigit': 'Kunafɔn nɔmbɛrɛ kɛ.',
    'reset.errorPasswordMismatch': 'Kunafɔnw tɛ mɔrɔ.',
    'reset.errorMismatch': 'Kunafɔnw tɛ mɔrɔ.',
    'reset.errorGeneric': 'Baara banna.',

    // ─── Chat ──────────────────────────────────────────
    'chat.welcome': '{name} ! Sanovia yɛ, sran ɛlɛmɔn wle.\nSran kunnafoni bɛɛ wle.',
    'chat.voiceHint': 'I bɛ mɛsɛjɛ wɛrɛ fɔ ! Mɛkro kɛ.\n{lang} fɔ, n\'a rɛpɔn.',
    'chat.disclaimer': 'Tɔɔrɔ tɛ. Kunnafoni ye.\nTɔɔrɔ kɛnɛ.',
    'chat.suggestion1': 'Ɔrɔ yɛlɛma ?',
    'chat.suggestion2': 'Glɔ glɔbɛlɛ sɔrɔnɔw',
    'chat.suggestion3': 'Paludisme sɔrɔnɔw',
    'chat.placeholder': 'Sran fɔn...',
    'chat.newChat': 'Kunnafoni ɛlɛmɔn',
    'chat.history': 'Historique —',
    'chat.noConversations': 'Kunnafoni tɛ.\nSran fɔn !',
    'chat.newConversation': 'Kunnafoni ɛlɛmɔn',
    'chat.logout': 'Kɛnɛ',

    // ─── Voice ─────────────────────────────────────────
    'voice.recording': 'FƆN',
    'voice.cancel': 'Tɛbɛ',
    'voice.send': 'Min bɛɛ',
    'voice.cancelTooltip': 'Fɔn tɛbɛ',
    'voice.sendTooltip': 'Mɛsɛjɛ min bɛɛ',
    'voice.transcribing': 'Kunnafɔn kɛ {lang}...',
    'voice.tooShort': 'Fɔn kɛnɛ. Fɔ ɛnɛ.',
    'voice.noSpeech': 'Parɔlɛ tɛ. Sɔrɔ ɛnɛ.',
    'voice.transcriptionError': 'Kunnafɔn banna.',
    'voice.noMic': 'Mɛkro tɛ. Permissions kɛ.',
    'voice.micTooltip': 'Mɛsɛjɛ fɔ',
    'voice.languageHint': 'Kan : {lang} — Kan ɛlɛmɔn',

    // ─── TTS ───────────────────────────────────────────
    'tts.listen': 'Réponse fɔ',
    'tts.generating': 'Ka kɛ ɛnɛ...',
    'tts.listenIn': 'Écouter en {lang}',
    'tts.stop': 'Tɛmɛ',
    'tts.replay': 'Sɔrɔ ɛnɛ',

    // ─── Urgences ──────────────────────────────────────
    'urgency.title': 'Banjɛ CI',
    'urgency.samu': 'SAMU',
    'urgency.firefighters': 'Pompiers',
    'urgency.police': 'Police',
    'urgency.chu_cocody': 'CHU Cocody',
    'urgency.chu_abidjan': 'CHU Abidjan',
    'urgency.chu_treichville': 'CHU Treichville',
    'urgency.chu_yopougon': 'CHU Yopougon',
    'urgency.poison': 'Anti-Poison',
    'urgency.psychiatric': 'SOS Kɛnɛmɔkɔn',
    'urgency.blood': 'Transfusion',
    'urgency.redcross': 'Croix-Rouge',
    'urgency.healthline': 'Info Sran',

    // ─── Catégories ────────────────────────────────────
    'category.general': 'Sran',
    'category.premiers_secours': 'Banjɛ',
    'category.grossesse': 'Glɔ',

    // ─── Dates ─────────────────────────────────────────
    'date.today': 'Lɛla',
    'date.yesterday': 'Dɛmɛ',
    'date.daysAgo': '{n} lɛla',

    // ─── Erreurs Store ─────────────────────────────────
    'error.network': 'Baara banna. I connexion kɛ.',
    'error.session': 'Session banna. Jɛ kɛ ɛnɛ.',
  },
}

// ============================================================
// FONCTIONS PUBLIQUES
// ============================================================

/**
 * Traduit une clé dans la langue donnée
 * Supporte les variables : t('chat.welcome', 'fr', { name: 'Kofi', lang: 'Baoulé' })
 */
export function t(key: string, language: Language = 'fr', vars?: Record<string, string>): string {
  let text = translations[language]?.[key] || translations.fr[key] || key

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v)
    }
  }

  return text
}

/**
 * Retourne les infos d'une langue
 */
export function getLanguageInfo(code: string): LanguageInfo {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0]
}

/**
 * Retourne le label d'une langue dans sa propre langue
 */
export function getLanguageLabel(code: Language): string {
  return getLanguageInfo(code).label
}