# wa-catalog Admin Dashboard

A clean, modular admin interface for managing WhatsApp catalog vendors and products.

## 🎯 Features

- **Vendor Management**: Add, edit, delete vendors with WhatsApp integration
- **Product Management**: Complete CRUD for products with real-time inventory
- **Dashboard**: Statistics overview and quick links
- **Responsive Design**: Mobile-friendly interface
- **RESTful API**: Clean API endpoints for all operations
- **Modular Code**: Each file under 200 lines for maintainability

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- Supabase project with configured tables
- Environment variables set in `.env`

### Installation

```bash
npm install
```

### Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Run the SQL from `SETUP.md` to create tables
3. Or use the auto-setup script (when implemented)

### Start Development Server

```bash
npm run admin:dev
```

Visit: http://localhost:3000

### Production Build

```bash
npm run admin
```

## 📁 Architecture

```
admin/
├── config/              # Configuration files
│   └── supabase.js     # Supabase client instance
├── middleware/          # Express middleware
│   └── errorHandler.js # Global error handling
├── routes/              # Route handlers
│   ├── api/            # REST API endpoints
│   │   ├── vendors.js  # /api/vendors
│   │   └── products.js # /api/products
│   └── pages.js        # Page routes (HTML)
├── services/            # Business logic
│   ├── vendorService.js
│   └── productService.js
├── views/               # EJS templates
│   ├── layout.ejs      # Main layout wrapper
│   ├── dashboard.ejs   # Home page
│   ├── vendors/
│   │   ├── list.ejs
│   │   └── form.ejs
│   ├── products/
│   │   ├── list.ejs
│   │   └── form.ejs
│   └── 404.ejs
├── public/              # Static files
│   ├── css/style.css   # Responsive styling
│   └── js/main.js      # Client utilities
├── scripts/             # Utility scripts
│   └── setupDatabase.js # DB initialization
└── server.js            # Express app entry point
```

## 🔌 API Endpoints

### Vendors
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id` - Get vendor details
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `GET /api/vendors/stats/overview` - Vendor statistics

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/stats/overview` - Product statistics

## 📝 Example Usage

### Create Vendor
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

### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "uuid-here",
    "name": "iPhone 13 128GB",
    "category": "Téléphones",
    "price": 350000,
    "description": "Neuf, jamais utilisé",
    "condition": "Neuf"
  }'
```

## 🎨 Design System

- **Colors**: WhatsApp green (#25D366) + neutral grays
- **Spacing**: 8px base unit system
- **Typography**: System fonts for performance
- **Breakpoints**: Mobile-first responsive design

## ⚙️ Code Standards

- **Max file size**: 200 lines per file
- **Module pattern**: Service classes for business logic
- **Error handling**: Centralized error middleware
- **Naming**: camelCase for JS, snake_case for DB columns
- **Validation**: Server-side + client-side

## 🔒 Security

- Environment variables for sensitive data
- No secrets in code or git history
- CORS enabled for API
- SQL injection prevention via Supabase ORM

## 📊 Database Schema

### vendors
- id (UUID)
- name (TEXT)
- whatsapp_number (TEXT, UNIQUE)
- city (TEXT)
- category (TEXT[])
- verified (BOOLEAN)
- status (TEXT)
- rating_average (DECIMAL)
- rating_count (INTEGER)
- created_at, updated_at

### products
- id (UUID)
- vendor_id (UUID, FK)
- name (TEXT)
- category (TEXT)
- price (INTEGER)
- description (TEXT)
- keywords (TEXT[])
- availability (TEXT)
- condition (TEXT)
- created_at, updated_at

## 🚀 Deployment

Works with:
- Railway
- Vercel
- Heroku
- Docker

Just expose port 3000 and ensure Supabase credentials in env.

## 📝 License

MIT - Built for AfriSearch Bot

## 🤝 Contributing

Keep it modular. Keep it clean. Max 200 lines per file.
