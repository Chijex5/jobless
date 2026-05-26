import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { AppTheme } from '@/theme/tokens';

export function Card({
  theme,
  children,
  style,
}: {
  theme: AppTheme;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.base, getStyle(theme), style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    padding: 16,
  },
});

const getStyle = (theme: AppTheme): ViewStyle => ({
  backgroundColor: theme.colors.surface,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
  shadowColor: theme.colors.shadow,
  shadowOpacity: theme.appearance === 'dark' ? 0.34 : 0.16,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 1,
});

