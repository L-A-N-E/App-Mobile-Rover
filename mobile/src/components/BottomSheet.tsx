import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function BottomSheet({ visible, title, subtitle, onClose, children, footer }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <View style={styles.flex}>
              <AppText variant="h3">{title}</AppText>
              {subtitle ? (
                <AppText variant="bodySm" tone="secondary" style={styles.subtitle}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <IconButton icon="close" size={36} variant="soft" onPress={onClose} accessibilityLabel={t('common.close')} />
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: {
    marginTop: 'auto',
    maxHeight: '85%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.lg,
  },
  subtitle: { marginTop: 2 },
  body: { flexShrink: 1, paddingHorizontal: spacing.screen },
  footer: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
});
