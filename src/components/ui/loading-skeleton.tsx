import { Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

import type { AppTheme } from '@/theme/tokens';

export function LoadingSkeleton({
  theme,
  height = 14,
}: {
  theme: AppTheme;
  height?: number;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        height,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceElevated,
        opacity,
      }}
    />
  );
}

