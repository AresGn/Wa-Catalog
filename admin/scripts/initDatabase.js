require('dotenv').config();
const readline = require('readline');

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

async function initDatabase() {
  console.log('🔧 wa-catalog Database Initialization\n');

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not found in .env');
    }

    // Extract project reference from URL
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    console.log(`📍 Project: ${projectRef}\n`);

    // Ask for password (only kept in memory during this session)
    const dbPassword = await prompt('🔐 Enter your Supabase database password: ');

    if (!dbPassword) {
      throw new Error('Password cannot be empty');
    }

    // Prepare connection options, prefer IPv4 to avoid ENETUNREACH on IPv6-only DNS
    const dns = require('dns');
    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first');
    }
    // Use public DNS resolvers to bypass local DNS issues
    try {
      if (typeof dns.setServers === 'function') {
        dns.setServers(['1.1.1.1', '8.8.8.8', '9.9.9.9', '8.8.4.4']);
      }
    } catch (_) {}
    const dnsPromises = dns.promises;

    const host = `db.${projectRef}.supabase.co`;

    // Resolve IPv4 address (fallback to hostname if lookup fails)
    let resolvedHost = host;
    try {
      const { address } = await dnsPromises.lookup(host, { family: 4 });
      resolvedHost = address;
    } catch (_) {
      // ignore and use hostname
    }

    console.log('\n📦 Connecting to database...');

    // Connect to database over SSL (required by Supabase)
    const { Client } = require('pg');
    const client = new Client({
      host: resolvedHost,
      port: 5432,
      user: 'postgres',
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✓ Connected successfully\n');

    // SQL statements
    const statements = [
      // Vendors table
      `CREATE TABLE IF NOT EXISTS vendors (
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
      )`,

      // Products table
      `CREATE TABLE IF NOT EXISTS products (
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
      )`,

      // Search logs table
      `CREATE TABLE IF NOT EXISTS search_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_phone TEXT NOT NULL,
        query TEXT NOT NULL,
        intent TEXT,
        results_count INTEGER DEFAULT 0,
        vendors_returned TEXT[],
        clicked_vendor_id UUID,
        response_time INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city)`,
      `CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status)`,
      `CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
      `CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_phone)`
    ];

    // Execute statements
    for (const statement of statements) {
      try {
        await client.query(statement);
        const tableName = statement.match(/TABLE.*?(\w+)/)?.[1] || statement.split(' ')[5];
        console.log(`✓ ${tableName}`);
      } catch (err) {
        if (err.code === '42P07') {
          // Table already exists
          const tableName = statement.match(/TABLE.*?(\w+)/)?.[1] || 'item';
          console.log(`→ ${tableName} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Database initialized successfully!\n');
    console.log('Next steps:');
    console.log('1. Run: npm run admin:dev');
    console.log('2. Visit: http://localhost:3000');
    console.log('3. Add vendors and products\n');

    await client.end();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Make sure:');
      console.error('   - Your Supabase project is active');
      console.error('   - Internet connection is working');
      console.error('   - SUPABASE_URL is correct in .env');
    } else if (error.code === 'ENETUNREACH') {
      console.error('\n💡 Network unreachable (likely IPv6 issue).');
      console.error('   - The script now forces IPv4 DNS resolution.');
      console.error('   - Ensure your internet connection is active');
      console.error('   - If behind a proxy/firewall, allow outbound TCP 5432 to *.supabase.co');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Connection issue.');
      console.error('   - Verify port 5432 is not blocked by your ISP or firewall');
      console.error('   - Retry in a few minutes in case of transient network issues');
    } else if (error.code === '28P01' || (error.message && error.message.includes('password'))) {
      console.error('\n💡 Password error. Check:');
      console.error('   - You entered the correct password');
      console.error('   - Password doesn\'t have special characters needing escape');
    } else if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\nInstalling required package...');
      require('child_process').execSync('npm install pg', { stdio: 'inherit' });
      console.error('\nPlease run this script again:\nnpm run db:init\n');
    }

    process.exit(1);

  } finally {
    rl.close();
  }
}

// Run
initDatabase();
