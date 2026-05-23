import { Stack } from 'expo-router';

export default function GuidanceDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="share" />
      <Stack.Screen name="steps" />
    </Stack>
  );
}
