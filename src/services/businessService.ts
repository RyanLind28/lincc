import { supabase } from '../lib/supabase';
import type { Business, BusinessWithOwner, BusinessLocation, CreateBusinessForm, BusinessOpeningHours } from '../types';

interface ServiceResult {
  success: boolean;
  error?: string;
}

interface BusinessResult extends ServiceResult {
  data?: Business;
}

/**
 * Create a new business page
 */
export async function createBusiness(
  ownerId: string,
  data: CreateBusinessForm
): Promise<BusinessResult> {
  const { data: business, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: ownerId,
      name: data.name,
      category: data.category,
      description: data.description || null,
      address: data.address || null,
      logo_url: data.logo_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating business:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: business as Business };
}

/**
 * Update an existing business
 */
export async function updateBusiness(
  businessId: string,
  data: Partial<{
    name: string;
    category: string;
    description: string | null;
    address: string | null;
    logo_url: string | null;
    opening_hours: BusinessOpeningHours | null;
    status: 'active' | 'inactive';
  }>
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('businesses')
    .update(data)
    .eq('id', businessId);

  if (error) {
    console.error('Error updating business:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a business and all its vouchers (cascade)
 */
export async function deleteBusiness(businessId: string): Promise<ServiceResult> {
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId);

  if (error) {
    console.error('Error deleting business:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get a business by ID with owner profile
 */
export async function getBusinessById(id: string): Promise<BusinessWithOwner | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      owner:profiles!owner_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching business:', error);
    return null;
  }

  return data as BusinessWithOwner;
}

/**
 * Get all businesses owned by a user
 */
export async function getBusinessesByOwner(ownerId: string): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user businesses:', error);
    return [];
  }

  return data as Business[];
}

/**
 * Get active businesses for the directory, with optional search and category filter
 */
export async function getActiveBusinesses(
  query?: string,
  category?: string,
  limit = 30
): Promise<Business[]> {
  let q = supabase
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(limit);

  if (category) {
    q = q.eq('category', category);
  }

  if (query) {
    q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data, error } = await q;

  if (error) {
    console.error('Error fetching active businesses:', error);
    return [];
  }

  return data as Business[];
}

// ---- Location CRUD ----

/**
 * Get all locations for a business
 */
export async function getLocationsByBusiness(businessId: string): Promise<BusinessLocation[]> {
  const { data, error } = await supabase
    .from('business_locations')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }

  return data as BusinessLocation[];
}

/**
 * Add a location to a business
 */
export async function addLocation(
  businessId: string,
  locationData: { name: string; address: string; lat: number; lng: number; is_primary?: boolean }
): Promise<{ success: boolean; error?: string; data?: BusinessLocation }> {
  const { data: location, error } = await supabase
    .from('business_locations')
    .insert({
      business_id: businessId,
      name: locationData.name,
      address: locationData.address,
      lat: locationData.lat,
      lng: locationData.lng,
      is_primary: locationData.is_primary ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding location:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: location as BusinessLocation };
}

/**
 * Delete a location
 */
export async function deleteLocation(locationId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('business_locations')
    .delete()
    .eq('id', locationId);

  if (error) {
    console.error('Error deleting location:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
