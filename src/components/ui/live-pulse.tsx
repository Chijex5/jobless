import { Animated } from 'react-native';
import { useEffect, useRef } from 'react';

import type { AppTheme } from '@/theme/tokens';

export function LivePulse({ theme }: { theme: AppTheme }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.25, duration: 1200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.25, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={{
        width: 9,
        height: 9,
        borderRadius: 999,
        backgroundColor: theme.colors.accentBlue,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

