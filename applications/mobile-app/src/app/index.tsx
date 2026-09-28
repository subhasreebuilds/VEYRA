import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // If user exists but profile is incomplete, send to onboarding
  if (profile && profile.isComplete === false) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(protected)/(tabs)" />;
}
