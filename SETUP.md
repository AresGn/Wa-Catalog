# wa-catalog Admin Setup Guide

## 🚀 Quick Start

### 1. Supabase Setup

Create the following tables in your Supabase project:

#### Vendors Table
```sql
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
```

#### Products Table
```sql
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
```

#### Search Logs Table (Optional)
```sql
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
```

### 2. Environment Variables

Your `.env` file should already have:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
NODE_ENV=production
```

### 3. Start the Admin Dashboard

```bash
npm run admin:dev
```

Then visit: `http://localhost:3000`

## 📁 Project Structure

```
admin/
├── config/
│   └── supabase.js           # Supabase client
├── services/
│   ├── vendorService.js      # Vendor CRUD logic
│   └── productService.js     # Product CRUD logic
├── routes/
│   ├── api/
│   │   ├── vendors.js        # Vendor API
│   │   └── products.js       # Product API
│   └── pages.js              # Page routes
├── middleware/
│   └── errorHandler.js       # Error handling
├── views/
│   ├── layout.ejs            # Main layout
│   ├── dashboard.ejs         # Home page
│   ├── vendors/              # Vendor pages
│   ├── products/             # Product pages
│   └── 404.ejs               # Not found
├── public/
│   ├── css/style.css         # Styles
│   └── js/main.js            # Client JS
└── server.js                 # Express app
```

## 🔑 Features

- **Dashboard**: Overview of vendors and products
- **Vendor Management**: CRUD operations with status and verification
- **Product Management**: Full product lifecycle
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean Code**: Max 200 lines per file
- **Supabase Integration**: Real-time database

## 🧪 Testing

### Add a test vendor via API:
```bash
curl -X POST http://localhost:3000/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechShop229",
    "whatsappNumber": "+22997000000",
    "city": "Cotonou",
    "category": ["Électronique", "Téléphones"],
    "verified": false
  }'
```

### Get all vendors:
```bash
curl http://localhost:3000/api/vendors
```

## 📝 Notes

- All components are modular and maintainable
- Error handling is centralized
- API follows RESTful standards
- Forms include client-side and server-side validation
- Responsive CSS design with WhatsApp-inspired colors
