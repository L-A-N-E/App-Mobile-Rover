import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, ChatBubble, Icon, PremiumGate, Screen, TypingIndicator } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { nextUpcomingTrip, Trip, useTrips } from '../contexts/TripsContext';
import { ChatMessage, chatSuggestions, getBotReply } from '../data/content';
import { getDestination } from '../data/catalog';
import { useAiStatus } from '../hooks/useAiStatus';
import { useTripWeather } from '../hooks/useTripWeather';
import { AppTabScreenProps } from '../navigation/types';
import { ChatTripContext, streamChat, stripMarkdown, warmupChat } from '../services/ai';
import { Forecast, weatherInfo } from '../services/weather';
import { addDaysISO } from '../utils/dates';
import { fonts, radii, spacing } from '../tokens';
import { isOutdoor } from '../data/catalog';
import { buildSchedule, formatClock } from '../utils/route';

// Resume a viagem atual para o modelo usar como contexto.
function tripContext(trip: Trip, forecast: Forecast | null): ChatTripContext | undefined {
  const destination = getDestination(trip.cityId);
  if (!destination) return undefined;
  return {
    title: trip.title,
    city: destination.name,
    country: destination.country,
    startDate: trip.startDate,
    days: trip.itinerary.map((day) =>
      buildSchedule(day, trip.times).map((s) => ({
        name: s.place.name,
        category: isOutdoor(s.place) ? `${s.place.category}, ar livre` : s.place.category,
        start: formatClock(s.start),
      })),
    ),
    weather: trip.itinerary.map((_, i) => {
      const w = forecast?.days[addDaysISO(trip.startDate, i)];
      if (!w) return 'sem previsão ainda';
      const rainy = w.hours.filter((h) => h.precipProb >= 50).map((h) => h.hour);
      const rainHours = rainy.length ? `, chuva provável entre ${rainy[0]}h e ${rainy[rainy.length - 1]}h` : '';
      return `${weatherInfo(w.code).label}, ${Math.round(w.tMin)}–${Math.round(w.tMax)}°C, ${Math.round(w.precipProbMax)}% de chuva${rainHours}`;
    }),
  };
}

