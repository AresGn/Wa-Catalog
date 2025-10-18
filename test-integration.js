#!/usr/bin/env node
require('dotenv').config();

const supabase = require('./bot/services/supabase');
const formatter = require('./bot/services/formatter');
const gemini = require('./bot/services/gemini');

console.log('🧪 Test d\'intégration Bot-DB-Dashboard\n');
console.log('═'.repeat(50));

async function testIntegration() {
  let testsPassés = 0;
  let testsTotal = 0;

  // Test 1: Connexion Supabase
  console.log('\n📊 Test 1: Connexion à Supabase...');
  testsTotal++;
  try {
    const stats = await supabase.getBotStats();
    if (stats !== null) {
      console.log('✅ Connexion Supabase OK');
      console.log(`   Utilisateurs: ${stats.totalUsers}, Recherches: ${stats.totalSearches}`);
      testsPassés++;
    } else {
      console.log('❌ Erreur: Impossible de récupérer les stats');
    }
  } catch (error) {
    console.log('❌ Erreur Supabase:', error.message);
  }

  // Test 2: Création utilisateur
  console.log('\n👤 Test 2: Création/Mise à jour utilisateur...');
  testsTotal++;
  try {
    const testPhone = '22999999999@c.us';
    const user = await supabase.createOrUpdateUser(testPhone, 'Test User');
    if (user) {
      console.log('✅ Utilisateur créé/mis à jour');
      console.log(`   ID: ${user.id}, Phone: ${user.phone_number}`);
      testsPassés++;
    } else {
      console.log('❌ Erreur: Impossible de créer l\'utilisateur');
    }
  } catch (error) {
    console.log('❌ Erreur création utilisateur:', error.message);
  }

  // Test 3: Log de recherche
  console.log('\n🔍 Test 3: Enregistrement d\'une recherche...');
  testsTotal++;
  try {
    const searchData = {
      userPhone: '22999999999@c.us',
      query: 'test iPhone 13',
      resultsCount: 5,
      responseTime: 250
    };
    const search = await supabase.logSearch(searchData);
    if (search) {
      console.log('✅ Recherche enregistrée');
      console.log(`   ID: ${search.id}, Query: ${search.query}`);
      testsPassés++;
    } else {
      console.log('❌ Erreur: Impossible d\'enregistrer la recherche');
    }
  } catch (error) {
    console.log('❌ Erreur log recherche:', error.message);
  }

  // Test 4: Service Formatter
  console.log('\n📝 Test 4: Service de formatage...');
  testsTotal++;
  try {
    const helpMessage = formatter.formatHelpMessage();
    if (helpMessage && helpMessage.includes('WA-CATALOG')) {
      console.log('✅ Service formatter OK');
      console.log(`   Message d'aide: ${helpMessage.substring(0, 50)}...`);
      testsPassés++;
    } else {
      console.log('❌ Erreur: Formatter ne fonctionne pas');
    }
  } catch (error) {
    console.log('❌ Erreur formatter:', error.message);
  }

  // Test 5: Service Gemini (si configuré)
  if (process.env.GEMINI_API_KEY) {
    console.log('\n🤖 Test 5: Service Gemini AI...');
    testsTotal++;
    try {
      const intent = await gemini.analyzeIntent('Je cherche un iPhone 13');
      if (intent && intent.intent) {
        console.log('✅ Service Gemini OK');
        console.log(`   Intent détecté: ${intent.intent}`);
        testsPassés++;
      } else {
        console.log('⚠️  Gemini configuré mais réponse invalide');
      }
    } catch (error) {
      console.log('⚠️  Erreur Gemini (non critique):', error.message);
    }
  } else {
    console.log('\n⏭️  Test 5: Gemini AI skippé (pas de clé API)');
  }

  // Test 6: Analytics
  console.log('\n📈 Test 6: Enregistrement analytics...');
  testsTotal++;
  try {
    const analyticsData = {
      eventType: 'test_integration',
      userPhone: 'system',
      eventData: {
        test: true,
        timestamp: new Date().toISOString()
      },
      responseTime: 100
    };
    const analytics = await supabase.logAnalytics(analyticsData);
    if (analytics) {
      console.log('✅ Analytics enregistré');
      console.log(`   Event: ${analytics.event_type}`);
      testsPassés++;
    } else {
      console.log('❌ Erreur: Impossible d\'enregistrer analytics');
    }
  } catch (error) {
    console.log('❌ Erreur analytics:', error.message);
  }

  // Test 7: Configuration Bot
  console.log('\n⚙️  Test 7: Configuration du bot...');
  testsTotal++;
  try {
    const config = await supabase.getConfig('welcome_message');
    if (config) {
      console.log('✅ Configuration récupérée');
      console.log(`   Welcome message configuré`);
      testsPassés++;
    } else {
      console.log('⚠️  Pas de configuration (normal si tables vides)');
      testsPassés++; // On considère que c'est OK
    }
  } catch (error) {
    console.log('❌ Erreur config:', error.message);
  }

  // Test 8: Recherche produits
  console.log('\n🛍️  Test 8: Recherche de produits...');
  testsTotal++;
  try {
    const products = await supabase.searchProducts('test');
    console.log('✅ Recherche produits OK');
    console.log(`   ${products.length} produits trouvés`);
    testsPassés++;
  } catch (error) {
    console.log('❌ Erreur recherche produits:', error.message);
  }

  // Résultats finaux
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 RÉSULTATS DES TESTS:');
  console.log(`   ✅ Tests réussis: ${testsPassés}/${testsTotal}`);
  console.log(`   📈 Taux de réussite: ${Math.round((testsPassés/testsTotal)*100)}%`);
  
  if (testsPassés === testsTotal) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS!');
    console.log('   Le bot est prêt à être utilisé.');
  } else if (testsPassés >= testsTotal * 0.7) {
    console.log('\n✅ INTÉGRATION FONCTIONNELLE');
    console.log('   La plupart des composants fonctionnent.');
  } else {
    console.log('\n⚠️  INTÉGRATION PARTIELLE');
    console.log('   Vérifiez la configuration et les tables DB.');
  }

  console.log('\n💡 Prochaines étapes:');
  console.log('   1. npm run dev       - Démarrer le bot');
  console.log('   2. npm run admin:dev - Démarrer le dashboard');
  console.log('   3. Scannez le QR code WhatsApp');
  console.log('   4. Envoyez des messages test au bot');
  console.log('   5. Vérifiez les stats sur http://localhost:3000/bot\n');
}

// Exécuter les tests
testIntegration().catch(console.error);
