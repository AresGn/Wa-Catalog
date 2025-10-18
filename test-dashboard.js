#!/usr/bin/env node
require('dotenv').config();

const botService = require('./admin/services/botService');

console.log('🧪 Test du Dashboard Bot\n');
console.log('═'.repeat(50));

async function testDashboard() {
  console.log('\n📊 Récupération des stats pour le dashboard...');
  console.time('⏱️  Temps de chargement');
  
  try {
    const stats = await botService.getStats();
    console.timeEnd('⏱️  Temps de chargement');
    
    console.log('\n✅ Stats récupérées avec succès!\n');
    
    console.log('📈 Résumé des statistiques:');
    console.log(`   • Utilisateurs totaux: ${stats.totalUsers}`);
    console.log(`   • Actifs aujourd'hui: ${stats.activeToday}`);
    console.log(`   • Recherches totales: ${stats.totalSearches}`);
    console.log(`   • Recherches aujourd'hui: ${stats.searchesToday}`);
    console.log(`   • Clics totaux: ${stats.totalClicks}`);
    console.log(`   • Taux de conversion: ${stats.conversionRate}%`);
    console.log(`   • Temps de réponse moyen: ${stats.avgResponseTime}ms`);
    
    console.log('\n🔍 Top recherches:');
    const topSearches = Object.entries(stats.topSearches).slice(0, 5);
    if (topSearches.length > 0) {
      topSearches.forEach(([query, count], i) => {
        console.log(`   ${i + 1}. "${query}" - ${count} fois`);
      });
    } else {
      console.log('   Aucune recherche pour le moment');
    }
    
    console.log('\n🏪 Top vendeurs:');
    if (stats.topVendors.length > 0) {
      stats.topVendors.slice(0, 3).forEach((vendor, i) => {
        console.log(`   ${i + 1}. ${vendor.name} (${vendor.city}) - ${vendor.clicks} clics`);
      });
    } else {
      console.log('   Aucun vendeur pour le moment');
    }
    
    console.log('\n📊 Activité journalière (derniers 7 jours):');
    if (stats.dailyActivity.length > 0) {
      stats.dailyActivity.forEach(day => {
        console.log(`   • ${day.date}: ${day.searches} recherches, ${day.clicks} clics, ${day.users} utilisateurs`);
      });
    }
    
    console.log('\n💚 Le dashboard devrait maintenant fonctionner!');
    console.log('   Accédez à http://localhost:3000/bot pour voir les stats\n');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la récupération des stats:');
    console.error(error);
    
    console.log('\n💡 Solutions possibles:');
    console.log('   1. Vérifiez que les tables sont créées: npm run db:init-bot');
    console.log('   2. Vérifiez les variables d\'environnement dans .env');
    console.log('   3. Vérifiez la connexion à Supabase');
  }
}

// Exécuter le test
testDashboard().catch(console.error);
