import { Platform } from 'react-native';
import Constants from "expo-constants";

const cleanUrl = (value) => {
  if (!value) return null;
  let url = value.trim();
  if (!/^https?:\/\//.test(url)) {
    url = `http://${url}`;
  }
  return url.replace(/\/$/, "");
};

export const getBaseUrl = () => {
  const envUrl = cleanUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) return envUrl;

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5000`;
  }

  if (Platform.OS === 'android') return "http://10.0.2.2:5000";
  if (Platform.OS === 'ios' || Platform.OS === 'web') return "http://localhost:5000";

  return "http://192.168.93.107:5000"; // IMPORTANT: Replace with your actual IP as a last resort
};