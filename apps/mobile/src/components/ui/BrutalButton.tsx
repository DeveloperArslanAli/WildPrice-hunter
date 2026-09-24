import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../constants/theme';

interface BrutalButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Press animation: translate to collapse shadow
  const translateX = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  const bgColors = {
    primary: Colors.accentRed,
    secondary: Colors.bgCard,
    ghost: 'transparent',
    danger: Colors.error,
  };

  const textColors = {
    primary: Colors.bgCard,
    secondary: Colors.ink,
    ghost: Colors.ink,
    danger: Colors.bgCard,
  };

  const paddingMap = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
    lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
  };

  const fontSizes = { sm: Typography.small, md: Typography.body, lg: Typography.h4 };

  return (
    <Animated.View
      style={[
        styles.shadowBase,
        variant !== 'ghost' && Shadows.default,
        { transform: [{ translateX }, { translateY }] },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.button,
          paddingMap[size],
          {
            backgroundColor: disabled ? Colors.inkLight : bgColors[variant],
            borderWidth: variant !== 'ghost' ? Borders.width : 0,
            borderColor: Colors.ink,
          },
          fullWidth && { width: '100%' },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColors[variant]} size="small" />
        ) : (
          <Text
            style={[
              styles.label,
              {
                color: disabled ? Colors.bgCard : textColors[variant],
                fontSize: fontSizes[size],
              },
              textStyle,
            ]}
          >
            {label.toUpperCase()}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadowBase: {
    // Shadow is applied via Shadows.default spread
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  label: {
    fontWeight: Typography.bold,
    letterSpacing: Typography.letterSpacingLabel,
    lineHeight: undefined,
  },
});
