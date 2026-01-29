import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
  PanResponder,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SheetSide = 'top' | 'bottom' | 'left' | 'right';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContentProps {
  side?: SheetSide;
  children: React.ReactNode;
  style?: ViewStyle;
  showHandle?: boolean;
}

interface SheetHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface SheetTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface SheetFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const colors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  border: '#e4e4e7',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
};

const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { onOpenChange } = React.useContext(SheetContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: () => onOpenChange(true),
    });
  }
  
  return (
    <Pressable onPress={() => onOpenChange(true)}>
      {children}
    </Pressable>
  );
}

export function SheetContent({
  side = 'bottom',
  children,
  style,
  showHandle = true,
}: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;
  
  const openSheet = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
    ]).start();
  };
  
  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onOpenChange(false);
    });
  };
  
  useEffect(() => {
    if (open) {
      translateY.setValue(SCREEN_HEIGHT);
      openSheet();
    }
  }, [open]);
  
  if (!open) return null;
  
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSheet}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.content,
            getSideStyles(side),
            { transform: [{ translateY }] },
            style,
          ]}
          {...(side === 'bottom' ? panResponder.panHandlers : {})}
        >
          {showHandle && side === 'bottom' && (
            <View style={styles.handle} />
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function SheetHeader({ children, style }: SheetHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export function SheetTitle({ children, style }: SheetTitleProps) {
  return (
    <Text style={[styles.title, style]}>
      {children}
    </Text>
  );
}

export function SheetDescription({ children, style }: SheetDescriptionProps) {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
}

export function SheetFooter({ children, style }: SheetFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

export function SheetClose({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { onOpenChange } = React.useContext(SheetContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: () => onOpenChange(false),
    });
  }
  
  return (
    <Pressable onPress={() => onOpenChange(false)}>
      {children}
    </Pressable>
  );
}

const getSideStyles = (side: SheetSide): ViewStyle => {
  switch (side) {
    case 'top':
      return {
        top: 0,
        left: 0,
        right: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      };
    case 'left':
      return {
        top: 0,
        left: 0,
        bottom: 0,
        width: '75%',
        maxWidth: 400,
        borderRightWidth: 1,
        borderRightColor: colors.border,
      };
    case 'right':
      return {
        top: 0,
        right: 0,
        bottom: 0,
        width: '75%',
        maxWidth: 400,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
      };
    case 'bottom':
    default:
      return {
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      };
  }
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    position: 'absolute',
    backgroundColor: colors.background,
    gap: 16,
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
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 4,
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
});
