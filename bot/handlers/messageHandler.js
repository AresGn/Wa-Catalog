const supabase = require('../services/supabase');
const formatter = require('../services/formatter');
const gemini = require('../services/gemini');

class MessageHandler {
  constructor(client) {
    this.client = client;
    this.userSessions = new Map(); // Track user sessions for context
    this.rateLimiter = new Map(); // Simple rate limiting
  }

  async handleMessage(msg) {
    const startTime = Date.now();
    
    try {
      // Extract user info
      const userPhone = msg.from;
      const messageBody = msg.body;
      const messageType = msg.type;
      
      // Log message to database
      await supabase.saveMessage({
        id: msg.id._serialized,
        from: msg.from,
        to: msg.to,
        body: messageBody,
        type: messageType,
        timestamp: msg.timestamp,
        isFromBot: false
      });

      // Create or update user
      const contact = await msg.getContact();
      const userName = contact.pushname || contact.name || null;
      await supabase.createOrUpdateUser(userPhone, userName);

      // Check rate limiting
      if (this.isRateLimited(userPhone)) {
        await msg.reply(formatter.formatRateLimitMessage());
        return;
      }

      // Show typing indicator
      const chat = await msg.getChat();
      await chat.sendStateTyping();

      // Analyze intent with Gemini
      const intent = await gemini.analyzeIntent(messageBody);

      // Route based on intent
      let response;
      switch (intent.intent) {
        case 'greeting':
          response = await this.handleGreeting(msg, userName);
          break;
        
        case 'help':
          response = await this.handleHelp(msg);
          break;
        
        case 'search_product':
        case 'search_vendor':
        case 'search_location':
          response = await this.handleSearch(msg, intent);
          break;
        
        case 'order':
          response = await this.handleOrder(msg, intent);
          break;
        
        case 'complaint':
          response = await this.handleComplaint(msg);
          break;
        
        default:
          response = await this.handleDefault(msg);
      }

      // Send response if generated
      if (response) {
        await msg.reply(response);
        
        // Log bot response
        await supabase.saveMessage({
          id: `bot_${Date.now()}`,
          from: msg.to,
          to: msg.from,
          body: response,
          type: 'text',
          timestamp: Math.floor(Date.now() / 1000),
          isFromBot: true
        });
      }

      // Log analytics
      const responseTime = Date.now() - startTime;
      await supabase.logAnalytics({
        eventType: 'message_processed',
        userPhone: userPhone,
        eventData: {
          intent: intent.intent,
          messageType: messageType,
          responseTime: responseTime
        },
        responseTime: responseTime
      });

    } catch (error) {
      console.error('Error handling message:', error);
      await msg.reply(formatter.formatErrorMessage(error));
    }
  }

  async handleGreeting(msg, userName) {
    return formatter.formatWelcomeMessage(userName);
  }

  async handleHelp(msg) {
    return formatter.formatHelpMessage();
  }

  async handleSearch(msg, intent) {
    const userPhone = msg.from;
    const query = msg.body;
    
    // Extract search keywords with Gemini
    const keywords = await gemini.extractSearchKeywords(query);
    
    // Improve search query with Gemini
    const improvedQuery = await gemini.improveSearchQuery(query);
    
    // Search products and vendors
    const products = await supabase.searchProducts(improvedQuery);
    const vendors = await supabase.searchVendors(improvedQuery, keywords.location);
    
    // Log search
    await supabase.logSearch({
      userPhone: userPhone,
      query: query,
      intent: intent.intent,
      resultsCount: products.length + vendors.length,
      vendorsReturned: vendors.map(v => v.id),
      responseTime: null
    });

    // Format and return results
    if (products.length === 0 && vendors.length === 0) {
      // Try to provide smart suggestions with Gemini
      const smartReply = await gemini.generateSmartReply(
        { userMessage: query, searchType: 'product' },
        []
      );
      return smartReply || formatter.formatNoResults(query);
    }
    
    return formatter.formatSearchResults(products, vendors, query);
  }

