import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';

export const initMobileBridge = async (onOfflineChange?: (isOnline: boolean) => void) => {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) return;

  // 1. Durum Çubuğu (Status Bar)
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
  } catch (err) {
    console.warn('StatusBar modülü başlatılamadı:', err);
  }

  // 2. Splash Screen Gizleme
  try {
    await SplashScreen.hide();
  } catch (err) {
    console.warn('SplashScreen kapatılamadı:', err);
  }

  // 3. Android Donanım Geri Tuşu Yönetimi
  try {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (err) {
    console.warn('Geri tuşu dinleyicisi eklenemedi:', err);
  }

  // 4. Ağ Durumu Takibi
  try {
    Network.addListener('networkStatusChange', (status) => {
      if (onOfflineChange) {
        onOfflineChange(status.connected);
      }
    });
  } catch (err) {
    console.warn('Ağ dinleyicisi başlatılamadı:', err);
  }

  // 5. Push Bildirimleri (FCM & APNs)
  await setupPushNotifications();
};

const setupPushNotifications = async () => {
  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      fetch('/api/notifications/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() })
      }).catch((e) => console.error('Token iletim hatası:', e));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const targetUrl = notification.notification.data?.url;
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
  } catch (err) {
    console.warn('PushNotifications başlatılamadı:', err);
  }
};
