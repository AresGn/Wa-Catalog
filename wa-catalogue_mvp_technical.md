# Wa-Catalog MVP - Guide Technique Complet

## 🎯 Objectif du MVP
Créer un bot WhatsApp fonctionnel qui permet de rechercher des produits dans une base de données de vendeurs, en utilisant whatsapp-web.js et Gemini API.

## 🏗️ Architecture Technique

```
┌─────────────────────────────────────────────────────┐
│                   ARCHITECTURE MVP                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│   Client WhatsApp                                   │
│         ↓                                           │
│   Bot WhatsApp (whatsapp-web.js)                   │
│         ↓                                           │
│   Message Handler                                   │
│         ↓                                           │
│   Gemini API (NLP)                                  │
│         ↓                                           │
│   Database Query                                    │
│         ↓                                           │
│   Response Formatter                                │
│         ↓                                           │
│   Client WhatsApp                                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│   Admin Interface (Web)                             │
│         ↓                                           │
│   CRUD Vendeurs/Produits                           │
│         ↓                                           │
│   MongoDB Database                                  │
└─────────────────────────────────────────────────────┘
```

## 📁 Structure du Projet

```
wa-catalog-bot/
├── bot/
│   ├── index.js                 # Point d'entrée du bot
│   ├── handlers/
│   │   ├── messageHandler.js    # Gestion des messages
│   │   ├── searchHandler.js     # Logique de recherche
│   │   └── vendorHandler.js     # Gestion vendeurs
│   ├── services/
│   │   ├── geminiService.js     # Intégration Gemini API
│   │   ├── databaseService.js   # Requêtes MongoDB
│   │   └── whatsappService.js   # Fonctions WhatsApp
│   └── utils/
│       ├── formatter.js         # Formatage réponses
│       └── logger.js           # Logs
├── admin/
│   ├── server.js               # Serveur Express
│   ├── routes/
│   │   ├── vendors.js          # CRUD vendeurs
│   │   └── products.js         # CRUD produits
│   └── views/
│       ├── dashboard.ejs       # Dashboard admin
│       └── vendor-form.ejs     # Formulaire vendeur
├── database/
│   ├── models/
│   │   ├── Vendor.js          # Modèle vendeur
│   │   ├── Product.js         # Modèle produit
│   │   └── SearchLog.js       # Logs recherches
│   └── connection.js          # Config MongoDB
├── .env                       # Variables d'environnement
├── package.json
└── README.md
```

## 💾 Modèles de Données

### Modèle Vendeur
```javascript
const vendorSchema = {
  _id: ObjectId,
  name: String,                    // "TechShop229"
  whatsappNumber: String,          // "+22997000000"
  category: [String],              // ["Électronique", "Téléphones"]
  location: {
    city: String,                 // "Cotonou"
    quartier: String,             // "Ganhi"
  },
  rating: {
    average: Number,              // 4.5
    count: Number                 // 127
  },
  verified: Boolean,              // true/false
  status: String,                 // "active", "inactive"
  joinedDate: Date,
  lastActive: Date,
  products: [ObjectId]            // Références aux produits
}
```

### Modèle Produit
```javascript
const productSchema = {
  _id: ObjectId,
  vendorId: ObjectId,
  name: String,                   // "iPhone 13 128GB"
  category: String,               // "Téléphones"
  subCategory: String,            // "iPhone"
  price: {
    amount: Number,               // 350000
    currency: String,             // "FCFA"
    negotiable: Boolean           // true
  },
  description: String,
  keywords: [String],             // ["iphone", "13", "apple", "smartphone"]
  images: [String],               // URLs des images
  availability: String,           // "in_stock", "out_of_stock", "sur_commande"
  condition: String,              // "Neuf", "Occasion", "Reconditionné"
  addedDate: Date,
  lastUpdated: Date
}
```

### Modèle Log de Recherche
```javascript
const searchLogSchema = {
  _id: ObjectId,
  userPhone: String,              // Anonymisé
  query: String,                  // "iphone 13 pas cher"
  processedQuery: String,         // "iphone 13 prix_bas"
  intent: String,                 // "product_search"
  results: {
    count: Number,
    vendorsReturned: [ObjectId],
    clicked: ObjectId             // Vendeur contacté
  },
  timestamp: Date,
  responseTime: Number            // ms
}
```

