# Wa-Catalog MVP - Guide Technique

## 🎯 Objectif
Créer un bot WhatsApp qui permet de chercher des produits chez des vendeurs locaux via message simple.

## 🏗️ Stack Technique

### Core Technologies
- **Bot WhatsApp**: `whatsapp-web.js`
- **Base de données**: **Supabase** (PostgreSQL + Auth + Storage + API temps réel)
- **IA/NLP**: Gemini API ou Claude API
- **Backend**: Node.js + Express
- **Admin Interface**: React (ou simple HTML/EJS pour MVP)

### Pourquoi Supabase ?
✅ PostgreSQL puissant pour recherches complexes
✅ API REST auto-générée (pas besoin de créer les endpoints)
✅ Auth intégré pour l'admin
✅ Storage pour images produits
✅ Temps réel pour notifications
✅ Gratuit jusqu'à 500MB + 2GB bandwidth

## 📊 Architecture Simplifiée

```
Client WhatsApp
    ↓
Bot WhatsApp (whatsapp-web.js)
    ↓
Message Handler → Gemini API (analyse)
    ↓
Supabase Database (recherche)
    ↓
Réponse formatée → Client WhatsApp

Admin Dashboard
    ↓
Supabase API (CRUD)
    ↓
Database
```

## 💾 Structure Base de Données Supabase

### Table `vendors`
```sql
id (uuid, primary key)
name (text) - "TechShop229"
whatsapp_number (text) - "+22997000000"
city (text) - "Cotonou"
quartier (text)
categories (text[]) - {"Électronique", "Téléphones"}
rating_average (decimal) - 4.5
rating_count (integer) - 127
verified (boolean)
status (text) - "active" | "inactive"
created_at (timestamp)
last_active (timestamp)
```

### Table `products`
```sql
id (uuid, primary key)
vendor_id (uuid, foreign key → vendors)
name (text) - "iPhone 13 128GB"
category (text)
price (integer) - 350000
currency (text) - "FCFA"
negotiable (boolean)
description (text)
keywords (text[]) - {"iphone", "13", "apple"}
image_url (text)
availability (text) - "in_stock" | "out_of_stock"
condition (text) - "Neuf" | "Occasion"
created_at (timestamp)
```

### Table `search_logs` (Analytics)
```sql
id (uuid, primary key)
user_phone (text) - hashé pour anonymat
query (text) - "iphone 13 pas cher"
intent (text) - "product_search"
results_count (integer)
vendor_clicked (uuid) - si contact vendeur
created_at (timestamp)
response_time_ms (integer)
```

### Configuration Supabase

**Row Level Security (RLS):**
- Admin : accès total
- Bot : lecture seule sur vendors/products
- Public : aucun accès direct

**Indexes pour performance:**
```sql
CREATE INDEX idx_products_keywords ON products USING GIN(keywords);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_vendors_city ON vendors(city);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
```

## 📁 Structure du Projet

```
wa-catalog-bot/
├── bot/
│   ├── index.js              # Point d'entrée
│   ├── handlers/
│   │   ├── message.js        # Routing messages
│   │   └── search.js         # Logique recherche
│   └── services/
│       ├── gemini.js         # NLP
│       ├── supabase.js       # Client Supabase
│       └── formatter.js      # Format réponses WhatsApp
├── admin/
│   ├── server.js             # API Express
│   ├── routes/
│   │   ├── vendors.js        # CRUD vendeurs
│   │   └── products.js       # CRUD produits
│   └── views/                # Interface admin
├── .env
└── package.json
```

## 🔑 Variables d'Environnement

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_KEY=eyJhbGciOiJ...  # Pour admin

# Gemini API
GEMINI_API_KEY=AIza...

# Admin
ADMIN_PORT=3000
```

## 🤖 Workflow Bot (Résumé)

### 1. Message Reçu
```javascript
// User: "Je cherche iPhone 13 à Cotonou"

bot.on('message', async (msg) => {
  const intent = await analyzeWithGemini(msg.body);
  
  if (intent.type === 'PRODUCT_SEARCH') {
    const results = await searchInSupabase(intent.data);
    const response = formatResults(results);
    await msg.reply(response);
  }
});
```

### 2. Analyse avec Gemini
Prompt envoyé à Gemini :
```
"Analyse cette requête et extrais en JSON:
- product: nom du produit
- city: ville si mentionnée
- max_price: budget max si mentionné

Requête: 'Je cherche iPhone 13 à Cotonou'"
```

Réponse attendue :
```json
{
  "product": "iPhone 13",
  "city": "Cotonou",
  "max_price": null
}
```

### 3. Recherche Supabase
```javascript
const { data } = await supabase
  .from('products')
  .select(`
    *,
    vendor:vendors(name, whatsapp_number, city, rating_average, verified)
  `)
  .ilike('name', `%${product}%`)
  .eq('vendors.city', city)
  .eq('availability', 'in_stock')
  .order('vendors.rating_average', { ascending: false })
  .limit(5);
```

### 4. Réponse Formatée
```
🔍 J'ai trouvé 3 vendeurs pour "iPhone 13":

