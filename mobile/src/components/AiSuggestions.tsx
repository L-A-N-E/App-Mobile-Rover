import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { categoryIcons, categoryLabel, getCityCenter, getDestination } from '../data/catalog';
import { AiSuggestion, API_URL, fetchSuggestions } from '../services/ai';
import { radii, spacing } from '../tokens';
import { formatDuration } from '../utils/route';
import { AppText } from './AppText';
import { Button } from './Button';
import { Badge } from './Chip';
import { Icon } from './Icon';

type Props = {
  cityId: string;
  existingNames: string[];
  interests: string[];
  isPremium: boolean;
  onAdd: (suggestion: AiSuggestion) => void;
  onUpgrade: () => void;
};

type State = { status: 'idle' | 'loading' | 'done' | 'error'; items: AiSuggestion[] };

// Sugestões de locais geradas pelo Llama local (via backend).
export function AiSuggestions({ cityId, existingNames, interests, isPremium, onAdd, onUpgrade }: Props) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const [state, setState] = useState<State>({ status: 'idle', items: [] });
  const [added, setAdded] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!isPremium) {
    return (
      <View style={[styles.box, { backgroundColor: colors.accentSoft }]}>
        <Icon name="creation-outline" size={28} color={colors.accentText} />
        <AppText variant="title" align="center" style={styles.boxTitle}>
          {t('ai.premiumTitle')}
        </AppText>
        <AppText variant="bodySm" tone="secondary" align="center">
          {t('ai.premiumText')}
        </AppText>
        <Button title={t('premium.knowMore')} variant="accent" icon="crown" size="sm" onPress={onUpgrade} style={styles.boxButton} />
      </View>
    );
  }

  const generate = async () => {
    const destination = getDestination(cityId);
    if (!destination) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'loading', items: [] });
    try {
      const items = await fetchSuggestions(
        {
          city: { name: destination.name, country: destination.country, ...getCityCenter(cityId) },
          existing: existingNames,
          interests,
          language,
        },
        controller.signal,
      );
      setState({ status: 'done', items });
    } catch {
      if (!controller.signal.aborted) setState({ status: 'error', items: [] });
    }
  };

  if (state.status === 'idle') {
    return (
      <View style={[styles.box, { backgroundColor: colors.primarySoft }]}>
        <Icon name="creation-outline" size={28} color={colors.primaryText} />
        <AppText variant="title" align="center" style={styles.boxTitle}>
          {t('ai.askTitle')}
        </AppText>
        <AppText variant="bodySm" tone="secondary" align="center">
          {t('ai.askText')}
        </AppText>
        <Button title={t('ai.generate')} icon="creation-outline" size="sm" onPress={generate} style={styles.boxButton} />
      </View>
    );
  }

  if (state.status === 'loading') {
    return (
      <View style={[styles.box, { backgroundColor: colors.primarySoft }]}>
        <ActivityIndicator color={colors.primaryText} />
        <AppText variant="title" align="center" style={styles.boxTitle}>
          {t('ai.thinking')}
        </AppText>
        <AppText variant="bodySm" tone="secondary" align="center">
          {t('ai.thinkingText')}
        </AppText>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={[styles.box, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="lan-disconnect" size={28} color={colors.danger} />
        <AppText variant="title" align="center" style={styles.boxTitle}>
          {t('ai.offlineTitle')}
        </AppText>
        <AppText variant="bodySm" tone="secondary" align="center">
          {t('ai.offlineText', { url: API_URL })}
        </AppText>
        <Button title={t('common.tryAgain')} variant="secondary" icon="refresh" size="sm" onPress={generate} style={styles.boxButton} />
      </View>
    );
  }

  return (
    <View>
      {state.items.length ? (
        state.items.map((item) => {
          const isAdded = added.includes(item.name);
          return (
            <Pressable
              key={item.name}
              disabled={isAdded}
              onPress={() => {
                setAdded((a) => [...a, item.name]);
                onAdd(item);
              }}
              style={({ pressed }) => [
                styles.row,
                { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
                <Icon name={categoryIcons[item.category] ?? 'map-marker-outline'} size={20} color={colors.accentText} />
              </View>
              <View style={styles.flex}>
                <AppText variant="title">{item.name}</AppText>
                {item.reason ? (
                  <AppText variant="bodySm" tone="secondary">
                    {item.reason}
                  </AppText>
                ) : null}
                <View style={styles.meta}>
                  <Badge label={t('ai.badge')} icon="creation-outline" tone="accent" />
                  <AppText variant="caption" tone="tertiary">
                    {categoryLabel(item.category)} · {formatDuration(item.durationMin)}
                    {item.approximate ? ` · ${t('ai.approximate')}` : ''}
                  </AppText>
                </View>
              </View>
              <Icon name={isAdded ? 'check-circle' : 'plus'} size={22} color={isAdded ? colors.success : colors.primary} />
            </Pressable>
          );
        })
      ) : (
        <AppText variant="body" tone="secondary" align="center" style={styles.empty}>
          {t('ai.none')}
        </AppText>
      )}
      <Button title={t('ai.again')} variant="ghost" icon="refresh" size="sm" onPress={generate} style={styles.again} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  box: { alignItems: 'center', borderRadius: radii.md, padding: spacing.xl, gap: spacing.xs },
  boxTitle: { marginTop: spacing.sm },
  boxButton: { marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  empty: { paddingVertical: spacing.xl },
  again: { alignSelf: 'center' },
});
