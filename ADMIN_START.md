# wa-catalog Admin Dashboard - Getting Started

## 📋 Prerequisites

1. **Node.js** 14+ installed
2. **Supabase Project** created and ready
3. **.env file** with credentials (already done ✓)

## 🎯 Step-by-Step Setup

### Step 1: Create Supabase Tables

Go to your [Supabase Dashboard](https://supabase.com/dashboard) > SQL Editor

Run this SQL:

```sql
-- Vendors Table
CREATE TABLE vendors (
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

-- Products Table
CREATE TABLE products (
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

-- Search Logs Table (Optional)
CREATE TABLE search_logs (
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

-- Create indexes for performance
CREATE INDEX idx_vendors_city ON vendors(city);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category);
```

### Step 2: Start the Admin Dashboard

```bash
# Development mode (with auto-reload)
npm run admin:dev

# Or production mode
npm run admin
```

The dashboard will be available at: **http://localhost:3000**

### Step 3: Add Test Data (Optional)

```bash
npm run db:seed
```

This adds 3 test vendors and 3 test products.

## 🎨 Dashboard Features

### Home (Dashboard)
- Overview statistics
- Quick access to vendors and products
- Real-time counts from Supabase

### Vendors Management
- **List**: View all vendors with filters
- **Add**: Register new vendors
- **Edit**: Update vendor information
- **Delete**: Remove vendors (with confirmation)
- **Verify**: Mark vendors as verified

### Products Management
- **List**: Browse all products
- **Add**: Create new products
- **Edit**: Modify product details
- **Delete**: Remove products
- **Track**: Monitor inventory status

## 🔌 API Usage

### Get All Vendors
```bash
curl http://localhost:3000/api/vendors
```

### Create a Vendor
```bash
curl -X POST http://localhost:3000/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyShop",
    "whatsappNumber": "+22997000000",
    "city": "Cotonou",
    "category": ["Electronics", "Phones"],
    "verified": false
  }'
```

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "uuid-of-vendor",
    "name": "iPhone 13",
    "category": "Phones",
    "price": 350000,
    "description": "New condition",
    "condition": "Neuf",
    "availability": "in_stock"
  }'
```

## 📁 Project Structure

```
admin/
├── config/              # Configuration
│   └── supabase.js     # Supabase client
├── services/            # Business logic
│   ├── vendorService.js
│   └── productService.js
├── routes/
│   ├── api/            # REST API
│   │   ├── vendors.js
│   │   └── products.js
│   └── pages.js        # Page routes
├── views/               # EJS Templates
│   ├── layout.ejs
│   ├── dashboard.ejs
│   ├── vendors/
│   ├── products/
│   └── 404.ejs
├── public/
│   ├── css/style.css   # Responsive design
│   └── js/main.js      # Utilities
└── server.js            # Main app
```

## ✨ Key Features

✅ **Modular Architecture** - Each file < 200 lines
✅ **RESTful API** - Clean endpoints
✅ **Real-time Database** - Supabase integration
✅ **Responsive Design** - Mobile-friendly
✅ **Error Handling** - Centralized middleware
✅ **WhatsApp Green Theme** - Professional look
✅ **No Dependencies on Complex Frameworks** - Plain JS + Express

## 🐛 Troubleshooting

### Tables not found
- Verify you ran the SQL in Supabase
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are correct

### Port 3000 already in use
```bash
# Kill process using port 3000 (Linux/Mac)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use a different port
PORT=3001 npm run admin:dev
```

### Forms not submitting
- Check browser console for errors (F12)
- Ensure JavaScript is enabled
- Verify Supabase credentials

## 🚀 Next Steps

1. ✓ Set up Supabase tables
2. ✓ Start admin dashboard
3. Add your vendors
4. Add your products
5. Test with the bot (when integrated)

## 📞 Support

For issues or questions:
1. Check the browser console (F12) for errors
2. Review Supabase logs
3. Verify environment variables

---

**Happy managing! 🎉**
