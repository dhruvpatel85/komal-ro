import { API_BASE } from '../api/config';

const PLACEHOLDER =
  'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400';

export function productImageUri(imageUrl) {
  if (!imageUrl) return PLACEHOLDER;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  const base = (API_BASE || '').replace(/\/$/, '');
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${base}${path}`;
}