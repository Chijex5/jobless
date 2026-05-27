import { Text, View } from 'react-native';

import type { AppTheme } from '@/theme/tokens';

type Variant = 'default' | 'blue' | 'violet' | 'success' | 'warning';

const chipVariants: Record<Variant, (theme: AppTheme) => { bg: string; fg: string }> = {
  default: (theme) => ({ bg: theme.colors.surfaceStrong, fg: theme.colors.textSecondary }),
  blue: (theme) => ({ bg: `${theme.colors.accentBlue}22`, fg: theme.colors.accentBlue }),
  violet: (theme) => ({ bg: `${theme.colors.accentViolet}22`, fg: theme.colors.accentViolet }),
  success: (theme) => ({ bg: `${theme.colors.accentRose}22`, fg: theme.colors.accentRose }),
  warning: (theme) => ({ bg: `${theme.colors.accentWarning}22`, fg: theme.colors.accentWarning }),
};

export function Chip({
  theme,
  label,
  variant = 'default',
}: {
  theme: AppTheme;
  label: string;
  variant?: Variant;
}) {
  const colors = chipVariants[variant](theme);

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
      }}>
      <Text
        style={{
          ...theme.typography.meta,
          color: colors.fg,
        }}>
        {label}
      </Text>
    </View>
  );
}

