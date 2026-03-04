import { supabase } from '../lib/supabase';
import type { BusinessOnboardingForm } from '../types';

/**
 * Activate business profile — sets is_business = true and populates business fields
 */
export async function activateBusinessProfile(
  userId: string,
  data: BusinessOnboardingForm
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_business: true,
      business_name: data.business_name,
      business_category: data.business_category,
      business_description: data.business_description || null,
      business_address: data.business_address || null,
      business_logo_url: data.business_logo_url || null,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error activating business profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Deactivate business profile — sets is_business = false (keeps fields for re-activation)
 */
export async function deactivateBusinessProfile(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_business: false })
    .eq('id', userId);

  if (error) {
    console.error('Error deactivating business profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update business profile fields (partial update)
 */
export async function updateBusinessProfile(
  userId: string,
  data: Partial<Omit<BusinessOnboardingForm, 'business_name'>> & { business_name?: string; business_opening_hours?: Record<string, unknown> | null }
): Promise<{ success: boolean; error?: string }> {
  const updateData: Record<string, unknown> = {};

  if (data.business_name !== undefined) updateData.business_name = data.business_name;
  if (data.business_category !== undefined) updateData.business_category = data.business_category;
  if (data.business_description !== undefined) updateData.business_description = data.business_description;
  if (data.business_address !== undefined) updateData.business_address = data.business_address;
  if (data.business_logo_url !== undefined) updateData.business_logo_url = data.business_logo_url;
  if (data.business_opening_hours !== undefined) updateData.business_opening_hours = data.business_opening_hours;

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating business profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
