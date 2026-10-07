import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { spacing } from '../tokens';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

type Props = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
};

// Cabeçalho padrão: ações no topo (voltar / ação à direita) + título grande.
export function ScreenHeader({ title, subtitle, eyebrow, onBack, right }: Props) {
  const { t } = useI18n();
  const hasActions = Boolean(onBack || right);

  return (
    <View style={styles.container}>
      {hasActions ? (
        <View style={styles.actions}>
          {onBack ? <IconButton icon="arrow-left" onPress={onBack} accessibilityLabel={t('common.back')} /> : <View />}
          {right}
        </View>
      ) : null}
      {title ? (
        <View style={hasActions ? styles.textsWithActions : undefined}>
          {eyebrow ? (
            <AppText variant="overline" tone="accent" style={styles.eyebrow}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="h1">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" tone="secondary" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.md, marginBottom: spacing.xxl },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textsWithActions: { marginTop: spacing.xxl },
  eyebrow: { marginBottom: spacing.xs },
  subtitle: { marginTop: spacing.xs },
});
