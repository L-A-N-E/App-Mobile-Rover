import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { radii, shadows, spacing } from '../tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  icon?: IconName;
  tone?: 'default' | 'danger' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

// Substitui o Alert nativo por um diálogo com a identidade do app (funciona também no web).
export function Dialog({
  visible,
  title,
  message,
  icon,
  tone = 'default',
  confirmLabel: confirmLabelProp,
  cancelLabel: cancelLabelProp,
  onConfirm,
  onCancel,
  children,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const confirmLabel = confirmLabelProp ?? t('common.confirm');
  const cancelLabel = cancelLabelProp ?? t('common.cancel');
  const iconLook = {
    default: { bg: colors.primarySoft, fg: colors.primaryText },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    success: { bg: colors.successSoft, fg: colors.success },
  }[tone];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onCancel}>
        <Pressable style={[styles.card, shadows.lg, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          {icon ? (
            <View style={[styles.icon, { backgroundColor: iconLook.bg }]}>
              <Icon name={icon} size={26} color={iconLook.fg} />
            </View>
          ) : null}
          <AppText variant="h3" align="center">
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" tone="secondary" align="center" style={styles.message}>
              {message}
            </AppText>
          ) : null}
          {children}
          <View style={styles.actions}>
            {onConfirm ? (
              <>
                <Button title={cancelLabel} variant="secondary" onPress={onCancel} style={styles.action} />
                <Button
                  title={confirmLabel}
                  variant={tone === 'danger' ? 'danger' : 'primary'}
                  onPress={onConfirm}
                  style={styles.action}
                />
              </>
            ) : (
              <Button title={cancelLabel} onPress={onCancel} style={styles.action} />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  card: { width: '100%', maxWidth: 380, borderRadius: radii.xl, padding: spacing.xxl },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  message: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  action: { flex: 1, paddingHorizontal: spacing.md },
});
