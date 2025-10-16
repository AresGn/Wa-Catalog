const fs = require('fs');
const path = require('path');

// Chemin de la session WhatsApp
const sessionPath = path.join(__dirname, '.wwebjs_auth', 'session-wa-catalog-bot');

console.log('🧹 Nettoyage de la session WhatsApp...');

// Supprimer le dossier de session s'il existe
if (fs.existsSync(sessionPath)) {
    try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('✅ Session nettoyée avec succès!');
        console.log('📱 Au prochain lancement, vous devrez rescanner le QR code.');
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
        process.exit(1);
    }
} else {
    console.log('ℹ️  Aucune session trouvée à nettoyer.');
}

console.log('🎯 Prêt pour une nouvelle connexion WhatsApp!');