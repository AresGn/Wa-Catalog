const supabase = require('../config/supabase');

class BotService {
  // Récupère les stats globales du bot
  async getStats() {
    try {
      // Données de placeholder pour maintenant
      // À remplacer quand le bot envoie les données réelles
      const stats = {
        totalUsers: 0,
        activeToday: 0,
        totalSearches: 0,
        searchesToday: 0,
        totalClicks: 0,
        avgResponseTime: 0,
        conversionRate: 0,
        topSearches: {},
        topVendors: [],
        dailyActivity: this.generateDummyDailyActivity(),
        avgResponseTime: 1250,
        maxResponseTime: 4500,
        successRate: 96.5,
        errorRate: 3.5,
        avgSearchesPerUser: 2.4,
        avgClicksPerUser: 1.8,
        returnRate: 42.5,
        avgSessionDuration: 185,
        productSearches: 0,
        vendorSearches: 0,
        helpRequests: 0,
        otherQueries: 0,
        recentSearches: []
      };

      // Essayer de récupérer les vraies données si elles existent
      try {
        // Récupérer les statistiques depuis la table search_logs si elle existe
        const { data: searchLogs, error: logError } = await supabase
          .from('search_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!logError && searchLogs && searchLogs.length > 0) {
          stats.totalSearches = searchLogs.length;
          stats.recentSearches = searchLogs.slice(0, 15).map(log => ({
            query: log.query || 'Unknown query',
            userPhone: this.maskPhone(log.user_phone || 'Unknown'),
            timestamp: log.created_at,
            results: log.results_count || 0
          }));

          // Calculer les top searches
          const searches = {};
          searchLogs.forEach(log => {
            const query = log.query?.toLowerCase() || 'unknown';
            searches[query] = (searches[query] || 0) + 1;
          });
          stats.topSearches = searches;

          // Calculer les stats d'aujourd'hui
          const today = new Date().toDateString();
          stats.searchesToday = searchLogs.filter(
            log => new Date(log.created_at).toDateString() === today
          ).length;
        }
      } catch (e) {
        console.log('Search logs table not found, using placeholder data');
      }

      // Récupérer les données des top vendeurs
      try {
        const { data: vendors, error: vendorError } = await supabase
          .from('vendors')
          .select('id, name, city')
          .order('created_at', { ascending: false })
          .limit(8);

        if (!vendorError && vendors) {
          stats.topVendors = vendors.map((vendor, idx) => ({
            name: vendor.name,
            city: vendor.city,
            views: Math.floor(Math.random() * 200) + 50,
            clicks: Math.floor(Math.random() * 100) + 10
          }));
        }
      } catch (e) {
        console.log('Vendors data fetch failed');
      }

      return stats;
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      return this.getDefaultStats();
    }
  }

  // Génère des données fictives d'activité journalière (7 derniers jours)
  generateDummyDailyActivity() {
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      activity.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        searches: Math.floor(Math.random() * 150) + 50,
        clicks: Math.floor(Math.random() * 80) + 20,
        users: Math.floor(Math.random() * 100) + 30
      });
    }
    return activity;
  }

  // Masquer les numéros de téléphone pour la confidentialité
  maskPhone(phone) {
    if (!phone || phone.length < 7) return 'Hidden';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
  }

  // Stats par défaut
  getDefaultStats() {
    return {
      totalUsers: 0,
      activeToday: 0,
      totalSearches: 0,
      searchesToday: 0,
      totalClicks: 0,
      avgResponseTime: 0,
      conversionRate: 0,
      topSearches: {},
      topVendors: [],
      dailyActivity: this.generateDummyDailyActivity(),
      avgResponseTime: 0,
      maxResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      avgSearchesPerUser: 0,
      avgClicksPerUser: 0,
      returnRate: 0,
      avgSessionDuration: 0,
      productSearches: 0,
      vendorSearches: 0,
      helpRequests: 0,
      otherQueries: 0,
      recentSearches: []
    };
  }

  // Log une recherche (appelé par le bot)
  async logSearch(data) {
    try {
      const { user_phone, query, results_count, response_time } = data;

      const { data: logData, error } = await supabase
        .from('search_logs')
        .insert([{
          user_phone,
          query,
          results_count: results_count || 0,
          response_time: response_time || 0,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return logData;
    } catch (error) {
      console.error('Error logging search:', error);
      return null;
    }
  }

  // Log un clic sur un vendeur
  async logVendorClick(data) {
    try {
      const { user_phone, vendor_id } = data;

      const { data: clickData, error } = await supabase
        .from('vendor_clicks')
        .insert([{
          user_phone,
          vendor_id,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return clickData;
    } catch (error) {
      console.error('Error logging vendor click:', error);
      return null;
    }
  }

  // Récupère les stats détaillées pour une période donnée
  async getStatsByPeriod(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: searchLogs, error } = await supabase
        .from('search_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        period: `Last ${days} days`,
        totalSearches: searchLogs?.length || 0,
        avgResponseTime: this.calculateAvgResponseTime(searchLogs || []),
        uniqueUsers: new Set(searchLogs?.map(log => log.user_phone) || []).size
      };
    } catch (error) {
      console.error('Error fetching period stats:', error);
      return null;
    }
  }

  // Calcule le temps de réponse moyen
  calculateAvgResponseTime(logs) {
    if (!logs || logs.length === 0) return 0;
    const total = logs.reduce((acc, log) => acc + (log.response_time || 0), 0);
    return Math.round(total / logs.length);
  }
}

module.exports = new BotService();