export function ChatScreen({ navigation }: AppTabScreenProps<'Chat'>) {
  const { user } = useAuth();
  const { trips } = useTrips();
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const ai = useAiStatus();
  const isPremium = Boolean(user?.isPremium);
  const firstName = user?.name.split(' ')[0] ?? '';
  const currentTrip = nextUpcomingTrip(trips, isPremium);
  const city = currentTrip ? getDestination(currentTrip.cityId) : undefined;
  const weather = useTripWeather(currentTrip);

  // Boas-vindas sem texto fixo: é montada na renderização, no idioma atual.
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', from: 'bot', text: '' }]);
  const welcomeText = city
    ? t('chat.welcomeCity', { name: firstName, city: city.name })
    : t('chat.welcome', { name: firstName });
  const shownMessages = messages.map((m) => (m.id === 'welcome' ? { ...m, text: welcomeText } : m));
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false); // gerando resposta
  const [typing, setTyping] = useState(false); // aguardando o primeiro pedaço de texto
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Assim que a IA estiver online, pré-carrega o contexto da viagem no modelo.
  const warmTrip = currentTrip ? JSON.stringify(currentTrip.itinerary) : '';
  useEffect(() => {
    if (isPremium && ai.status === 'online') {
      warmupChat({ userName: firstName, language, trip: currentTrip ? tripContext(currentTrip, weather.forecast) : undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, ai.status, warmTrip, weather.forecast, language]);

  const statusLabel = !isPremium
    ? t('chat.locked')
    : ai.status === 'online'
      ? t('chat.online', { model: ai.model ?? '' })
      : ai.status === 'checking'
        ? t('chat.connecting')
        : t('chat.offline');
  const statusColor =
    !isPremium || ai.status === 'checking' ? colors.textTertiary : ai.status === 'online' ? colors.success : colors.accent;

  const header = (
    <View style={styles.header}>
      <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
        <Icon name="compass-outline" size={22} color={colors.onPrimary} />
      </View>
      <View style={styles.flex}>
        <AppText variant="h3">{t('chat.title')}</AppText>
        <Pressable style={styles.status} onPress={ai.status === 'offline' ? ai.recheck : undefined} hitSlop={6}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <AppText variant="caption" tone="tertiary" numberOfLines={1} style={styles.flex}>
            {statusLabel}
          </AppText>
        </Pressable>
      </View>
    </View>
  );

  if (!isPremium) {
    return (
      <Screen>
        {header}
        <View style={styles.locked}>
          <PremiumGate
            icon="chat-processing-outline"
            title={t('chat.gateTitle')}
            description={t('chat.gateText')}
            onPress={() => navigation.navigate('Premium')}
          />
        </View>
      </Screen>
    );
  }

  const appendToMessage = (id: string, text: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.text + text } : m)));

  const send = async (text = draft) => {
    const question = text.trim();
    if (!question || busy) return;

    const history = [...messages, { id: `${Date.now()}-u`, from: 'user' as const, text: question }];
    setMessages(history);
    setDraft('');
    setBusy(true);
    setTyping(true);

    const botId = `${Date.now()}-b`;
    let started = false;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        {
          messages: history
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
          context: { userName: firstName, language, trip: currentTrip ? tripContext(currentTrip, weather.forecast) : undefined },
        },
        (delta) => {
          if (!started) {
            started = true;
            setTyping(false);
            setMessages((prev) => [...prev, { id: botId, from: 'bot', text: '' }]);
          }
          appendToMessage(botId, stripMarkdown(delta));
        },
        controller.signal,
      );
      ai.setStatus('online');
    } catch {
      if (controller.signal.aborted) return;
      // IA local fora do ar: resposta simulada para o app continuar utilizável.
      ai.setStatus('offline');
      const fallback = getBotReply(question, currentTrip?.cityId ?? '', city?.name ?? t('chat.yourDestination'));
      if (started) appendToMessage(botId, t('chat.dropped'));
      else setMessages((prev) => [...prev, { id: botId, from: 'bot', text: fallback }]);
    } finally {
      setTyping(false);
      setBusy(false);
    }
  };

  const canSend = draft.trim().length > 0 && !busy;

  return (
    <Screen>
      {header}
      <FlatList
        ref={listRef}
        data={shownMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        ListFooterComponent={
          typing ? (
            <View>
              <TypingIndicator />
              <AppText variant="caption" tone="tertiary" style={styles.thinking}>
                {t('chat.reading')}
              </AppText>
            </View>
          ) : null
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {messages.length < 3 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll} contentContainerStyle={styles.suggestions}>
          {chatSuggestions().map((s) => (
            <Pressable
              key={s}
              onPress={() => send(s)}
              style={[styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <AppText variant="bodySm">{s}</AppText>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.text }]}
          onSubmitEditing={() => send()}
          returnKeyType="send"
        />
        <Pressable
          onPress={() => send()}
          disabled={!canSend}
          accessibilityLabel={t('chat.send')}
          style={[styles.send, { backgroundColor: canSend ? colors.primary : colors.surfaceAlt }]}
        >
          <Icon name="arrow-up" size={20} color={canSend ? colors.onPrimary : colors.textTertiary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  botAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  thinking: { marginLeft: 36, marginTop: -spacing.xs },
  locked: { flex: 1, justifyContent: 'center', paddingBottom: spacing.xxxl },
  listContent: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  suggestionsScroll: { marginHorizontal: -spacing.screen, flexGrow: 0, marginBottom: spacing.md },
  suggestions: { gap: spacing.sm, paddingHorizontal: spacing.screen },
  suggestion: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingLeft: spacing.xl,
    paddingRight: 6,
    height: 54,
    marginBottom: spacing.lg,
  },
  input: { flex: 1, height: '100%', fontFamily: fonts.regular, fontSize: 15, outlineStyle: 'none' } as object,
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
