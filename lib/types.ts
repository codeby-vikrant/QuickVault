export type ItemType = 'text' | 'link' | 'pdf' | 'image';

export interface VaultItem {
  id: string;
  title: string;
  type: ItemType;
  content: string;
  fileUri?: string;
  tags?: string[];
  createdAt: number;
}

export type CategoryFilter = 'all' | ItemType;
