# 🚀 Commandes d'Initialisation Wa-Catalog MVP

## 📦 Étape 1 : Créer le projet

```bash
# Créer le dossier principal
mkdir wa-catalog-bot
cd wa-catalog-bot

# Initialiser npm
npm init -y
```

## 📥 Étape 2 : Installer les dépendances

### Dépendances principales
```bash
# Bot WhatsApp
npm install whatsapp-web.js qrcode-terminal

# Base de données Supabase
npm install @supabase/supabase-js

# IA - Google Gemini
npm install @google/genai

# Backend & Utilitaires
npm install express dotenv cors

# Dev dependencies (optionnel)
npm install --save-dev nodemon
```

## 📁 Étape 3 : Créer la structure des dossiers et fichiers

```bash
# Créer tous les dossiers
mkdir -p bot/handlers
mkdir -p bot/services
mkdir -p admin/routes
mkdir -p admin/views
mkdir -p admin/public

# Créer les fichiers du bot
touch bot/index.js
touch bot/handlers/message.js
touch bot/handlers/search.js
touch bot/services/gemini.js
touch bot/services/supabase.js
touch bot/services/formatter.js

# Créer les fichiers admin
touch admin/server.js
touch admin/routes/vendors.js
touch admin/routes/products.js
touch admin/views/index.html
touch admin/views/dashboard.html

# Créer les fichiers de configuration
touch .env
touch .gitignore
touch README.md
```

## 📝 Étape 4 : Créer le fichier .gitignore

```bash
# Ajouter au .gitignore
cat > .gitignore << EOL
node_modules/
.env
.wwebjs_auth/
.wwebjs_cache/
*.log
.DS_Store
EOL
```

## ⚙️ Étape 5 : Configurer le package.json (scripts)

```bash
# Ouvrir package.json et ajouter les scripts
```

Scripts à ajouter manuellement dans `package.json` :
```json
"scripts": {
  "start": "node bot/index.js",
  "dev": "nodemon bot/index.js",
  "admin": "node admin/server.js",
  "admin:dev": "nodemon admin/server.js"
}
```

## 🔑 Étape 6 : Créer le fichier .env

```bash
touch .env
```

Contenu à ajouter manuellement dans `.env` :
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Admin Server
ADMIN_PORT=3000
NODE_ENV=development
```

## 📊 Structure finale du projet

Après toutes les commandes, tu auras :

```
wa-catalog-bot/
├── node_modules/           (créé automatiquement)
├── bot/
│   ├── index.js
│   ├── handlers/
│   │   ├── message.js
│   │   └── search.js
│   └── services/
│       ├── gemini.js
│       ├── supabase.js
│       └── formatter.js
├── admin/
│   ├── server.js
│   ├── routes/
│   │   ├── vendors.js
│   │   └── products.js
│   ├── views/
│   │   ├── index.html
│   │   └── dashboard.html
│   └── public/
├── .env
├── .gitignore
├── package.json
├── package-lock.json       (créé automatiquement)
└── README.md
```

## ✅ Vérification

```bash
# Vérifier que tout est bien installé
npm list --depth=0

# Vérifier la structure
tree -L 3 -I node_modules
# ou si tree n'est pas installé:
ls -R
```

## 🎯 Prochaines étapes

1. **Configurer Supabase** : Créer un compte et récupérer les clés
2. **Configurer Gemini API** : Obtenir la clé API Google
3. **Remplir le .env** avec tes vraies clés
4. Commencer à coder les fichiers selon la doc technique

---

**Note importante** : N'oublie pas de **JAMAIS** commiter le fichier `.env` sur Git ! Les clés API doivent rester secrètes.
