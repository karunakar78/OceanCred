import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { C } from './src/theme';
import { BottomNav } from './src/components/Shared';
import { mobileApi } from './src/api/mobileApi';
import { ensureNotificationSetup } from './src/services/notifications';
import {
  clearMarketplaceNotificationSnapshot,
  startMarketplaceNotificationsPoller,
} from './src/services/marketplaceNotificationsPoller';
import { registerExpoPushTokenForUser } from './src/services/pushRegistration';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UploadScreen from './src/screens/UploadScreen';
import ResultScreen from './src/screens/ResultScreen';
import WalletScreen from './src/screens/WalletScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import UserDetailsScreen from './src/screens/UserDetailsScreen';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [session, setSession] = useState({
    accessToken: null,
    refreshToken: null,
    phone: '',
    user: null,
  });
  const [lastUploadResult, setLastUploadResult] = useState(null);

  const handleAuthSuccess = (payload, phone) => {
    setSession({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      phone,
      user: payload.user,
    });
    setScreen(payload?.user?.profile_completed ? 'profile' : 'details');
  };

  const handleOnboardingCompleted = (updatedUser) => {
    setSession((prev) => ({ ...prev, user: updatedUser }));
    setScreen('profile');
  };

  const handleLogout = async () => {
    try {
      await mobileApi.logout();
    } catch {
      // Even on network failure, clear local session.
    }

    await clearMarketplaceNotificationSnapshot();

    setSession({
      accessToken: null,
      refreshToken: null,
      phone: '',
      user: null,
    });
    setLastUploadResult(null);
    setScreen('login');
  };

  useEffect(() => {
    if (!session.refreshToken) return;
    mobileApi.refreshToken().catch(() => null);
  }, [session.refreshToken]);

  useEffect(() => {
    return () => {
      if (session.accessToken) {
        mobileApi.logout().catch(() => null);
      }
    };
  }, [session.accessToken]);

  /** Local + scheduled notifications; poller compares API state while the app runs (no push server). */
  useEffect(() => {
    if (Platform.OS === 'web' || !session.accessToken) return undefined;

    let cancelled = false;
    let stopPoller = () => {};

    (async () => {
      await ensureNotificationSetup();
      if (cancelled) return;
      await registerExpoPushTokenForUser(session.accessToken);
      if (cancelled) return;
      stopPoller = startMarketplaceNotificationsPoller(session.accessToken);
    })();

    return () => {
      cancelled = true;
      stopPoller();
    };
  }, [session.accessToken]);

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen navigate={setScreen} onAuthSuccess={handleAuthSuccess} />;
      case 'profile':
        return <ProfileScreen token={session.accessToken} user={session.user} onLogout={handleLogout} />;
      case 'details':
        return <UserDetailsScreen token={session.accessToken} onCompleted={handleOnboardingCompleted} />;
      case 'upload':
        return (
          <UploadScreen
            navigate={setScreen}
            token={session.accessToken}
            onUploadComplete={(result) => setLastUploadResult(result)}
          />
        );
      case 'result':
        return <ResultScreen navigate={setScreen} uploadResult={lastUploadResult} />;
      case 'wallet':
        return <WalletScreen navigate={setScreen} token={session.accessToken} />;
      case 'marketplace':
        return <MarketplaceScreen navigate={setScreen} token={session.accessToken} />;
      default:
        return <LoginScreen navigate={setScreen} onAuthSuccess={handleAuthSuccess} />;
    }
  };

  const showNav = screen !== 'login' && screen !== 'details';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.ocean,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
      }}
    >
      {renderScreen()}
      {showNav && <BottomNav active={screen} navigate={setScreen} />}
    </View>
  );
}
