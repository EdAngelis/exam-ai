import { Button } from '@/components/atoms/button';

export type GoogleSignInButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * Presentation-only "Continue with Google" button. The OAuth flow lives in the
 * useGoogleAuth hook; this component just renders and delegates the press.
 */
export function GoogleSignInButton({
  onPress,
  disabled,
  loading,
}: GoogleSignInButtonProps) {
  return (
    <Button
      title="Continue with Google"
      variant="secondary"
      size="full"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
    />
  );
}
