import { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useVault } from '@/lib/vault-context';

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { items, updateItem } = useVault();

  const item = useMemo(() => items.find(i => i.id === id), [items, id]);

  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [tags, setTags] = useState(item?.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!item) return;
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title.');
      return;
    }

    setSaving(true);
    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await updateItem(item.id, {
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  }, [item, title, content, tags, updateItem]);

  if (!item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Item not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={Colors.textMuted}
        />

        {(item.type === 'text' || item.type === 'link') && (
          <>
            <Text style={styles.sectionLabel}>{item.type === 'link' ? 'URL' : 'Content'}</Text>
            <TextInput
              style={[styles.input, item.type === 'text' && styles.textArea]}
              value={content}
              onChangeText={setContent}
              multiline={item.type === 'text'}
              textAlignVertical={item.type === 'text' ? 'top' : 'center'}
              keyboardType={item.type === 'link' ? 'url' : 'default'}
              autoCapitalize="none"
              placeholderTextColor={Colors.textMuted}
            />
          </>
        )}

        {(item.type === 'pdf' || item.type === 'image') && (
          <>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={content}
              onChangeText={setContent}
              placeholder="Description..."
              placeholderTextColor={Colors.textMuted}
            />
          </>
        )}

        <Text style={styles.sectionLabel}>Tags</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="tag1, tag2, tag3"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, saving && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.saveText}>Save Changes</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
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
    gap: 8,
  },
  notFound: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  textArea: {
    height: 160,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
});
