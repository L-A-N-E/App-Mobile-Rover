import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { fonts, radii, spacing } from '../tokens';
import { addDaysISO, diffDays, formatDateRange, monthsLong, parseISODate, toISODate, todayISO, weekdaysShort } from '../utils/dates';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export type DateRange = { start: string; end: string };

type Props = {
  value: DateRange | null;
  onChange: (range: DateRange) => void;
  maxDays: number;
  onExceedMax?: () => void; // ex.: plano gratuito tentando escolher mais de 1 dia
};

// Calendário de intervalo: 1º toque define a ida, 2º a volta. Tocar antes da ida recomeça.
// Com maxDays = 1 (Day Trip) cada toque escolhe o dia, sem etapa de volta.
export function DateRangePicker({ value, onChange, maxDays, onExceedMax }: Props) {
  const { colors } = useTheme();
  const { t, tn } = useI18n();
  const today = todayISO();
  const [month, setMonth] = useState(() => {
    const base = parseISODate(value?.start ?? today);
    return new Date(base.getFullYear(), base.getMonth(), 1, 12);
  });
  // true enquanto o usuário escolheu só a ida e falta a volta
  const [pickingEnd, setPickingEnd] = useState(false);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(month.getFullYear(), month.getMonth(), i + 1, 12)));
    return [...blanks, ...days];
  }, [month]);

  const isCurrentMonth = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();

  const singleDay = maxDays <= 1;

  const handlePress = (iso: string) => {
    if (singleDay) {
      onChange({ start: iso, end: iso });
      return;
    }
    if (!value || !pickingEnd || iso < value.start) {
      onChange({ start: iso, end: iso });
      setPickingEnd(true);
      return;
    }
    const length = diffDays(value.start, iso) + 1;
    if (length > maxDays) {
      onChange({ start: value.start, end: addDaysISO(value.start, maxDays - 1) });
      onExceedMax?.(); // depois do onChange, para o aviso não ser limpo pelo próprio onChange
    } else {
      onChange({ start: value.start, end: iso });
    }
    setPickingEnd(false);
  };

  const days = value ? diffDays(value.start, value.end) + 1 : 0;

  return (
    <View>
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          variant="soft"
          size={36}
          disabled={isCurrentMonth}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}
          accessibilityLabel={t('dates.prevMonth')}
        />
        <AppText variant="title">
          {monthsLong()[month.getMonth()]} {month.getFullYear()}
        </AppText>
        <IconButton
          icon="chevron-right"
          variant="soft"
          size={36}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}
          accessibilityLabel={t('dates.nextMonth')}
        />
      </View>

      <View style={styles.week}>
        {weekdaysShort().map((d, i) => (
          <Text key={i} style={[styles.weekday, { color: colors.textTertiary }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={`b${i}`} style={styles.cell} />;
          const past = iso < today;
          const isStart = value?.start === iso;
          const isEnd = value?.end === iso;
          const inRange = Boolean(value && iso > value.start && iso < value.end);
          const selected = isStart || isEnd;
          const rangeBg = colors.primarySoft;

          return (
            <View key={iso} style={styles.cell}>
              {/* faixa contínua do intervalo por trás dos círculos */}
              {value && value.start !== value.end && (inRange || isStart || isEnd) ? (
                <View
                  style={[
                    styles.band,
                    { backgroundColor: rangeBg },
                    isStart && styles.bandStart,
                    isEnd && styles.bandEnd,
                  ]}
                />
              ) : null}
              <Pressable
                disabled={past}
                onPress={() => handlePress(iso)}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: past }}
                accessibilityLabel={iso}
                style={[styles.day, selected && { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: selected ? colors.onPrimary : past ? colors.border : inRange ? colors.primaryText : colors.text },
                    iso === today && !selected && { fontFamily: fonts.extraBold, color: colors.accentText },
                  ]}
                >
                  {parseISODate(iso).getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={[styles.summary, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="calendar-range" size={18} color={colors.primaryText} />
        <AppText variant="label" style={styles.flex}>
          {value
            ? `${formatDateRange(value.start, days)} · ${tn('unit.day', days)}`
            : singleDay
              ? t('dates.pickDay')
              : t('dates.pickStart')}
        </AppText>
        {pickingEnd && !singleDay ? (
          <AppText variant="caption" tone="tertiary">
            {t('dates.tapEnd')}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const CELL = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  week: { flexDirection: 'row' },
  weekday: { width: CELL, textAlign: 'center', fontFamily: fonts.semiBold, fontSize: 12, paddingVertical: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: 44, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0, top: 4, bottom: 4 },
  bandStart: { left: '50%' },
  bandEnd: { right: '50%' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.medium, fontSize: 14 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
