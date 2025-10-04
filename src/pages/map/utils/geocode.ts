let geocoder: google.maps.Geocoder | null = null;
const cache = new Map<string, string>();

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    if (!geocoder) geocoder = new google.maps.Geocoder();
    const key = `${lat},${lng}`;
    if (cache.has(key)) return cache.get(key)!;

    const response = await geocoder.geocode({ location: { lat, lng } });
    const addr = response.results?.[0]?.formatted_address ?? key;
    cache.set(key, addr);
    return addr;
  } catch (err) {
    console.error('Geocoding error:', err);
    return `${lat}, ${lng}`;
  }
}