// ThingSpeak API utilities
export const THINGSPEAK_CHANNEL = YOUR_CHANNEL_ID
export const API_BASE = 'https://api.thingspeak.com';

export const fetchChannelData = async (apiKey, results = 100) => {
  try {
    const response = await fetch(
      `${API_BASE}/channels/${THINGSPEAK_CHANNEL}/feeds.json?api_key=${apiKey}&results=${results}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
