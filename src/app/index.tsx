import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1200);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Scout</Text>
      <ActivityIndicator size="small" color="#1f2937" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ec',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  brand: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: '#1f2937',
    textTransform: 'lowercase',
  },
});