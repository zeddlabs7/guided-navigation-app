import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'My Addresses',
        }}
      />
    </Tabs>
  );
}
