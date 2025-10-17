const supabase = require('../config/supabase');

class ProductService {
  async getAll(filters = {}) {
    let query = supabase.from('products').select('*, vendors(name)');

    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*, vendors(name, whatsapp_number)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(productData) {
    const {
      vendorId,
      name,
      category,
      price,
      description,
      availability,
      condition
    } = productData;

    const keywords = name.toLowerCase().split(' ').filter(w => w.length > 2);

    const { data, error } = await supabase
      .from('products')
      .insert([{
        vendor_id: vendorId,
        name,
        category,
        price: parseInt(price),
        description: description || '',
        keywords,
        availability: availability || 'in_stock',
        condition: condition || 'Neuf'
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async update(id, productData) {
    const updateData = {};

    if (productData.name) {
      updateData.name = productData.name;
      updateData.keywords = productData.name.toLowerCase().split(' ').filter(w => w.length > 2);
    }
    if (productData.category) updateData.category = productData.category;
    if (productData.price) updateData.price = parseInt(productData.price);
    if (productData.description) updateData.description = productData.description;
    if (productData.availability) updateData.availability = productData.availability;
    if (productData.condition) updateData.condition = productData.condition;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async delete(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getStats() {
    const { count: totalProducts, error: error1 } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: inStock, error: error2 } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('availability', 'in_stock');

    if (error1 || error2) throw error1 || error2;

    return { totalProducts, inStock };
  }
}

module.exports = new ProductService();
