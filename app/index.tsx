import { useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useVault } from '@/lib/vault-context';
import { VaultCard } from '@/components/VaultCard';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilterBar } from '@/components/CategoryFilter';
import { EmptyState } from '@/components/EmptyState';
import { VaultItem } from '@/lib/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    filteredItems,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    loadItems,
    items,
  } = useVault();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      loadItems();
      hasLoaded.current = true;
    }
  }, [loadItems]);

  const handleRefresh = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const handleCardPress = useCallback((item: VaultItem) => {
    router.push({ pathname: '/detail/[id]', params: { id: item.id } });
  }, []);

  const renderItem = useCallback(({ item, index }: { item: VaultItem; index: number }) => (
    <AnimatedCard item={item} index={index} onPress={() => handleCardPress(item)} />
  ), [handleCardPress]);

  const keyExtractor = useCallback((item: VaultItem) => item.id, []);

  const ListHeader = useCallback(() => (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <View>
          <Text style={styles.headerTitle}>QuickVault</Text>
          <Text style={styles.headerSubtitle}>{items.length} item{items.length !== 1 ? 's' : ''} stored</Text>
        </View>
      </View>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      <CategoryFilterBar selected={categoryFilter} onChange={setCategoryFilter} />
    </View>
  ), [insets.top, items.length, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon={searchQuery ? 'search' : 'folder-open'}
              title={searchQuery ? 'No results found' : 'Your vault is empty'}
              subtitle={searchQuery ? 'Try a different search term' : 'Tap the + button to add your first item'}
            />
          )
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
        scrollEnabled={!!filteredItems.length || !!searchQuery}
      />
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/add');
        }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16 },
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>
    </View>
  );
}

function AnimatedCard({ item, index, onPress }: { item: VaultItem; index: number; onPress: () => void }) {
  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(index * 50).springify() : undefined}>
      <VaultCard item={item} onPress={onPress} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  listContent: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },
});
