import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/use-app-theme';

// The app doesn't have a real authenticated-user object yet — derive the
// avatar initial from the configured account email so it isn't fabricated.
const ACCOUNT_EMAIL = 'embroconnect2@gmail.com';

// ─── AppHeader ────────────────────────────────────────────────────────────────
// Shared, fixed (non-scrolling) brand bar used at the top of every tab screen:
// logo mark + "Scout" wordmark on the left, a bell button that opens the
// notifications route + the account-initial avatar on the right. Respects the
// device's top safe-area inset so it clears the status bar / notch.

export function AppHeader() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const accountInitial = ACCOUNT_EMAIL.trim().charAt(0).toUpperCase() || 'U';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: insets.top + 10,
        paddingBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Logo mark + wordmark */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            backgroundColor: theme.colors.accentBlue,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '800',
              fontFamily: theme.fontFamily.sansExtraBold,
              color: '#FFFFFF',
            }}
          >
            S
          </Text>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '800',
            fontFamily: theme.fontFamily.sansExtraBold,
            color: theme.colors.textPrimary,
            letterSpacing: -0.4,
          }}
        >
          Scout
        </Text>
      </View>

      {/* Notifications + avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
          {({ pressed }) => (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed
                  ? theme.colors.surfaceStrong
                  : theme.colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
              }}
            >
              <Bell size={16} color={theme.colors.textSecondary} strokeWidth={2} />
            </View>
          )}
        </Pressable>

        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceStrong,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              fontFamily: theme.fontFamily.sansBold,
              color: theme.colors.textSecondary,
            }}
          >
            {accountInitial}
          </Text>
        </View>
      </View>
    </View>
  );
}
