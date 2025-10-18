require('dotenv').config();
const readline = require('readline');
const { Client } = require('pg');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function initBotTables() {
  console.log('🤖 WhatsApp Bot Tables Initialization\n');

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not found in .env');
    }

    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    console.log(`📍 Project: ${projectRef}\n`);

    const dbPassword = await prompt('🔐 Enter your Supabase database password: ');

    if (!dbPassword) {
      throw new Error('Password cannot be empty');
    }

    const dns = require('dns');
    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first');
    }

    const host = `db.${projectRef}.supabase.co`;
    console.log('\n📦 Connecting to database...');

    const client = new Client({
      host: host,
      port: 5432,
      user: 'postgres',
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✓ Connected successfully\n');

    // SQL statements for bot tables
    const statements = [
      // Bot sessions table (for WhatsApp authentication)
      `CREATE TABLE IF NOT EXISTS bot_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_name TEXT NOT NULL UNIQUE,
        session_data JSONB,
        authenticated BOOLEAN DEFAULT false,
        phone_number TEXT,
        last_active TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Bot messages table (for tracking all messages)
      `CREATE TABLE IF NOT EXISTS bot_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id TEXT NOT NULL UNIQUE,
        from_phone TEXT NOT NULL,
        to_phone TEXT NOT NULL,
        message_body TEXT,
        message_type TEXT DEFAULT 'text',
        media_url TEXT,
        timestamp BIGINT,
        is_from_bot BOOLEAN DEFAULT false,
        session_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (session_id) REFERENCES bot_sessions(id) ON DELETE SET NULL
      )`,

      // Bot users table (for tracking unique users)
      `CREATE TABLE IF NOT EXISTS bot_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number TEXT NOT NULL UNIQUE,
        name TEXT,
        first_message_at TIMESTAMP,
        last_message_at TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        total_searches INTEGER DEFAULT 0,
        total_clicks INTEGER DEFAULT 0,
        is_blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Bot analytics table (for detailed analytics)
      `CREATE TABLE IF NOT EXISTS bot_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL, -- 'search', 'click', 'help', 'error', etc.
        user_phone TEXT,
        event_data JSONB,
        response_time_ms INTEGER,
        session_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (session_id) REFERENCES bot_sessions(id) ON DELETE SET NULL
      )`,

      // Vendor clicks table (tracking when users click vendor links)
      `CREATE TABLE IF NOT EXISTS vendor_clicks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_phone TEXT NOT NULL,
        vendor_id UUID NOT NULL,
        search_query TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
      )`,

      // Bot configuration table
      `CREATE TABLE IF NOT EXISTS bot_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL UNIQUE,
        value JSONB,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_bot_messages_from ON bot_messages(from_phone)`,
      `CREATE INDEX IF NOT EXISTS idx_bot_messages_to ON bot_messages(to_phone)`,
      `CREATE INDEX IF NOT EXISTS idx_bot_messages_timestamp ON bot_messages(timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_bot_users_phone ON bot_users(phone_number)`,
      `CREATE INDEX IF NOT EXISTS idx_bot_analytics_event ON bot_analytics(event_type)`,
      `CREATE INDEX IF NOT EXISTS idx_bot_analytics_user ON bot_analytics(user_phone)`,
      `CREATE INDEX IF NOT EXISTS idx_vendor_clicks_user ON vendor_clicks(user_phone)`,
      `CREATE INDEX IF NOT EXISTS idx_vendor_clicks_vendor ON vendor_clicks(vendor_id)`
    ];

    // Execute statements
    for (const statement of statements) {
      try {
        await client.query(statement);
        const tableName = statement.match(/TABLE.*?(\w+)/)?.[1] || statement.split(' ')[5];
        console.log(`✓ ${tableName}`);
      } catch (err) {
        if (err.code === '42P07') {
          const tableName = statement.match(/TABLE.*?(\w+)/)?.[1] || 'item';
          console.log(`→ ${tableName} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    // Insert default bot configuration
    const defaultConfig = [
      {
        key: 'welcome_message',
        value: { text: '👋 Bonjour! Je suis Wa-Catalog, votre assistant pour trouver des produits. Que recherchez-vous aujourd\'hui?' },
        description: 'Message de bienvenue du bot'
      },
      {
        key: 'help_message',
        value: { text: '🆘 *Aide Wa-Catalog*\n\nEnvoyez-moi ce que vous cherchez:\n• "baskets Nike"\n• "téléphones Samsung"\n• "vendeurs à Cotonou"\n\nJe vous connecterai avec les meilleurs vendeurs!' },
        description: 'Message d\'aide du bot'
      },
      {
        key: 'no_results_message',
        value: { text: '😔 Désolé, je n\'ai trouvé aucun résultat pour votre recherche. Essayez avec d\'autres mots-clés!' },
        description: 'Message quand aucun résultat trouvé'
      },
      {
        key: 'error_message',
        value: { text: '❌ Une erreur s\'est produite. Veuillez réessayer plus tard.' },
        description: 'Message d\'erreur générique'
      },
      {
        key: 'rate_limit',
        value: { max_searches_per_minute: 10, max_messages_per_minute: 20 },
        description: 'Limites de taux pour éviter le spam'
      }
    ];

    for (const config of defaultConfig) {
      try {
        await client.query(
          `INSERT INTO bot_config (key, value, description) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (key) DO UPDATE 
           SET value = $2, description = $3, updated_at = NOW()`,
          [config.key, JSON.stringify(config.value), config.description]
        );
      } catch (err) {
        console.log(`→ Config ${config.key} insertion error:`, err.message);
      }
    }

    console.log('\n✅ Bot tables initialized successfully!\n');
    console.log('Next steps:');
    console.log('1. Update bot/services/supabase.js with database connection');
    console.log('2. Integrate bot with database for session management');
    console.log('3. Start logging messages and analytics\n');

    await client.end();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Make sure:');
      console.error('   - Your Supabase project is active');
      console.error('   - Internet connection is working');
      console.error('   - SUPABASE_URL is correct in .env');
    } else if (error.code === '28P01' || (error.message && error.message.includes('password'))) {
      console.error('\n💡 Password error. Check:');
      console.error('   - You entered the correct password');
      console.error('   - Password doesn\'t have special characters needing escape');
    }

    process.exit(1);

  } finally {
    rl.close();
  }
}

// Run
initBotTables();
