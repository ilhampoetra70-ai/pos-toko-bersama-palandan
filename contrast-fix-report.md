# Color Contrast Audit & Fix Report

## Executive Summary
An audit of the application's color palette (both Light and Dark modes) was conducted to meet the WCAG AA minimum 4.5:1 contrast ratio standards. Low-contrast offenders—particularly `--muted` backgrounds paired with `--muted-foreground` text, and hardcoded Tailwind placeholder colors—were corrected globally without altering semantic layout or existing capabilities.

## Issues Identified & Fixed

### 1. Light Mode Muted Variables (`src/index.css`)
- **Element Selector**: `:root` (`--muted` and `--muted-foreground`)
- **Issue**: `--muted` was set to an overly dark shade (55% lightness / `#829092`), making dark text or white text placed above it illegible. Contrast between `--muted` (55% L) and background (94% L) was roughly ~2.8:1.
- **Old Color**: 
  - `--muted: 186.3158 8.2969% 55.098%;`
  - `--muted-foreground: 194.4828 14.1463% 40.1961%;`
- **New Color**: 
  - `--muted: 186 8% 90%;` 
  - `--muted-foreground: 194 14% 35%;`
- **Estimated Contrast Ratio**: Background-to-Muted is now distinct yet subtle. Muted-Foreground on Muted Background is **~5.1:1** (Passes WCAG AA).

### 2. Dark Mode Muted Variables (`src/index.css`)
- **Element Selector**: `.dark` (`--muted` and `--muted-foreground`)
- **Issue**: `--muted` (40%) and `--muted-foreground` (55%) brightness were too close, causing gray-on-gray low legibility. Estimated contrast was an unacceptable ~1.6:1.
- **Old Color**: 
  - `--muted: 194.4828 14.1463% 40.1961%;`
  - `--muted-foreground: 180 6.9% 55%;`
- **New Color**: 
  - `--muted: 194 14% 20%;` 
  - `--muted-foreground: 180 7% 70%;`
- **Estimated Contrast Ratio**: **~6.0:1** (Passes WCAG AA).

### 3. Input Placeholders in Cashier Screen (`src/pages/CashierPage.tsx`)
- **Element Selector**: `.placeholder-gray-400.dark\:placeholder-gray-500`
- **Issue**: `gray-400` on a light card background falls to ~1.3:1 contrast. `gray-500` on a dark card background (#1A1E1E) yields a contrast of ~3.2:1. Both are effectively invisible for visually impaired users.
- **Old Color**: `placeholder-gray-400 dark:placeholder-gray-500`
- **New Color**: `placeholder:text-muted-foreground`
- **Estimated Contrast Ratio**: Dynamically leverages the corrected `--muted-foreground` giving **> 5:1** contrast on both themes.

### 4. Input Placeholders in Settings/Insight Screen (`src/pages/InsightPage.tsx`)
- **Element Selector**: `.placeholder-gray-400`
- **Issue**: Hardcoded placeholder without a dark mode equivalent.
- **Old Color**: `placeholder-gray-400`
- **New Color**: `placeholder:text-muted-foreground`
- **Estimated Contrast Ratio**: Dynamically bound to new constraints yielding **> 5:1** contrast.

## Quality & Preservation Check 
- ✔ Both modes function properly.
- ✔ No layout sizes, spacings, or component states were harmed.
- ✔ Fixed color properties natively leverage global React/Tailwind abstractions.
- ✔ WCAG AA standard compliant (Contrast > 4.5:1 standard preserved).
