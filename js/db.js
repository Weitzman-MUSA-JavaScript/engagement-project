// Uses the global `supabase` from the CDN script in index.html

/* global supabase */
const SUPABASE_URL = 'https://evvjlynnabdwpferdnqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmpseW5uYWJkd3BmZXJkbnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODc5NjMsImV4cCI6MjA4MTU2Mzk2M30.9rsOvkqFy1PcRiPMw9j0NdpwSzEyL8Ll2DKUJaE-i7A';

export const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchPlaces(limit = 1000) {
  const { data, error } = await db
    .from('places')
    .select('id, osm_id, name, lat, lng, cuisine, address')
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// Reviews
export async function fetchReviewsForPlace(placeId) {
  const { data, error } = await db
    .from('reviews')
    .select('id, occasion, food, value, vibe, go_to_order, note, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function insertReview(review) {
  const { data, error } = await db
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAllReviews(limit = 5000) {
  const { data, error } = await db
    .from('reviews')
    .select('place_id, occasion, food, value, vibe, created_at')
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