  async handleOrder(msg, intent) {
    // Extract product/vendor info from message
    const entities = intent.entities || {};
    
    if (!entities.product && !entities.vendor) {
      return "🛒 Pour commander, veuillez préciser:\n" +
             "• Le nom du produit\n" +
             "• Ou le nom du vendeur\n\n" +
             "Exemple: 'Je veux commander iPhone 13 chez TechShop'";
    }
    
    // Search for the product/vendor
    const products = entities.product ? 
      await supabase.searchProducts(entities.product) : [];
    const vendors = entities.vendor ? 
      await supabase.searchVendors(entities.vendor) : [];
    
    if (products.length > 0) {
      const product = products[0];
      const vendor = product.vendor;
      
      if (vendor) {
        // Log vendor click
        await supabase.logVendorClick({
          userPhone: msg.from,
          vendorId: vendor.id,
          searchQuery: msg.body
        });
        
        return formatter.formatOrderConfirmation(vendor, product, msg.from);
      }
    }
    
    return "😔 Je n'ai pas trouvé ce produit ou vendeur.\n" +
           "Essayez une recherche pour voir les options disponibles.";
  }

  async handleComplaint(msg) {
    return "📝 Votre message a été enregistré.\n\n" +
           "Notre équipe support vous contactera dans les 24h.\n" +
           "Vous pouvez aussi nous écrire à: support@wa-catalog.com\n\n" +
           "Merci de votre patience! 🙏";
  }

  async handleDefault(msg) {
    // Try to understand the message with Gemini
    const keywords = await gemini.extractSearchKeywords(msg.body);
    
    if (keywords.keywords.length > 0) {
      // Treat as search
      return await this.handleSearch(msg, { intent: 'search_product', entities: {} });
    }
    
    // Default response
    return "Je n'ai pas compris votre demande. 🤔\n\n" +
           "Essayez:\n" +
           "• Rechercher un produit: 'iPhone 13'\n" +
           "• Demander de l'aide: 'aide'\n" +
           "• Voir les catégories: 'catégories'";
  }

  async handleCommand(msg) {
    const command = msg.body.toLowerCase().trim();
    
    switch (command) {
      case 'vendeurs':
      case 'vendors':
        const vendors = await supabase.searchVendors('', null);
        return formatter.formatVendorsList(vendors.slice(0, 10));
      
      case 'catégories':
      case 'categories':
        const categories = [
          'Électronique', 'Mode', 'Alimentation', 'Beauté',
          'Maison', 'Auto/Moto', 'Services', 'Santé',
          'Sport', 'Éducation'
        ];
        return formatter.formatCategoriesList(categories);
      
      case 'nouveau':
      case 'new':
        const newProducts = await supabase.searchProducts('');
        return formatter.formatSearchResults(newProducts.slice(0, 5), [], 'Nouveaux produits');
      
      case 'stats':
        if (this.isAdmin(msg.from)) {
          const stats = await supabase.getBotStats();
          return `📊 *Statistiques du Bot*\n\n` +
                 `👥 Utilisateurs: ${stats.totalUsers}\n` +
                 `🔍 Recherches: ${stats.totalSearches}\n` +
                 `🖱️ Clics: ${stats.totalClicks}\n` +
                 `📅 Actifs aujourd'hui: ${stats.activeToday}`;
        }
        break;
    }
    
    return null;
  }

  isRateLimited(userPhone) {
    const now = Date.now();
    const userLimits = this.rateLimiter.get(userPhone) || [];
    
    // Remove old entries (older than 1 minute)
    const recentRequests = userLimits.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 10) {
      return true;
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(userPhone, recentRequests);
    
    return false;
  }

  isAdmin(phoneNumber) {
    const adminNumbers = [
      '22962703515@c.us',
      '22960813863@c.us',
      '22999323073@c.us'
    ];
    return adminNumbers.includes(phoneNumber);
  }

  async handleMedia(msg) {
    if (!msg.hasMedia) return null;
    
    const media = await msg.downloadMedia();
    
    // Log media message
    await supabase.saveMessage({
      id: msg.id._serialized,
      from: msg.from,
      to: msg.to,
      body: msg.body || '[Media]',
      type: msg.type,
      mediaUrl: media.data ? `data:${media.mimetype};base64,${media.data.substring(0, 100)}...` : null,
      timestamp: msg.timestamp,
      isFromBot: false
    });

    // Analyze media with Gemini if it's an image
    if (media.mimetype.startsWith('image/')) {
      return "📸 J'ai reçu votre image.\n\n" +
             "Je ne peux pas encore analyser les images, mais vous pouvez:\n" +
             "• Décrire ce que vous cherchez\n" +
             "• Envoyer le nom du produit";
    }
    
    return "📎 Fichier reçu. Veuillez envoyer une description de ce que vous recherchez.";
  }
}

module.exports = MessageHandler;
