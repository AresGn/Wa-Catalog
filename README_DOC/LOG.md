ares@GNIMAGNON:~/Vidéos/afrisearch-bot$ node test-integration.js
[dotenv@17.2.3] injecting env (5) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔄 add secrets lifecycle management: https://dotenvx.com/ops
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔄 add secrets lifecycle management: https://dotenvx.com/ops
🧪 Test d'intégration Bot-DB-Dashboard

══════════════════════════════════════════════════

📊 Test 1: Connexion à Supabase...
✅ Connexion Supabase OK
   Utilisateurs: 0, Recherches: 0

👤 Test 2: Création/Mise à jour utilisateur...
✅ Utilisateur créé/mis à jour
   ID: f2802881-35a9-43ab-a4df-75050bc43d62, Phone: 22999999999@c.us

🔍 Test 3: Enregistrement d'une recherche...
✅ Recherche enregistrée
   ID: 0b21510f-7dab-47e3-bab8-f028cddff3fd, Query: test iPhone 13

📝 Test 4: Service de formatage...
✅ Service formatter OK
   Message d'aide: 🤖 *WA-CATALOG BOT - AIDE*

Je peux vous aider à t...

🤖 Test 5: Service Gemini AI...
Error analyzing intent with Gemini: GoogleGenerativeAIFetchError: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent: [404 Not Found] models/gemini-pro is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.
    at handleResponseNotOk (/home/ares/Vidéos/afrisearch-bot/node_modules/@google/generative-ai/dist/index.js:414:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async makeRequest (/home/ares/Vidéos/afrisearch-bot/node_modules/@google/generative-ai/dist/index.js:387:9)
    at async generateContent (/home/ares/Vidéos/afrisearch-bot/node_modules/@google/generative-ai/dist/index.js:832:22)
    at async GeminiService.analyzeIntent (/home/ares/Vidéos/afrisearch-bot/bot/services/gemini.js:38:22)
    at async testIntegration (/home/ares/Vidéos/afrisearch-bot/test-integration.js:91:22) {
  status: 404,
  statusText: 'Not Found',
  errorDetails: undefined
}
✅ Service Gemini OK
   Intent détecté: other

📈 Test 6: Enregistrement analytics...
✅ Analytics enregistré
   Event: test_integration

⚙️  Test 7: Configuration du bot...
⚠️  Pas de configuration (normal si tables vides)

🛍️  Test 8: Recherche de produits...
✅ Recherche produits OK
   0 produits trouvés

══════════════════════════════════════════════════

📊 RÉSULTATS DES TESTS:
   ✅ Tests réussis: 8/8
   📈 Taux de réussite: 100%

🎉 TOUS LES TESTS SONT PASSÉS!
   Le bot est prêt à être utilisé.

💡 Prochaines étapes:
   1. npm run dev       - Démarrer le bot
   2. npm run admin:dev - Démarrer le dashboard
   3. Scannez le QR code WhatsApp
   4. Envoyez des messages test au bot
   5. Vérifiez les stats sur http://localhost:3000/bot

ares@GNIMAGNON:~/Vidéos/afrisearch-bot$ 