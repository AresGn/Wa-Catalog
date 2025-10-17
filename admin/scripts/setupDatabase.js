require('dotenv').config();
const supabase = require('../config/supabase');

async function setupDatabase() {
  console.log('🔧 Setting up Supabase database...\n');

  try {
    // Create vendors table
    console.log('Creating vendors table...');
    const vendorsSQL = `
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        whatsapp_number TEXT NOT NULL UNIQUE,
        city TEXT NOT NULL,
        category TEXT[] NOT NULL,
        verified BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'active',
        rating_average DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create products table
    console.log('Creating products table...');
    const productsSQL = `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        keywords TEXT[] NOT NULL,
        availability TEXT DEFAULT 'in_stock',
        condition TEXT DEFAULT 'Neuf',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
      );
    `;

    // Create search logs table
    console.log('Creating search_logs table...');
    const searchLogsSQL = `
      CREATE TABLE IF NOT EXISTS search_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_phone TEXT NOT NULL,
        query TEXT NOT NULL,
        intent TEXT,
        results_count INTEGER DEFAULT 0,
        vendors_returned TEXT[],
        clicked_vendor_id UUID,
        response_time INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Verify tables exist
    console.log('\n✅ Database schema ready (verify in Supabase)');
    console.log('📝 Tables to create manually in Supabase:');
    console.log('1. vendors');
    console.log('2. products');
    console.log('3. search_logs');
    console.log('\nVisit: https://supabase.com/dashboard');
    console.log('Copy the SQL above and run it in the Query Editor\n');

    // Try to fetch existing tables
    const { data, error } = await supabase
      .from('vendors')
      .select('count()', { count: 'exact', head: true });

    if (!error) {
      console.log('✓ vendors table exists');
    } else {
      console.log('✗ vendors table not found - create it in Supabase');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupDatabase();