1. *TechShop229* ✅
   📱 iPhone 13 128GB
   💰 350,000 FCFA (négociable)
   📍 Cotonou
   ⭐ 4.8/5 (127 avis)
   → wa.me/22997000000

2. *PhoneMaster*
   📱 iPhone 13 Pro 256GB
   💰 450,000 FCFA
   📍 Cotonou
   ⭐ 4.5/5 (89 avis)
   → wa.me/22996000000

💡 Cliquez sur le lien pour contacter!
```

## 🖥️ Interface Admin

### Dashboard Simple (HTML + Supabase JS Client)

**Fonctionnalités essentielles:**
1. Liste des vendeurs avec leurs produits
2. Formulaire ajout vendeur
3. Formulaire ajout produit (par vendeur)
4. Stats basiques (total vendeurs, produits, recherches)

**Tech Stack Admin:**
- Frontend : HTML + Vanilla JS (ou React si tu préfères)
- Backend : API directe Supabase (pas besoin de serveur Express complexe)
- Auth : Supabase Auth pour login admin

### Exemple minimal avec Supabase JS:
```javascript
// Ajouter un vendeur
const { data, error } = await supabase
  .from('vendors')
  .insert([
    {
      name: 'TechShop229',
      whatsapp_number: '+22997000000',
      city: 'Cotonou',
      categories: ['Électronique'],
      status: 'active'
    }
  ]);
```

## 🚀 Plan de Déploiement MVP

### Phase 1 : Setup (Jour 1-2)
- [ ] Créer projet Supabase
- [ ] Créer tables (vendors, products, search_logs)
- [ ] Setup bot WhatsApp basique
- [ ] Test connexion bot ↔ Supabase

### Phase 2 : Logique Core (Jour 3-4)
- [ ] Intégrer Gemini pour NLP
- [ ] Implémenter recherche produits
- [ ] Formatter réponses WhatsApp
- [ ] Logger toutes les recherches

### Phase 3 : Admin Interface (Jour 5)
- [ ] Page simple ajout vendeurs
- [ ] Page ajout produits
- [ ] Dashboard stats basiques

### Phase 4 : Test Réel (Jour 6-7)
- [ ] Onboarder 10 vendeurs amis
- [ ] Ajouter 50+ produits
- [ ] Tester avec 20 utilisateurs
- [ ] Mesurer métriques

## 📊 Métriques à Tracker (MVP)

Via table `search_logs` + queries Supabase:

```sql
-- Recherches par jour
SELECT DATE(created_at), COUNT(*) 
FROM search_logs 
GROUP BY DATE(created_at);

-- Top produits recherchés
SELECT query, COUNT(*) as count
FROM search_logs
GROUP BY query
ORDER BY count DESC
LIMIT 10;

-- Taux de conversion (recherche → contact)
SELECT 
  COUNT(*) as total_searches,
  COUNT(vendor_clicked) as contacts,
  (COUNT(vendor_clicked)::float / COUNT(*)) * 100 as conversion_rate
FROM search_logs;
```

## 🎯 Objectifs Semaine 1

**Métriques de succès:**
- ✅ 10 vendeurs enregistrés
- ✅ 50+ produits dans la base
- ✅ 50 recherches effectuées
- ✅ 5+ contacts vendeurs générés
- ✅ Temps de réponse < 3 secondes

## 💡 Avantages Supabase pour ce Projet

| Besoin | Solution Supabase |
|--------|-------------------|
| CRUD vendeurs/produits | API REST auto-générée |
| Recherche full-text | PostgreSQL + indexes |
| Images produits | Supabase Storage |
| Logs recherches | Table + dashboard analytics |
| Notifications admin | Realtime subscriptions |
| Scale futur | Serverless auto-scale |

## 🔧 Installation Rapide

```bash
# 1. Init projet
npm init -y

# 2. Dépendances
npm install whatsapp-web.js qrcode-terminal
npm install @supabase/supabase-js
npm install @google/generative-ai
npm install express dotenv

# 3. Lancer bot
node bot/index.js

# 4. Lancer admin (optionnel)
node admin/server.js
```

## ⚡ Quick Start avec Supabase

1. **Créer projet sur supabase.com**
2. **Copier URL + Keys dans .env**
3. **Créer tables via SQL Editor:**
   - Coller les schémas ci-dessus
   - Enable RLS avec policies pour admin
4. **Tester connexion:**
```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const { data } = await supabase.from('vendors').select('*')
console.log(data) // Should return empty array
```

## 🚧 Ce qu'on NE fait PAS dans le MVP

- ❌ Système d'avis complexe (on met juste des notes fixes)
- ❌ Upload images par vendeurs (admin ajoute manuellement)
- ❌ Paiement mobile money (juste contact direct)
- ❌ Multi-langue (français uniquement)
- ❌ Notifications push vendeurs (v2)
- ❌ Chat avec vendeur via bot (redirect vers WhatsApp direct)

## 🎓 Ressources Utiles

- [Supabase Docs](https://supabase.com/docs)
- [whatsapp-web.js Guide](https://wwebjs.dev/)
- [Gemini API Docs](https://ai.google.dev/docs)

---

**Principe MVP:** Faire le minimum pour valider que les gens veulent utiliser le service. Complexité = plus tard.
