const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialisation du client avec authentification locale et chemin vers Chromium
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'wa-catalog-bot',
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Gestion du QR code
client.on('qr', (qr) => {
    console.log('🔄 QR Code reçu. Scannez-le avec WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Quand le client est prêt
client.on('ready', () => {
    console.log('✅ Wa-Catalog Bot est prêt!');
    console.log('📱 Numéro connecté:', client.info.wid.user);
});

// Liste des numéros autorisés (format international sans +)
const authorizedNumbers = [
    '22962703515@c.us',  // +229 62 70 35 15
    '22960813863@c.us',  // +229 60 81 38 63
    '22999323073@c.us'   // +229 99 32 30 73
];

// Gestionnaire de messages
client.on('message', async (msg) => {
    console.log(`📨 Message de ${msg.from}: ${msg.body}`);

    // Vérifier si l'expéditeur est autorisé
    if (!authorizedNumbers.includes(msg.from)) {
        console.log(`🚫 Message ignoré - numéro non autorisé: ${msg.from}`);
        return; // Ne pas répondre
    }

    const messageBody = msg.body.toLowerCase();

    // Ne répondre qu'aux mots-clés spécifiques
    if (messageBody.includes('bonjour') || messageBody.includes('salut') || messageBody.includes('hello')) {
        await msg.reply('👋 Bonjour! Je suis Wa-Catalog, le bot de recherche de produits WhatsApp. Comment puis-je vous aider?');
    } else if (messageBody.includes('aide') || messageBody.includes('help')) {
        await msg.reply(`🆘 *Aide Wa-Catalog*\n\nEnvoyez-moi ce que vous cherchez, par exemple:\n• "Je cherche des baskets Nike"\n• "Montre-moi des téléphones Samsung"\n• "Vendeurs d'ordinateurs à Cotonou"\n\nJe vous connecterai directement aux vendeurs!`);
    } else if (messageBody === 'ping') {
        await msg.reply('🏓 Pong! Le bot fonctionne correctement.');
    } else {
        // Ne pas répondre aux autres messages
        console.log(`🚫 Message ignoré - mot-clé non reconnu: "${messageBody}"`);
        return;
    }
});

// Gestion des erreurs
client.on('auth_failure', (msg) => {
    console.error('❌ Échec d\'authentification:', msg);
});

client.on('disconnected', (reason) => {
    console.log('🔌 Déconnecté:', reason);
    if (reason === 'LoggedOut') {
        console.log('⚠️  Session expirée. Veuillez rescanner le QR code.');
    }
});

// Démarrage du client
client.initialize();