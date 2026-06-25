import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'default' | 'full';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * Reusable pressable button. Theme-driven (works in light/dark unchanged);
 * new looks are added through the `variant`/`size` props rather than new
 * components. Holds no business logic — callers pass `onPress`.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  const backgroundColor = isPrimary ? theme.text : theme.backgroundElement;
  const textColor = isPrimary ? 'background' : 'text';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor },
        size === 'full' && styles.full,
        (pressed || isDisabled) && styles.dimmed,
        style as object,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.background : theme.text} />
      ) : (
        <ThemedText type="smallBold" themeColor={textColor}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: {
    alignSelf: 'stretch',
  },
  dimmed: {
    opacity: 0.6,
  },
});
