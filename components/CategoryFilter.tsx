import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CategoryFilter as CategoryFilterType } from '@/lib/types';

const CATEGORIES: { key: CategoryFilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid' },
  { key: 'text', label: 'Text', icon: 'document-text' },
  { key: 'link', label: 'Links', icon: 'link' },
  { key: 'pdf', label: 'PDFs', icon: 'document-attach' },
  { key: 'image', label: 'Images', icon: 'image' },
];

interface CategoryFilterProps {
  selected: CategoryFilterType;
  onChange: (category: CategoryFilterType) => void;
}

export const CategoryFilterBar = memo(function CategoryFilterBar({ selected, onChange }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map(cat => {
        const isActive = selected === cat.key;
        return (
          <Pressable
            key={cat.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(cat.key);
            }}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Ionicons
              name={cat.icon}
              size={16}
              color={isActive ? Colors.white : Colors.textMuted}
            />
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.white,
  },
});
