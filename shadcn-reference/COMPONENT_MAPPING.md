# ShadCN to React Native StyleSheet Mapping

This document maps the web ShadCN/UI components to their React Native StyleSheet equivalents for the Universus mobile app.

## Design Token Mapping

### Colors (CSS Variables → React Native)

```typescript
export const colors = {
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#ffffff',
    cardForeground: '#0a0a0a',
    primary: '#18181b',
    primaryForeground: '#fafafa',
    secondary: '#f4f4f5',
    secondaryForeground: '#18181b',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    accent: '#f4f4f5',
    accentForeground: '#18181b',
    destructive: '#ef4444',
    destructiveForeground: '#fafafa',
    border: '#e4e4e7',
    input: '#e4e4e7',
    ring: '#18181b',
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#fafafa',
    card: '#0a0a0a',
    cardForeground: '#fafafa',
    primary: '#fafafa',
    primaryForeground: '#18181b',
    secondary: '#27272a',
    secondaryForeground: '#fafafa',
    muted: '#27272a',
    mutedForeground: '#a1a1aa',
    accent: '#27272a',
    accentForeground: '#fafafa',
    destructive: '#7f1d1d',
    destructiveForeground: '#fafafa',
    border: '#27272a',
    input: '#27272a',
    ring: '#d4d4d8',
  },
};
```

### Spacing Scale

```typescript
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
};
```

### Border Radius

```typescript
export const radius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};
```

### Typography

```typescript
export const typography = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 40 },
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
```

---

## Component Mappings

### Button

**Web (ShadCN):**
- Uses `cva` for variant styling
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon

**React Native:**

```typescript
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

const buttonVariants: Record<ButtonVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.primary,
  },
  destructive: {
    backgroundColor: colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const buttonSizes: Record<ButtonSize, ViewStyle> = {
  default: { height: 36, paddingHorizontal: 16, paddingVertical: 8 },
  sm: { height: 32, paddingHorizontal: 12, borderRadius: radius.md },
  lg: { height: 40, paddingHorizontal: 24, borderRadius: radius.md },
  icon: { height: 36, width: 36 },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
```

---

### Card

**Web (ShadCN):**
- Container with border, shadow, and rounded corners
- Sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter

**React Native:**

```typescript
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    paddingVertical: 24,
    gap: 24,
  },
  header: {
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  content: {
    paddingHorizontal: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
```

---

### Dialog / Modal

**Web (ShadCN):**
- Uses Radix Dialog primitive
- Overlay with backdrop blur
- Centered content with animations

**React Native:**

```typescript
import { Modal, View, Pressable, Animated, Dimensions } from 'react-native';

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    borderRadius: radius.sm,
  },
});
```

---

### Sheet (Bottom Sheet)

**Web (ShadCN):**
- Slide-in panel from edges (top, bottom, left, right)
- Uses Radix Dialog with custom animations

**React Native:**

```typescript
import { Animated, PanResponder, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const sheetStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 8,
    paddingBottom: 34, // Safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 4,
  },
  content: {
    paddingHorizontal: 24,
  },
});
```

---

### Badge

**Web (ShadCN):**
- Inline pill-shaped label
- Variants: default, secondary, destructive, outline

**React Native:**

```typescript
const badgeVariants: Record<string, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: {
      backgroundColor: colors.primary,
    },
    text: {
      color: colors.primaryForeground,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.secondary,
    },
    text: {
      color: colors.secondaryForeground,
    },
  },
  destructive: {
    container: {
      backgroundColor: colors.destructive,
    },
    text: {
      color: '#ffffff',
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: {
      color: colors.foreground,
    },
  },
};

const badgeStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
```

---

### Tabs

**Web (ShadCN):**
- Uses Radix Tabs primitive
- TabsList, TabsTrigger, TabsContent

**React Native:**

```typescript
const tabStyles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: 3,
  },
  trigger: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  triggerTextActive: {
    color: colors.foreground,
  },
  content: {
    flex: 1,
  },
});
```

---

### Input

**Web (ShadCN):**
- Styled text input with focus states
- Border, shadow, and placeholder styling

**React Native:**

```typescript
const inputStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    height: 36,
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 14,
    color: colors.foreground,
  },
  inputFocused: {
    borderColor: colors.ring,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    color: colors.mutedForeground,
  },
});
```

---

### Slider

**Web (ShadCN):**
- Uses Radix Slider primitive
- Track, Range, and Thumb components

**React Native:**

```typescript
import Slider from '@react-native-community/slider';

const sliderStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
  },
  range: {
    backgroundColor: colors.primary,
  },
  thumb: {
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
```

---

### Avatar

**Web (ShadCN):**
- Uses Radix Avatar primitive
- Image with fallback support

**React Native:**

```typescript
const avatarSizes = {
  sm: 24,
  default: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const avatarStyles = StyleSheet.create({
  container: {
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
});
```

---

### Separator

**Web (ShadCN):**
- Uses Radix Separator primitive
- Horizontal or vertical line

**React Native:**

```typescript
const separatorStyles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
});
```

---

### Select

**Web (ShadCN):**
- Uses Radix Select primitive
- Trigger, Content, Item components

**React Native:** Use a custom picker sheet or `@react-native-picker/picker`

```typescript
const selectStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: 'transparent',
    gap: 8,
  },
  triggerText: {
    fontSize: 14,
    color: colors.foreground,
  },
  triggerPlaceholder: {
    color: colors.mutedForeground,
  },
  triggerIcon: {
    color: colors.mutedForeground,
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
    gap: 8,
  },
  itemSelected: {
    backgroundColor: colors.accent,
  },
  itemText: {
    fontSize: 14,
    color: colors.foreground,
  },
  itemCheck: {
    width: 14,
    height: 14,
  },
});
```

---

## Animation Patterns

### Fade In/Out

```typescript
const fadeIn = (value: Animated.Value, duration = 200) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

const fadeOut = (value: Animated.Value, duration = 200) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};
```

### Slide In/Out

```typescript
const slideInFromBottom = (value: Animated.Value, distance: number, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};
```

### Scale

```typescript
const scaleIn = (value: Animated.Value, duration = 200) => {
  return Animated.spring(value, {
    toValue: 1,
    useNativeDriver: true,
    tension: 65,
    friction: 10,
  });
};
```

---

## Touch Feedback

### Pressable States

```typescript
const getPressedStyle = (pressed: boolean): ViewStyle => ({
  opacity: pressed ? 0.7 : 1,
  transform: [{ scale: pressed ? 0.98 : 1 }],
});

const getHoveredStyle = (hovered: boolean): ViewStyle => ({
  backgroundColor: hovered ? colors.accent : 'transparent',
});
```

---

## Accessibility

### Required Props

```typescript
interface AccessibleButtonProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'menuitem';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
}
```

### Minimum Touch Target

```typescript
const MIN_TOUCH_SIZE = 44;

const ensureMinTouchSize = (style: ViewStyle): ViewStyle => ({
  ...style,
  minWidth: MIN_TOUCH_SIZE,
  minHeight: MIN_TOUCH_SIZE,
});
```
