import { Redirect } from 'expo-router';

// This file is a placeholder for the center FAB tab.
// The actual capture UI is rendered as a BottomSheet overlay in (tabs)/_layout.tsx.
export default function CaptureScreen() {
  return <Redirect href="/(tabs)" />;
}
