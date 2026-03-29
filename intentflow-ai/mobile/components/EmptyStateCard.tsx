import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import { useColorScheme } from './useColorScheme';

export default function EmptyStateCard() {
  const theme = useColorScheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f0f7ff' }]}>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>No tasks yet</Text>
      <Text style={styles.subtitle}>
        Add your first task above to get started
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 40,
    paddingVertical: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2f95dc',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
