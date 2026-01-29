import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
  ActivityIndicator,
} from 'react-native';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const colors = {
  primary: '#18181b',
  primaryForeground: '#fafafa',
  secondary: '#f4f4f5',
  secondaryForeground: '#18181b',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  accent: '#f4f4f5',
  accentForeground: '#18181b',
  background: '#ffffff',
  border: '#e4e4e7',
};

const getVariantStyles = (variant: ButtonVariant, pressed: boolean): { container: ViewStyle; text: TextStyle } => {
  const pressedOpacity = pressed ? 0.9 : 1;
  
  switch (variant) {
    case 'default':
      return {
        container: {
          backgroundColor: colors.primary,
          opacity: pressedOpacity,
        },
        text: {
          color: colors.primaryForeground,
        },
      };
    case 'destructive':
      return {
        container: {
          backgroundColor: colors.destructive,
          opacity: pressedOpacity,
        },
        text: {
          color: colors.destructiveForeground,
        },
      };
    case 'outline':
      return {
        container: {
          backgroundColor: pressed ? colors.accent : colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        },
        text: {
          color: pressed ? colors.accentForeground : colors.primary,
        },
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: colors.secondary,
          opacity: pressed ? 0.8 : 1,
        },
        text: {
          color: colors.secondaryForeground,
        },
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: pressed ? colors.accent : 'transparent',
        },
        text: {
          color: pressed ? colors.accentForeground : colors.primary,
        },
      };
  }
};

const getSizeStyles = (size: ButtonSize): { container: ViewStyle; text: TextStyle } => {
  switch (size) {
    case 'sm':
      return {
        container: {
          height: 32,
          paddingHorizontal: 12,
          borderRadius: 6,
          gap: 6,
        },
        text: {
          fontSize: 13,
        },
      };
    case 'lg':
      return {
        container: {
          height: 40,
          paddingHorizontal: 24,
          borderRadius: 6,
        },
        text: {
          fontSize: 15,
        },
      };
    case 'icon':
      return {
        container: {
          height: 36,
          width: 36,
          paddingHorizontal: 0,
        },
        text: {},
      };
    case 'icon-sm':
      return {
        container: {
          height: 32,
          width: 32,
          paddingHorizontal: 0,
        },
        text: {},
      };
    case 'icon-lg':
      return {
        container: {
          height: 40,
          width: 40,
          paddingHorizontal: 0,
        },
        text: {},
      };
    default:
      return {
        container: {
          height: 36,
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        text: {
          fontSize: 14,
        },
      };
  }
};

export function Button({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => {
        const variantStyles = getVariantStyles(variant, pressed);
        const sizeStyles = getSizeStyles(size);
        
        return [
          styles.base,
          variantStyles.container,
          sizeStyles.container,
          (disabled || loading) && styles.disabled,
          style,
        ];
      }}
      {...props}
    >
      {({ pressed }) => {
        const variantStyles = getVariantStyles(variant, pressed);
        const sizeStyles = getSizeStyles(size);
        
        if (loading) {
          return (
            <ActivityIndicator
              size="small"
              color={variantStyles.text.color}
            />
          );
        }
        
        if (typeof children === 'string') {
          return (
            <Text
              style={[
                styles.text,
                variantStyles.text,
                sizeStyles.text,
                textStyle,
              ]}
            >
              {children}
            </Text>
          );
        }
        
        return children;
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '500',
  },
});
