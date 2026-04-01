import React, { useState } from 'react';
import { View } from 'react-native';
import { C } from './src/theme';
import { BottomNav } from './src/components/Shared';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UploadScreen from './src/screens/UploadScreen';
import ResultScreen from './src/screens/ResultScreen';
import WalletScreen from './src/screens/WalletScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';

export default function App() {
  const [screen, setScreen] = useState('login');

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen navigate={setScreen} />;
      case 'profile':
        return <ProfileScreen navigate={setScreen} />;
      case 'upload':
        return <UploadScreen navigate={setScreen} />;
      case 'result':
        return <ResultScreen navigate={setScreen} />;
      case 'wallet':
        return <WalletScreen navigate={setScreen} />;
      case 'marketplace':
        return <MarketplaceScreen navigate={setScreen} />;
      default:
        return <LoginScreen navigate={setScreen} />;
    }
  };

  const showNav = screen !== 'login';

  return (
    <View style={{ flex: 1, backgroundColor: C.ocean }}>
      {renderScreen()}
      {showNav && <BottomNav active={screen} navigate={setScreen} />}
    </View>
  );
}
