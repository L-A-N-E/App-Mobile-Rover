import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { CurrentWeather, DayWeather, weatherInfo } from '../services/weather';
import { radii, spacing } from '../tokens';
import { formatShortDate } from '../utils/dates';
import { formatDecimal } from '../utils/route';
import { AppText } from './AppText';
import { Icon } from './Icon';

type Props = {
  status: 'loading' | 'ready' | 'unavailable' | 'error';
  day?: DayWeather;
  current?: CurrentWeather; // só quando o dia exibido é hoje
  cityName: string;
  impactedCount: number;
  availableFrom: string;
};

// Previsão do dia selecionado no roteiro (Open-Meteo) + resumo do impacto nas atividades.
export function WeatherCard({ status, day, current, cityName, impactedCount, availableFrom }: Props) {
  const { colors } = useTheme();
  const { t, tn } = useI18n();

  if (status === 'loading') {
    return (
      <View style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primaryText} />
        <AppText variant="bodySm" tone="secondary">
          {t('weatherCard.loading', { city: cityName })}
        </AppText>
      </View>
    );
  }

  if (status === 'error' || status === 'unavailable' || !day) {
    const message =
      status === 'error'
        ? t('weatherCard.error')
        : t('weatherCard.unavailable', { date: formatShortDate(availableFrom) });
    return (
      <View style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name={status === 'error' ? 'cloud-off-outline' : 'calendar-clock'} size={22} color={colors.textSecondary} />
        </View>
        <AppText variant="bodySm" tone="secondary" style={styles.flex}>
          {message}
        </AppText>
      </View>
    );
  }

  const info = weatherInfo(day.code);
  const now = current ? weatherInfo(current.code, current.isDay) : null;
  const affected = impactedCount > 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: affected ? colors.accent : colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Icon name={info.icon} size={26} color={colors.primaryText} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title">
            {info.label} · {Math.round(day.tMax)}° / {Math.round(day.tMin)}°
          </AppText>
          <View style={styles.facts}>
            <Fact icon="water-percent" label={t('weatherCard.rain', { value: Math.round(day.precipProbMax) })} />
            <Fact icon="weather-windy" label={`${Math.round(day.windMax)} km/h`} />
            {day.precipSum > 0 ? <Fact icon="weather-rainy" label={`${formatDecimal(day.precipSum)} mm`} /> : null}
          </View>
        </View>
      </View>

      {current && now ? (
        <View style={[styles.now, { borderTopColor: colors.border }]}>
          <Icon name={now.icon} size={16} color={colors.textSecondary} />
          <AppText variant="caption" tone="secondary">
            {t('weatherCard.now', { city: cityName, temp: Math.round(current.temp), label: now.label.toLowerCase() })}
          </AppText>
        </View>
      ) : null}

      <View style={[styles.verdict, { backgroundColor: affected ? colors.accentSoft : colors.successSoft }]}>
        <Icon name={affected ? 'alert-outline' : 'check-circle-outline'} size={16} color={affected ? colors.accentText : colors.success} />
        <AppText variant="caption" color={affected ? colors.accentText : colors.success} style={styles.flex}>
          {affected ? tn('weatherCard.affected', impactedCount) : t('weatherCard.good')}
        </AppText>
      </View>
    </View>
  );
}

function Fact({ icon, label }: { icon: 'water-percent' | 'weather-windy' | 'weather-rainy'; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={14} color={colors.textTertiary} />
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: spacing.md, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 46, height: 46, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 2 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  now: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  verdict: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: radii.sm, padding: spacing.sm },
});
