# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Campaign Overview

This is a Sui dApp starter template built with React, TypeScript, and Vite. The
application demonstrates basic Sui blockchain wallet connectivity and object
querying functionality using the @mysten/dapp-kit.

## Development Commands

### Package Management

- Install dependencies: `pnpm install`
- Development server: `pnpm dev` (starts Vite dev server)
- Build for production: `pnpm build` (runs TypeScript compilation then Vite
  build)
- Preview production build: `pnpm preview`

### Code Quality

- Lint code: `pnpm lint` (ESLint with TypeScript rules)
- TypeScript check: `tsc --noEmit` (manual type checking without build)

Note: There are no test scripts configured in this project.

## Architecture

### Core Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin for fast compilation
- **Styling**: Radix UI themes with CSS-in-JS, includes dark theme by default
- **Blockchain Integration**: Sui blockchain via @mysten/dapp-kit and
  @mysten/sui
- **State Management**: TanStack React Query for server state, built-in wallet
  state from dapp-kit
- **Package Manager**: pnpm (lock file present)

### Campaign Structure

```
src/
├── main.tsx           # App entry point with providers setup
├── App.tsx            # Main app component with header and layout
├── networkConfig.ts   # Sui network configuration (devnet, testnet, mainnet)
├── WalletStatus.tsx   # Wallet connection status display
├── OwnedObjects.tsx   # Display objects owned by connected wallet
└── vite-env.d.ts      # Vite type definitions
```

### Provider Hierarchy

The app is wrapped with multiple providers in this order (from outer to inner):

1. `React.StrictMode`
2. `Theme` (Radix UI with dark appearance)
3. `QueryClientProvider` (TanStack React Query)
4. `SuiClientProvider` (Sui network client, defaults to testnet)
5. `WalletProvider` (Wallet connection with autoConnect enabled)

### Key Components

- **App.tsx**: Main layout with sticky header containing title and ConnectButton
- **WalletStatus.tsx**: Shows wallet connection status and current account
  address
- **OwnedObjects.tsx**: Queries and displays objects owned by the connected
  wallet using useSuiClientQuery hook

### Network Configuration

- Supports three networks: devnet, testnet (default), and mainnet
- Network URLs are obtained via `getFullnodeUrl()` from @mysten/sui
- Network switching utilities available via `useNetworkVariable` and
  `useNetworkVariables`

### Styling Approach

- Uses Radix UI components for consistent design system
- Dark theme configured by default in both HTML and Theme provider
- Custom CSS reset included in index.html
- No custom CSS files or Tailwind configuration present

## Development Notes

### TypeScript Configuration

- Strict mode enabled with additional linting rules (noUnusedLocals,
  noUnusedParameters)
- Modern ES2020 target with bundler module resolution
- React JSX transform configured

### Code Style

- Prettier configured with `proseWrap: "always"`
- ESLint with TypeScript, React, and React Refresh plugins
- No additional style guides or formatters configured

### Wallet Integration

- Auto-connect enabled by default
- Supports standard Sui wallet providers
- Wallet state managed by @mysten/dapp-kit
- Network switching handled automatically by provider setup

When working on this codebase, maintain the existing patterns of using Radix UI
components, the established provider hierarchy, and the hooks-based approach for
blockchain interactions.
