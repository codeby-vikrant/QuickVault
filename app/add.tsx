import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useVault } from '@/lib/vault-context';
import { ItemType } from '@/lib/types';
import { copyFileToVault } from '@/lib/storage';

const TYPES: { key: ItemType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'text', label: 'Text', icon: 'document-text' },
  { key: 'link', label: 'Link', icon: 'link' },
  { key: 'pdf', label: 'PDF', icon: 'document-attach' },
  { key: 'image', label: 'Image', icon: 'image' },
];

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const { addItem } = useVault();
  const [selectedType, setSelectedType] = useState<ItemType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      const name = asset.fileName || asset.uri.split('/').pop() || 'image.jpg';
      setFileName(name);
      if (!title) setTitle(name.split('.')[0]);
    }
  }, [title]);

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name);
        if (!title) setTitle(asset.name.replace('.pdf', ''));
      }
    } catch {}
  }, [title]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for this item.');
      return;
    }

    if (selectedType === 'text' && !content.trim()) {
      Alert.alert('Content Required', 'Please enter some text content.');
      return;
    }

    if (selectedType === 'link' && !content.trim()) {
      Alert.alert('URL Required', 'Please enter a URL.');
      return;
    }

    if ((selectedType === 'pdf' || selectedType === 'image') && !fileUri) {
      Alert.alert('File Required', `Please select a ${selectedType === 'pdf' ? 'PDF' : 'image'}.`);
      return;
    }

    setSaving(true);
    try {
      let savedFileUri = fileUri;
      if (fileUri && (selectedType === 'pdf' || selectedType === 'image')) {
        savedFileUri = await copyFileToVault(fileUri, fileName || 'file');
      }

      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await addItem({
        title: title.trim(),
        type: selectedType,
        content: selectedType === 'pdf' || selectedType === 'image' ? (content.trim() || fileName) : content.trim(),
        fileUri: savedFileUri || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Error', err?.message || 'Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [title, content, selectedType, fileUri, fileName, tags, addItem]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeGrid}>
          {TYPES.map(t => {
            const isActive = selectedType === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedType(t.key);
                  setFileUri('');
                  setFileName('');
                  setContent('');
                }}
                style={[styles.typeCard, isActive && styles.typeCardActive]}
              >
                <Ionicons name={t.icon} size={24} color={isActive ? Colors.white : Colors.textMuted} />
                <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title..."
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {selectedType === 'text' && (
          <>
            <Text style={styles.sectionLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter text snippet..."
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </>
        )}

        {selectedType === 'link' && (
          <>
            <Text style={styles.sectionLabel}>URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}

        {selectedType === 'pdf' && (
          <>
            <Text style={styles.sectionLabel}>PDF File</Text>
            <Pressable
              onPress={pickDocument}
              style={({ pressed }) => [styles.filePicker, pressed && styles.filePickerPressed]}
            >
              <Ionicons name={fileUri ? 'document-attach' : 'cloud-upload'} size={24} color={fileUri ? Colors.accent : Colors.textMuted} />
              <Text style={[styles.filePickerText, fileUri ? styles.filePickerTextActive : null]}>
                {fileName || 'Select a PDF file'}
              </Text>
            </Pressable>
            <Text style={styles.sectionLabel}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description..."
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
            />
          </>
        )}

        {selectedType === 'image' && (
          <>
            <Text style={styles.sectionLabel}>Image</Text>
            <Pressable
              onPress={pickImage}
              style={({ pressed }) => [styles.filePicker, pressed && styles.filePickerPressed]}
            >
              <Ionicons name={fileUri ? 'image' : 'cloud-upload'} size={24} color={fileUri ? Colors.accent : Colors.textMuted} />
              <Text style={[styles.filePickerText, fileUri ? styles.filePickerTextActive : null]}>
                {fileName || 'Select an image'}
              </Text>
            </Pressable>
            <Text style={styles.sectionLabel}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description..."
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
            />
          </>
        )}

        <Text style={styles.sectionLabel}>Tags (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="tag1, tag2, tag3"
          placeholderTextColor={Colors.textMuted}
          value={tags}
          onChangeText={setTags}
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
              <Text style={styles.saveText}>Save Item</Text>
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
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  typeCardActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },
  typeLabelActive: {
    color: Colors.white,
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
    height: 140,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  filePickerPressed: {
    opacity: 0.8,
  },
  filePickerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    flex: 1,
  },
  filePickerTextActive: {
    color: Colors.text,
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