## 🤖 Workflow du Bot

### 1. Réception et Analyse du Message

```javascript
// messageHandler.js
const handleIncomingMessage = async (message) => {
  // 1. Log du message entrant
  console.log(`📱 Message de ${message.from}: ${message.body}`);
  
  // 2. Détection du type de requête
  const intent = await detectIntent(message.body);
  
  // 3. Routage vers le bon handler
  switch(intent.type) {
    case 'GREETING':
      return handleGreeting(message);
    case 'PRODUCT_SEARCH':
      return handleProductSearch(message);
    case 'VENDOR_REGISTRATION':
      return handleVendorRegistration(message);
    case 'HELP':
      return handleHelp(message);
    default:
      return handleUnknown(message);
  }
};
```

### 2. Intégration Gemini pour NLP

```javascript
// geminiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeQuery = async (userMessage) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `
    Analyse cette requête d'un utilisateur cherchant un produit.
    Message: "${userMessage}"
    
    Extrais:
    1. Le produit recherché
    2. La catégorie
    3. Le budget approximatif (si mentionné)
    4. La ville (si mentionnée)
    5. Les critères spécifiques (neuf/occasion, couleur, etc.)
    
    Retourne en JSON:
    {
      "product": "...",
      "category": "...",
      "budget": { "min": null, "max": null },
      "location": "...",
      "criteria": []
    }
  `;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
```

### 3. Recherche dans la Base de Données

```javascript
// searchHandler.js
const searchProducts = async (queryData) => {
  const { product, category, budget, location } = queryData;
  
  // Construction de la requête MongoDB
  const query = {
    $and: [
      // Recherche textuelle
      product ? { 
        $or: [
          { name: { $regex: product, $options: 'i' } },
          { keywords: { $in: product.split(' ') } }
        ]
      } : {},
      
      // Filtre catégorie
      category ? { category } : {},
      
      // Filtre prix
      budget.max ? { 'price.amount': { $lte: budget.max } } : {},
      
      // Filtre localisation (via jointure vendeur)
      location ? { /* jointure avec vendor.location */ } : {},
      
      // Seulement produits disponibles
      { availability: 'in_stock' }
    ]
  };
  
  // Recherche avec jointure vendeur
  const results = await Product.aggregate([
    { $match: query },
    { $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor'
    }},
    { $unwind: '$vendor' },
    { $limit: 5 }, // Max 5 résultats pour WhatsApp
    { $sort: { 'vendor.rating.average': -1 } } // Meilleurs vendeurs d'abord
  ]);
  
  return results;
};
```

### 4. Formatage et Envoi de la Réponse

```javascript
// formatter.js
const formatSearchResults = (results, query) => {
  if (results.length === 0) {
    return `😔 Désolé, je n'ai trouvé aucun "${query.product}" disponible.\n\nEssayez:\n• Un autre terme de recherche\n• Sans spécifier la ville\n• "aide" pour voir comment utiliser wa-catalog`;
  }
  
  let response = `🔍 J'ai trouvé ${results.length} vendeur(s) pour "${query.product}":\n\n`;
  
  results.forEach((item, index) => {
    response += `${index + 1}. *${item.vendor.name}* ${item.vendor.verified ? '✅' : ''}\n`;
    response += `   📱 ${item.name}\n`;
    response += `   💰 ${item.price.amount.toLocaleString()} FCFA`;
    response += item.price.negotiable ? ' (négociable)\n' : '\n';
    response += `   📍 ${item.vendor.location.city}\n`;
    response += `   ⭐ ${item.vendor.rating.average}/5 (${item.vendor.rating.count} avis)\n`;
    response += `   → wa.me/${item.vendor.whatsappNumber.substring(1)}\n\n`;
  });
  
  response += `💡 *Astuce:* Cliquez sur le lien wa.me pour contacter directement le vendeur!`;
  
  return response;
};
```

## 🖥️ Interface Admin Simple

### Dashboard Admin (HTML/Express)

```javascript
// admin/server.js
const express = require('express');
const app = express();

