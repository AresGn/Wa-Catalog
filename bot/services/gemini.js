require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  // Analyze user intent from message
  async analyzeIntent(message) {
    try {
      const prompt = `
        Analyse le message suivant d'un utilisateur WhatsApp et détermine son intention.
        Message: "${message}"
        
        Intentions possibles:
        - search_product: L'utilisateur cherche un produit spécifique
        - search_vendor: L'utilisateur cherche un vendeur ou magasin
        - search_location: L'utilisateur cherche dans une ville spécifique
        - help: L'utilisateur demande de l'aide ou des informations
        - greeting: L'utilisateur salue ou dit bonjour
        - order: L'utilisateur veut commander ou acheter
        - complaint: L'utilisateur se plaint ou signale un problème
        - other: Autre intention
        
        Réponds uniquement avec l'intention (ex: search_product) et les entités extraites au format JSON.
        Exemple de réponse:
        {
          "intent": "search_product",
          "entities": {
            "product": "iPhone 13",
            "category": "Électronique"
          }
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean markdown code blocks if present
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Parse JSON response
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.error('Raw response:', text);
        return { intent: 'other', entities: {} };
      }
    } catch (error) {
      console.error('Error analyzing intent with Gemini:', error);
      return { intent: 'other', entities: {} };
    }
  }

  // Extract search keywords from message
  async extractSearchKeywords(message) {
    try {
      const prompt = `
        Extrait les mots-clés de recherche pertinents du message suivant.
        Message: "${message}"
        
        Instructions:
        - Identifie les produits, marques, catégories mentionnés
        - Identifie les villes ou lieux mentionnés
        - Identifie les caractéristiques (couleur, taille, etc.)
        - Ignore les mots de liaison et articles
        
        Réponds uniquement avec un objet JSON contenant:
        - keywords: tableau de mots-clés principaux
        - category: catégorie de produit (si identifiable)
        - location: ville ou lieu (si mentionné)
        - attributes: objet avec les attributs (couleur, taille, etc.)
        
        Exemple:
        {
          "keywords": ["iPhone", "13", "Pro"],
          "category": "Électronique",
          "location": "Cotonou",
          "attributes": {
            "color": "bleu",
            "storage": "256GB"
          }
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean markdown code blocks if present
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (parseError) {
        console.error('Error parsing keywords response:', parseError);
        return { keywords: message.split(' '), category: null, location: null, attributes: {} };
      }
    } catch (error) {
      console.error('Error extracting keywords with Gemini:', error);
      return { keywords: message.split(' '), category: null, location: null, attributes: {} };
    }
  }

  // Generate smart reply suggestions
  async generateSmartReply(context, searchResults) {
    try {
      const prompt = `
        Génère une réponse intelligente et personnalisée pour un utilisateur WhatsApp.
        
        Contexte:
        - Message de l'utilisateur: "${context.userMessage}"
        - Nombre de résultats trouvés: ${searchResults.length}
        - Type de recherche: ${context.searchType || 'product'}
        
        Instructions:
        - Sois conversationnel et amical
        - Si des résultats sont trouvés, mets en avant les meilleurs
        - Si aucun résultat, suggère des alternatives
        - Ajoute des emojis appropriés
        - Maximum 200 mots
        - Termine par une question ou call-to-action
        
        Réponds directement avec le message à envoyer (pas de JSON).
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating smart reply:', error);
      return null;
    }
  }

  // Improve search query
  async improveSearchQuery(originalQuery) {
    try {
      const prompt = `
        Améliore cette requête de recherche pour obtenir de meilleurs résultats.
        Requête originale: "${originalQuery}"
        
        Instructions:
        - Corrige les fautes d'orthographe
        - Ajoute des synonymes pertinents
        - Normalise les termes (ex: "tel" -> "téléphone")
        - Garde les termes spécifiques importants
        
        Réponds uniquement avec la requête améliorée (texte simple, pas de JSON).
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error improving search query:', error);
      return originalQuery;
    }
  }

  // Categorize product from description
  async categorizeProduct(productName, description) {
    try {
      const prompt = `
        Catégorise ce produit dans une des catégories suivantes:
        - Électronique
        - Mode
        - Alimentation
        - Beauté
        - Maison
        - Auto/Moto
        - Services
        - Santé
        - Sport
        - Éducation
        - Autre
        
        Produit: ${productName}
        Description: ${description || 'Non disponible'}
        
        Réponds uniquement avec le nom de la catégorie.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error categorizing product:', error);
      return 'Autre';
    }
  }

  // Generate product description
  async generateProductDescription(productName, category) {
    try {
      const prompt = `
        Génère une courte description de produit pour WhatsApp.
        Produit: ${productName}
        Catégorie: ${category}
        
        Instructions:
        - Maximum 50 mots
        - Mets en avant les points forts
        - Utilise un ton vendeur mais authentique
        - Ajoute 1-2 emojis appropriés
        
        Réponds uniquement avec la description.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating product description:', error);
      return null;
    }
  }

  // Detect language
  async detectLanguage(text) {
    try {
      const prompt = `
        Détecte la langue du texte suivant et réponds uniquement avec le code de langue (fr, en, yo, fon, etc.).
        Texte: "${text}"
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim().toLowerCase();
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'fr'; // Default to French
    }
  }

  // Translate message
  async translateMessage(text, targetLang = 'fr') {
    try {
      const prompt = `
        Traduis le texte suivant en ${targetLang === 'fr' ? 'français' : targetLang}.
        Texte: "${text}"
        
        Réponds uniquement avec la traduction.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error translating message:', error);
      return text;
    }
  }

  // Generate conversation summary
  async generateConversationSummary(messages) {
    try {
      const messagesText = messages.map(m => `${m.from}: ${m.body}`).join('\n');
      
      const prompt = `
        Résume cette conversation WhatsApp en 2-3 phrases.
        
        Conversation:
        ${messagesText}
        
        Instructions:
        - Identifie le sujet principal
        - Note les actions importantes
        - Mentionne le résultat final si applicable
        
        Réponds uniquement avec le résumé.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return null;
    }
  }

  // Check for inappropriate content
  async moderateContent(text) {
    try {
      const prompt = `
        Vérifie si ce message contient du contenu inapproprié.
        Message: "${text}"
        
        Contenu inapproprié inclut:
        - Insultes ou langage offensant
        - Contenu adulte ou sexuel
        - Spam ou publicité excessive
        - Informations personnelles sensibles
        - Contenu illégal
        
        Réponds avec un JSON:
        {
          "safe": true/false,
          "reason": "raison si unsafe"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean markdown code blocks if present
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      const parsed = JSON.parse(text);
      return parsed;
    } catch (error) {
      console.error('Error moderating content:', error);
      return { safe: true, reason: null };
    }
  }
}

module.exports = new GeminiService();