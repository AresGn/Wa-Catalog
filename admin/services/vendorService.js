const supabase = require('../config/supabase');

class VendorService {
  async getAll() {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getById(id) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(vendorData) {
    const { name, whatsappNumber, city, category, verified } = vendorData;

    const { data, error } = await supabase
      .from('vendors')
      .insert([{
        name,
        whatsapp_number: whatsappNumber,
        city,
        category: Array.isArray(category) ? category : [category],
        verified: verified || false,
        status: 'active',
        rating_average: 0,
        rating_count: 0
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async update(id, vendorData) {
    const updateData = {};
    
    if (vendorData.name) updateData.name = vendorData.name;
    if (vendorData.whatsappNumber) updateData.whatsapp_number = vendorData.whatsappNumber;
    if (vendorData.city) updateData.city = vendorData.city;
    if (vendorData.category) updateData.category = Array.isArray(vendorData.category) ? vendorData.category : [vendorData.category];
    if (vendorData.verified !== undefined) updateData.verified = vendorData.verified;
    if (vendorData.status) updateData.status = vendorData.status;

    const { data, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async delete(id) {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getStats() {
    const { count: totalVendors, error: error1 } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });

    const { count: activeVendors, error: error2 } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error1 || error2) throw error1 || error2;

    return { totalVendors, activeVendors };
  }
}

module.exports = new VendorService();
