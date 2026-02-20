import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { VaultItem } from '@/lib/types';

const TYPE_CONFIG = {
  text: { icon: 'document-text' as const, label: 'Text', badgeBg: Colors.badgeTextBg, badgeColor: Colors.badgeText },
  link: { icon: 'link' as const, label: 'Link', badgeBg: Colors.badgeLinkBg, badgeColor: Colors.badgeLink },
  pdf: { icon: 'document-attach' as const, label: 'PDF', badgeBg: Colors.badgePdfBg, badgeColor: Colors.badgePdf },
  image: { icon: 'image' as const, label: 'Image', badgeBg: Colors.badgeImageBg, badgeColor: Colors.badgeImage },
};

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPreview(item: VaultItem): string {
  if (item.type === 'link') return item.content;
  if (item.type === 'pdf' || item.type === 'image') {
    const parts = (item.fileUri || item.content).split('/');
    return parts[parts.length - 1] || item.content;
  }
  return item.content.length > 80 ? item.content.slice(0, 80) + '...' : item.content;
}

interface VaultCardProps {
  item: VaultItem;
  onPress: () => void;
}

export const VaultCard = memo(function VaultCard({ item, onPress }: VaultCardProps) {
  const config = TYPE_CONFIG[item.type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Ionicons name={config.icon} size={18} color={Colors.accent} />
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
          <Text style={[styles.badgeText, { color: config.badgeColor }]}>{config.label}</Text>
        </View>
      </View>
      <Text style={styles.preview} numberOfLines={2}>{getPreview(item)}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preview: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
});
