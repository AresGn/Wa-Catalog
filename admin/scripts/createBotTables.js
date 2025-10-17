require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('🔄 Creating bot analytics tables...\n');

    // Créer la table search_logs
    console.log('📝 Creating search_logs table...');
    const { data: searchLogsData, error: searchLogsError } = await supabase
      .from('search_logs')
      .select('*')
      .limit(1);

    if (searchLogsError?.message?.includes('relation') || searchLogsError?.code === 'PGRST116') {
      console.log('Table search_logs does not exist. Please create it manually in Supabase with:');
      console.log(`
CREATE TABLE search_logs (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  user_phone TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  response_time INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT search_logs_user_phone_fkey FOREIGN KEY (user_phone) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_user_phone ON search_logs(user_phone);
CREATE INDEX idx_search_logs_query ON search_logs(query);
      `);
    } else {
      console.log('✅ search_logs table exists or is accessible');
    }

    // Créer la table vendor_clicks
    console.log('\n📝 Creating vendor_clicks table...');
    const { data: clicksData, error: clicksError } = await supabase
      .from('vendor_clicks')
      .select('*')
      .limit(1);

    if (clicksError?.message?.includes('relation') || clicksError?.code === 'PGRST116') {
      console.log('Table vendor_clicks does not exist. Please create it manually in Supabase with:');
      console.log(`
CREATE TABLE vendor_clicks (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  user_phone TEXT NOT NULL,
  vendor_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT vendor_clicks_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX idx_vendor_clicks_created_at ON vendor_clicks(created_at DESC);
CREATE INDEX idx_vendor_clicks_vendor_id ON vendor_clicks(vendor_id);
CREATE INDEX idx_vendor_clicks_user_phone ON vendor_clicks(user_phone);
      `);
    } else {
      console.log('✅ vendor_clicks table exists or is accessible');
    }

    console.log('\n✨ Bot tables setup complete!');
    console.log('\n💡 For development, you can add sample data with:');
    console.log(`
INSERT INTO search_logs (user_phone, query, results_count, response_time) VALUES
('2249997000000', 'iPhone', 5, 1200),
('2249997000001', 'Samsung', 3, 900),
('2249997000002', 'Laptop', 2, 1500);
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTables();