// Page principale - Liste des vendeurs
app.get('/admin', async (req, res) => {
  const vendors = await Vendor.find().populate('products');
  res.render('dashboard', { vendors });
});

// Ajout manuel d'un vendeur
app.post('/admin/vendor/add', async (req, res) => {
  const { name, whatsapp, city, category } = req.body;
  
  const vendor = new Vendor({
    name,
    whatsappNumber: whatsapp,
    location: { city },
    category: category.split(','),
    status: 'active',
    verified: false,
    rating: { average: 0, count: 0 }
  });
  
  await vendor.save();
  res.redirect('/admin');
});

// Ajout de produits pour un vendeur
app.post('/admin/product/add', async (req, res) => {
  const { vendorId, name, price, category, description } = req.body;
  
  const product = new Product({
    vendorId,
    name,
    price: { amount: parseInt(price), currency: 'FCFA' },
    category,
    description,
    keywords: name.toLowerCase().split(' '),
    availability: 'in_stock'
  });
  
  await product.save();
  
  // Ajouter au vendeur
  await Vendor.findByIdAndUpdate(vendorId, {
    $push: { products: product._id }
  });
  
  res.redirect('/admin');
});
```

### Interface Admin Basic (EJS Template)

```html
<!-- admin/views/dashboard.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title>wa-catalog Admin</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    .vendor-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
    .add-form { background: #f0f0f0; padding: 20px; margin: 20px 0; }
    button { background: #25D366; color: white; padding: 10px 20px; }
  </style>
</head>
<body>
  <h1>🚀 Wa-Catalog - Admin Dashboard</h1>
  
  <div class="stats">
    <h2>📊 Stats</h2>
    <p>Total Vendeurs: <%= vendors.length %></p>
    <p>Total Produits: <%= vendors.reduce((acc, v) => acc + v.products.length, 0) %></p>
  </div>

  <!-- Formulaire ajout vendeur -->
  <div class="add-form">
    <h3>➕ Ajouter un Vendeur</h3>
    <form action="/admin/vendor/add" method="POST">
      <input name="name" placeholder="Nom du vendeur" required><br>
      <input name="whatsapp" placeholder="+22997000000" required><br>
      <input name="city" placeholder="Ville" required><br>
      <input name="category" placeholder="Électronique, Mode" required><br>
      <button type="submit">Ajouter Vendeur</button>
    </form>
  </div>

  <!-- Liste des vendeurs -->
  <h2>👥 Vendeurs</h2>
  <% vendors.forEach(vendor => { %>
    <div class="vendor-card">
      <h3><%= vendor.name %> (<%= vendor.products.length %> produits)</h3>
      <p>📱 <%= vendor.whatsappNumber %> | 📍 <%= vendor.location.city %></p>
      
      <!-- Formulaire ajout produit -->
      <details>
        <summary>Ajouter un produit</summary>
        <form action="/admin/product/add" method="POST">
          <input type="hidden" name="vendorId" value="<%= vendor._id %>">
          <input name="name" placeholder="Nom du produit" required>
          <input name="price" type="number" placeholder="Prix FCFA" required>
          <input name="category" placeholder="Catégorie" required>
          <textarea name="description" placeholder="Description"></textarea>
          <button type="submit">Ajouter Produit</button>
        </form>
      </details>
      
      <!-- Liste des produits -->
      <details>
        <summary>Voir les produits</summary>
        <% vendor.products.forEach(product => { %>
          <div>
            • <%= product.name %> - <%= product.price.amount %> FCFA
          </div>
        <% }) %>
      </details>
    </div>
  <% }) %>
</body>
</html>
```

## 🚀 Workflow Complet d'Onboarding Vendeur

### Étape 1: Vendeur contacte le bot
```
Vendeur → "Bonjour, je veux vendre"
Bot → "Bienvenue sur wa-catalog! 🎉
       Pour référencer vos produits:
       1. Envoyez votre nom de boutique
       2. Votre ville
       3. Vos catégories (ex: Téléphones, Accessoires)
       
       Notre équipe ajoutera vos produits sous 24h!"
```

### Étape 2: Admin reçoit notification
```javascript
// Notification Slack/Discord/Email
const notifyNewVendor = async (vendorInfo) => {
  await sendSlackMessage({
    text: `🆕 Nouveau vendeur: ${vendorInfo.name}`,
    details: vendorInfo
  });
};
```

### Étape 3: Admin ajoute manuellement via interface
- Se connecte au dashboard
- Voit la demande du vendeur
- Ajoute les produits un par un
- Marque comme "actif"

### Étape 4: Confirmation au vendeur
```
Bot → "✅ Votre boutique est maintenant sur wa-catalog!
       Vos clients peuvent trouver vos produits en cherchant.
       
       Partagez ce message pour avoir plus de clients:
       'Trouvez tous mes produits sur wa-catalog! 
        Envoyez un message au +22960000000'"
```

## 📝 Variables d'Environnement (.env)

```env
# WhatsApp Config
WHATSAPP_SESSION_NAME=wa-catalog-bot

# Database
MONGODB_URI=mongodb://localhost:27017/wa-catalog

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Admin
ADMIN_PORT=3000
ADMIN_PASSWORD=your_secure_password

# Notifications (optionnel)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 🔧 Installation et Lancement

### 1. Installation des dépendances
```bash
npm init -y
npm install whatsapp-web.js qrcode-terminal
npm install express mongoose ejs body-parser
npm install @google/generative-ai
npm install dotenv nodemon
```

### 2. Lancement du bot
```bash
# Terminal 1 - Bot WhatsApp
npm run bot

# Terminal 2 - Interface Admin
npm run admin
```

### 3. Configuration initiale
1. Scanner le QR code WhatsApp
2. Accéder à http://localhost:3000/admin
3. Ajouter les premiers vendeurs/produits
4. Tester avec des messages

## 📊 Métriques à Suivre (MVP)

```javascript
// Analytics basiques
const metrics = {
  daily: {
    totalSearches: 0,
    uniqueUsers: new Set(),
    productsFound: 0,
    vendorsContacted: 0
  },
  
  topSearches: {}, // { "iphone": 45, "samsung": 23 }
  topVendors: {},  // { "vendorId": clickCount }
  
  responseTime: [], // Moyennes en ms
  conversionRate: 0 // recherches → contacts vendeur
};
```

## 🎯 Objectifs MVP (Première Semaine)

1. **Jour 1-2**: Setup technique de base
   - Bot qui répond "Bonjour"
   - Base MongoDB connectée
   - Interface admin basique

2. **Jour 3-4**: Logique de recherche
   - Intégration Gemini
   - Recherche simple dans DB
   - Formatage des résultats

3. **Jour 5-6**: Onboarding vendeurs
   - 10 vendeurs tests
   - 50 produits minimum
   - Tests réels avec amis

4. **Jour 7**: Analyse et itération
   - Mesurer les métriques
   - Identifier les bugs
   - Préparer v2

## 💡 Tips pour le MVP

1. **Commencez TRÈS simple**
   - Pas de gestion des images au début
   - Pas de système d'avis complexe
   - Focus sur recherche → résultats

2. **Testez avec de vrais vendeurs**
   - Vos amis qui vendent sur WhatsApp
   - Offrez gratuité totale pour les early adopters

3. **Mesurez TOUT**
   - Chaque recherche
   - Chaque clic
   - Temps de réponse

4. **Itérez rapidement**
   - Deploy tous les jours
   - Feedback utilisateur constant
   - Pivot si nécessaire

---

## 🚀 Prochaines Étapes

Une fois le MVP validé (>50 recherches/jour), passer à:
- Système d'avis automatisé
- Upload d'images produits
- Notifications push vendeurs
- Paiement mobile money intégré
- Multi-langue (français, anglais, fon)

Le but : Valider que les gens VEULENT et UTILISENT le service avant de construire des features complexes.