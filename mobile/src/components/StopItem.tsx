import { Pressable, StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { categoryIcons, categoryLabel, isOutdoor } from '../data/catalog';
import { HourWeather, weatherInfo } from '../services/weather';
import { radii, shadows, spacing } from '../tokens';
import { formatClock, formatDuration, formatKm, ScheduledStop } from '../utils/route';
import { StopImpact } from '../utils/weatherImpact';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

type Props = {
  stop: ScheduledStop;
  index: number;
  isLast: boolean;
  editing: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  weather?: HourWeather; // previsão no horário de início da parada
  impact?: StopImpact; // clima prejudica esta atividade ao ar livre
  swapLabel?: string; // nome da alternativa coberta sugerida
  onSwap?: () => void;
  onEditTime?: () => void; // abre o seletor de horário da parada
};

// Item da linha do tempo do roteiro: horário, número da parada e deslocamento até a próxima.
export function StopItem({ stop, index, isLast, editing, onMoveUp, onMoveDown, onRemove, weather, impact, swapLabel, onSwap, onEditTime }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { place } = stop;
  const outdoor = isOutdoor(place);
  const severe = impact?.severity === 'alerta';
  const impactColor = severe ? colors.danger : colors.accentText;
  const impactBg = severe ? colors.dangerSoft : colors.accentSoft;

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.marker, { backgroundColor: colors.primary, borderColor: colors.primarySoft }]}>
          <AppText variant="caption" color={colors.onPrimary}>
            {index + 1}
          </AppText>
        </View>
        {!isLast ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.card,
            shadows.sm,
            {
              backgroundColor: colors.surface,
              borderColor: editing ? colors.primary : impact ? impactColor : colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.cardRow}>
          <View style={[styles.categoryIcon, { backgroundColor: colors.primarySoft }]}>
            <Icon name={categoryIcons[place.category]} size={20} color={colors.primaryText} />
          </View>
          <View style={styles.info}>
            <View style={styles.timeRow}>
              <Pressable
                onPress={onEditTime}
                disabled={!onEditTime}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('stop.timeA11y', { name: place.name, time: formatClock(stop.start) })}
                style={({ pressed }) => [
                  styles.timeButton,
                  onEditTime && { backgroundColor: pressed ? colors.accentSoft : colors.surfaceAlt },
                ]}
              >
                {stop.fixed ? <Icon name="pin-outline" size={12} color={colors.accentText} /> : null}
                <AppText variant="caption" tone="accent">
                  {formatClock(stop.start)} – {formatClock(stop.end)}
                </AppText>
                {onEditTime ? <Icon name="pencil-outline" size={12} color={colors.accentText} /> : null}
              </Pressable>
              {weather ? (
                <View style={styles.weatherChip}>
                  <Icon name={weatherInfo(weather.code).icon} size={14} color={colors.textSecondary} />
                  <AppText variant="caption" tone="secondary">
                    {Math.round(weather.temp)}°{weather.precipProb >= 20 ? ` · ${Math.round(weather.precipProb)}%` : ''}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="title" numberOfLines={2}>
              {place.name}
            </AppText>
            <AppText variant="caption" tone="tertiary">
              {categoryLabel(place.category)} · {formatDuration(place.durationMin)}
              {outdoor ? ` · ${t('stop.outdoor')}` : ''}
              {place.source === 'ai' ? ` · ${t('stop.ai')}` : ''}
            </AppText>
            {stop.conflict ? (
              <View style={styles.conflict}>
                <Icon name="clock-alert-outline" size={13} color={colors.danger} />
                <AppText variant="caption" color={colors.danger} style={styles.flex}>
                  {t('stop.conflict')}
                </AppText>
              </View>
            ) : null}
          </View>

          {editing ? (
            <View style={styles.editActions}>
              <View style={styles.reorder}>
                <IconButton
                  icon="chevron-up"
                  size={30}
                  variant="soft"
                  disabled={!onMoveUp}
                  onPress={onMoveUp}
                  accessibilityLabel={t('stop.moveUp', { name: place.name })}
                />
                <IconButton
                  icon="chevron-down"
                  size={30}
                  variant="soft"
                  disabled={!onMoveDown}
                  onPress={onMoveDown}
                  accessibilityLabel={t('stop.moveDown', { name: place.name })}
                />
              </View>
              <IconButton
                icon="delete-outline"
                size={30}
                variant="soft"
                onPress={onRemove}
                accessibilityLabel={t('stop.remove', { name: place.name })}
                style={{ backgroundColor: colors.dangerSoft }}
              />
            </View>
          ) : null}
          </View>

          {impact && !editing ? (
            <View style={[styles.impact, { backgroundColor: impactBg }]}>
              <View style={styles.impactText}>
                <Icon name={severe ? 'alert' : 'weather-pouring'} size={16} color={impactColor} />
                <AppText variant="caption" color={impactColor} style={styles.flex}>
                  {t('stop.impact', { detail: impact.detail })}
                </AppText>
              </View>
              {onSwap && swapLabel ? (
                <Button title={t('stop.swap', { name: swapLabel })} icon="swap-horizontal" size="sm" variant="secondary" onPress={onSwap} style={styles.swap} />
              ) : null}
            </View>
          ) : null}
        </View>

        {!isLast && stop.toNextKm !== undefined ? (
          <View style={styles.travel}>
            <Icon name="walk" size={14} color={colors.textTertiary} />
            <AppText variant="caption" tone="tertiary">
              {t('stop.toNext', { km: formatKm(stop.toNextKm), min: stop.toNextMin ?? 0 })}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 32, alignItems: 'center' },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  line: { width: 2, flex: 1, marginTop: spacing.xs, borderRadius: 1 },
  content: { flex: 1, paddingLeft: spacing.sm },
  flex: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: -6,
  },
  conflict: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 2 },
  weatherChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  impact: { borderRadius: radii.sm, padding: spacing.sm, gap: spacing.sm },
  impactText: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  swap: { alignSelf: 'flex-start' },
  categoryIcon: { width: 42, height: 42, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reorder: { gap: spacing.xs },
  travel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.md, paddingLeft: spacing.xs },
});
