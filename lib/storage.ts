import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { VaultItem } from './types';

const ITEMS_KEY = '@quickvault_items';
const PIN_KEY = '@quickvault_pin';

export async function getAllItems(): Promise<VaultItem[]> {
  const raw = await AsyncStorage.getItem(ITEMS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as VaultItem[];
}

export async function saveItems(items: VaultItem[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export async function addItem(item: Omit<VaultItem, 'id' | 'createdAt'>): Promise<VaultItem> {
  const items = await getAllItems();
  const newItem: VaultItem = {
    ...item,
    id: Crypto.randomUUID(),
    createdAt: Date.now(),
  };
  items.unshift(newItem);
  await saveItems(items);
  return newItem;
}

export async function updateItem(id: string, updates: Partial<VaultItem>): Promise<VaultItem | null> {
  const items = await getAllItems();
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  await saveItems(items);
  return items[index];
}

export async function deleteItem(id: string): Promise<void> {
  const items = await getAllItems();
  const item = items.find(i => i.id === id);
  if (item?.fileUri && Platform.OS !== 'web') {
    try {
      const FileSystem = await import('expo-file-system/legacy');
      const info = await FileSystem.getInfoAsync(item.fileUri);
      if (info.exists) {
        await FileSystem.deleteAsync(item.fileUri);
      }
    } catch {}
  }
  const filtered = items.filter(i => i.id !== id);
  await saveItems(filtered);
}

export async function copyFileToVault(sourceUri: string, fileName: string): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }

  const FileSystem = await import('expo-file-system/legacy');
  const VAULT_DIR = `${FileSystem.documentDirectory}vault/`;

  const dirInfo = await FileSystem.getInfoAsync(VAULT_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
  }

  const ext = fileName.split('.').pop() || '';
  const uniqueName = `${Crypto.randomUUID()}.${ext}`;
  const destUri = `${VAULT_DIR}${uniqueName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export async function getPin(): Promise<string | null> {
  return AsyncStorage.getItem(PIN_KEY);
}

export async function setPin(pin: string): Promise<void> {
  await AsyncStorage.setItem(PIN_KEY, pin);
}

export async function hasPin(): Promise<boolean> {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return pin !== null;
}
