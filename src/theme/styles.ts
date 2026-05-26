import { StyleSheet } from 'react-native';
import type { AppTheme } from './tokens';

export const createCommonStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.bg },
    content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.md },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { ...theme.typography.section, color: theme.colors.text },
    meta: { ...theme.typography.meta, color: theme.colors.textMuted },
    chip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.elevated,
    },
    chipText: { ...theme.typography.meta, color: theme.colors.text },
  });
