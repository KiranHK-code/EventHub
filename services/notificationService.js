import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const API_BASE_URL = 'http://192.168.93.107:5000';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.warn('❌ Notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('❌ Permission to get notifications was denied');
      return null;
    }

    // Get push token (Expo will use project from app.json automatically)
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    console.log('✅ Expo Push Token:', token);

    // send token to backend so server can push to this device
    try {
      await fetch(`${API_BASE_URL}/register-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, role: 'admin' }),
      });
      console.log('✅ Registered device token with backend');
    } catch (err) {
      console.error('❌ Failed to register token with backend:', err);
    }

    return token;
  } catch (error) {
    console.error('❌ Failed to get push token:', error.message);
    // Return null but don't crash the app
    return null;
  }
};

export const sendLocalNotification = async (title, body) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Send immediately
    });
  } catch (err) {
    console.error('❌ Error sending local notification:', err);
  }
};

export const setupNotificationListeners = (navigation) => {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 Foreground notification received:', notification);
  });

  // Handle notification tap when app is closed or in background
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('🔔 Notification tapped:', response);
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};
