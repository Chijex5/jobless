import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { AppTheme } from '@/theme/tokens';

export function scoreRingColor(score: number, theme: AppTheme): string {
  if (score >= 70) return theme.colors.accentBlue;
  return theme.colors.textMuted;
}

export function ScoreRing({
  theme,
  score,
  size = 46,
  strokeWidth = 4,
  showSuffix = false,
}: {
  theme: AppTheme;
  score: number;
  size?: number;
  strokeWidth?: number;
  showSuffix?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const color = scoreRingColor(clamped, theme);
  const fontSize = size >= 70 ? 30 : size >= 50 ? 21 : 15;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.surfaceStrong}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize,
            fontFamily: theme.fontFamily.sansExtraBold,
            fontWeight: '800',
            color: theme.colors.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          {Math.round(clamped)}
        </Text>
        {showSuffix ? (
          <Text
            style={{
              fontSize: 9,
              fontFamily: theme.fontFamily.monoRegular,
              color: theme.colors.textMuted,
              marginTop: 1,
            }}
          >
            / 100
          </Text>
        ) : null}
      </View>
    </View>
  );
}
