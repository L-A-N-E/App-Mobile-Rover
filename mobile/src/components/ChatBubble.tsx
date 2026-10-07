import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { ChatMessage } from '../data/content';
import { radii, spacing } from '../tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const { colors } = useTheme();
  const isUser = message.from === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser ? (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Icon name="compass-outline" size={16} color={colors.onPrimary} />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.user, { backgroundColor: colors.primary }]
            : [styles.bot, { backgroundColor: colors.surface, borderColor: colors.border }],
        ]}
      >
        <AppText variant="body" color={isUser ? colors.onPrimary : colors.text}>
          {message.text}
        </AppText>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  const { colors } = useTheme();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Icon name="compass-outline" size={16} color={colors.onPrimary} />
      </View>
      <View style={[styles.bubble, styles.bot, styles.typing, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.textTertiary, opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
  rowUser: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bot: { borderWidth: 1, borderRadius: radii.lg, borderBottomLeftRadius: 6 },
  user: { borderRadius: radii.lg, borderBottomRightRadius: 6 },
  typing: { flexDirection: 'row', gap: 5, paddingVertical: 16 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
