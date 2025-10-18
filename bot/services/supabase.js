require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class SupabaseService {
  // User Management
  async createOrUpdateUser(phoneNumber, name = null) {
    try {
      const { data, error } = await supabase
        .from('bot_users')
        .upsert({
          phone_number: phoneNumber,
          name: name,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return null;
    }
  }

  async getUserByPhone(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('bot_users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async incrementUserStats(phoneNumber, field) {
    try {
      const user = await this.getUserByPhone(phoneNumber);
      if (!user) return null;

      const updates = {
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      };
      updates[field] = (user[field] || 0) + 1;

      const { data, error } = await supabase
        .from('bot_users')
        .update(updates)
        .eq('phone_number', phoneNumber)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return null;
    }
  }

  // Message Management
  async saveMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('bot_messages')
        .insert({
          message_id: messageData.id,
          from_phone: messageData.from,
          to_phone: messageData.to,
          message_body: messageData.body,
          message_type: messageData.type || 'text',
          media_url: messageData.mediaUrl || null,
          timestamp: messageData.timestamp,
          is_from_bot: messageData.isFromBot || false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }

  // Search Logging
  async logSearch(searchData) {
    try {
      const { data, error } = await supabase
        .from('search_logs')
        .insert({
          user_phone: searchData.userPhone,
          query: searchData.query,
          intent: searchData.intent || null,
          results_count: searchData.resultsCount || 0,
          vendors_returned: searchData.vendorsReturned || [],
          response_time: searchData.responseTime || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Also log in bot_analytics
      await this.logAnalytics({
        eventType: 'search',
        userPhone: searchData.userPhone,
        eventData: {
          query: searchData.query,
          results_count: searchData.resultsCount
        },
        responseTime: searchData.responseTime
      });

      // Increment user search count
      await this.incrementUserStats(searchData.userPhone, 'total_searches');

      return data;
    } catch (error) {
      console.error('Error logging search:', error);
      return null;
    }
  }

  // Analytics
  async logAnalytics(analyticsData) {
    try {
      const { data, error } = await supabase
        .from('bot_analytics')
        .insert({
          event_type: analyticsData.eventType,
          user_phone: analyticsData.userPhone,
          event_data: analyticsData.eventData || {},
          response_time_ms: analyticsData.responseTime || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging analytics:', error);
      return null;
    }
  }

  // Vendor Click Logging
  async logVendorClick(clickData) {
    try {
      const { data, error } = await supabase
        .from('vendor_clicks')
        .insert({
          user_phone: clickData.userPhone,
          vendor_id: clickData.vendorId,
          search_query: clickData.searchQuery || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Also log in analytics
      await this.logAnalytics({
        eventType: 'vendor_click',
        userPhone: clickData.userPhone,
        eventData: {
          vendor_id: clickData.vendorId,
          search_query: clickData.searchQuery
        }
      });

      // Increment user click count
      await this.incrementUserStats(clickData.userPhone, 'total_clicks');

      return data;
    } catch (error) {
      console.error('Error logging vendor click:', error);
      return null;
    }
  }

  // Product & Vendor Search
  async searchProducts(query) {
    try {
      const searchTerms = query.toLowerCase().split(' ');
      
      // Search in products
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('availability', 'in_stock')
        .limit(10);

      if (error) throw error;

      // Filter products based on search terms
      const filteredProducts = products.filter(product => {
        const searchableText = `${product.name} ${product.description} ${product.category} ${product.keywords?.join(' ')}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      });

      return filteredProducts;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  async searchVendors(query, city = null) {
    try {
      let vendorQuery = supabase
        .from('vendors')
        .select('*')
        .eq('status', 'active')
        .eq('verified', true);

      if (city) {
        vendorQuery = vendorQuery.ilike('city', `%${city}%`);
      }

      const { data: vendors, error } = await vendorQuery.limit(10);

      if (error) throw error;

      // Filter vendors based on search terms
      const searchTerms = query.toLowerCase().split(' ');
      const filteredVendors = vendors.filter(vendor => {
        const searchableText = `${vendor.name} ${vendor.category?.join(' ')} ${vendor.city}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
      });

      return filteredVendors;
    } catch (error) {
      console.error('Error searching vendors:', error);
      return [];
    }
  }

  // Bot Configuration
  async getConfig(key) {
    try {
      const { data, error } = await supabase
        .from('bot_config')
        .select('value')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.value || null;
    } catch (error) {
      console.error('Error fetching config:', error);
      return null;
    }
  }

  async setConfig(key, value, description = null) {
    try {
      const { data, error } = await supabase
        .from('bot_config')
        .upsert({
          key: key,
          value: value,
          description: description,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting config:', error);
      return null;
    }
  }

  // Session Management
  async saveSession(sessionName, sessionData) {
    try {
      const { data, error } = await supabase
        .from('bot_sessions')
        .upsert({
          session_name: sessionName,
          session_data: sessionData,
          authenticated: true,
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  }

  async getSession(sessionName) {
    try {
      const { data, error } = await supabase
        .from('bot_sessions')
        .select('*')
        .eq('session_name', sessionName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  }

  // Stats for Dashboard
  async getBotStats() {
    try {
      // Get user stats
      const { data: userCount } = await supabase
        .from('bot_users')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's active users
      const { data: activeToday } = await supabase
        .from('bot_users')
        .select('*', { count: 'exact', head: true })
        .gte('last_message_at', today.toISOString());

      // Get search stats
      const { data: searchCount } = await supabase
        .from('search_logs')
        .select('*', { count: 'exact', head: true });

      const { data: searchesToday } = await supabase
        .from('search_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get click stats
      const { data: clickCount } = await supabase
        .from('vendor_clicks')
        .select('*', { count: 'exact', head: true });

      return {
        totalUsers: userCount?.count || 0,
        activeToday: activeToday?.count || 0,
        totalSearches: searchCount?.count || 0,
        searchesToday: searchesToday?.count || 0,
        totalClicks: clickCount?.count || 0
      };
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      return null;
    }
  }
}

module.exports = new SupabaseService();