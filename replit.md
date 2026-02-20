# QuickVault

## Overview
QuickVault is a personal offline productivity vault built with Expo React Native. It allows users to securely store links, text snippets, PDFs, and images with biometric/PIN authentication.

## Recent Changes
- 2026-02-20: Initial build with auth, home, add, detail, and edit screens

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **State Management**: React Context (VaultProvider) + AsyncStorage for persistence
- **Authentication**: expo-local-authentication (biometric) with PIN fallback
- **File Storage**: expo-file-system (copies files to app's internal vault directory)
- **Styling**: Dark theme (#0F172A background, #6366F1 accent), Inter font family

## Key Files
- `app/_layout.tsx` - Root layout with auth gate, fonts, providers
- `app/auth.tsx` - Biometric/PIN authentication screen
- `app/index.tsx` - Home screen with search, filters, card list
- `app/add.tsx` - Add new item form (text/link/pdf/image)
- `app/detail/[id].tsx` - Item detail view with actions
- `app/edit.tsx` - Edit existing item
- `lib/vault-context.tsx` - Vault state management context
- `lib/storage.ts` - AsyncStorage + file system operations
- `lib/types.ts` - TypeScript type definitions
- `components/VaultCard.tsx` - Item card component
- `components/SearchBar.tsx` - Search input component
- `components/CategoryFilter.tsx` - Category filter chips
- `components/EmptyState.tsx` - Empty state display

## Data Model
```
VaultItem {
  id: string (UUID)
  title: string
  type: 'text' | 'link' | 'pdf' | 'image'
  content: string
  fileUri?: string
  tags?: string[]
  createdAt: number (timestamp)
}
```

## Workflows
- Start Backend: Express server on port 5000 (landing page + API)
- Start Frontend: Expo dev server on port 8081
