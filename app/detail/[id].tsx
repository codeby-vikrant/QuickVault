import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useVault } from '@/lib/vault-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { items, deleteItem } = useVault();

  const item = useMemo(() => items.find(i => i.id === id), [items, id]);

  const handleCopy = useCallback(async () => {
    if (!item) return;
    await Clipboard.setStringAsync(item.type === 'link' ? item.content : item.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Content copied to clipboard.');
  }, [item]);

  const handleOpenLink = useCallback(async () => {
    if (!item) return;
    let url = item.content;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open this link.');
    }
  }, [item]);

  const handleShare = useCallback(async () => {
    if (!item) return;
    try {
      if (item.fileUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(item.fileUri);
      } else {
        await Clipboard.setStringAsync(item.content);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Copied', 'Content copied to clipboard for sharing.');
      }
    } catch {
      Alert.alert('Error', 'Could not share this item.');
    }
  }, [item]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!item) return;
            await deleteItem(item.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }, [item, deleteItem]);

  const handleEdit = useCallback(() => {
    if (!item) return;
    router.push({ pathname: '/edit', params: { id: item.id } });
  }, [item]);

  if (!item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Item not found</Text>
      </View>
    );
  }

  const TYPE_LABELS: Record<string, string> = {
    text: 'Text Snippet',
    link: 'Link',
    pdf: 'PDF Document',
    image: 'Image',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.typeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{TYPE_LABELS[item.type]}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.contentCard}>
          {item.type === 'text' && (
            <Text style={styles.contentText} selectable>{item.content}</Text>
          )}

          {item.type === 'link' && (
            <View style={styles.linkContainer}>
              <Ionicons name="globe-outline" size={20} color={Colors.accentLight} />
              <Text style={styles.linkText} selectable numberOfLines={3}>{item.content}</Text>
            </View>
          )}

          {item.type === 'image' && item.fileUri && (
            <Image
              source={{ uri: item.fileUri }}
              style={styles.imagePreview}
              contentFit="contain"
              transition={300}
            />
          )}

          {item.type === 'pdf' && (
            <View style={styles.pdfContainer}>
              <Ionicons name="document-attach" size={48} color={Colors.accent} />
              <Text style={styles.pdfFileName}>{item.content || 'PDF Document'}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsGrid}>
          {(item.type === 'text' || item.type === 'link') && (
            <ActionButton
              icon="copy-outline"
              label="Copy"
              onPress={handleCopy}
            />
          )}
          {item.type === 'link' && (
            <ActionButton
              icon="open-outline"
              label="Open"
              onPress={handleOpenLink}
            />
          )}
          <ActionButton
            icon="share-outline"
            label="Share"
            onPress={handleShare}
          />
          <ActionButton
            icon="create-outline"
            label="Edit"
            onPress={handleEdit}
          />
          <ActionButton
            icon="trash-outline"
            label="Delete"
            onPress={handleDelete}
            danger
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ActionButton({ icon, label, onPress, danger }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        danger && styles.actionBtnDanger,
        pressed && styles.actionBtnPressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={danger ? Colors.danger : Colors.accent} />
      <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  notFound: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  contentCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  contentText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    lineHeight: 24,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  linkText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.accentLight,
    flex: 1,
    lineHeight: 22,
  },
  imagePreview: {
    width: '100%',
    height: SCREEN_WIDTH - 80,
    borderRadius: 12,
  },
  pdfContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  pdfFileName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionBtnDanger: {
    borderColor: 'rgba(239,68,68,0.3)',
  },
  actionBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  actionLabelDanger: {
    color: Colors.danger,
  },
});
