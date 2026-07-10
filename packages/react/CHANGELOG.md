# @examind/calculator-react

## 0.1.3

### Patch Changes

- 5326edb: Build both packages with a `"use client"` banner (via tsup's `banner` option) so their `dist` entry files are marked as client modules. Imported from a Next.js App Router server component, they now establish a client boundary instead of failing with a confusing hooks-in-server-component error. Core is unchanged (no React, no directive).

## 0.1.2

### Patch Changes

- 7ae00e2: Global keyboard listener no longer hijacks typing in host-page editable elements (input / textarea / select / contentEditable) or swallows Ctrl/Cmd/Alt shortcuts.

## 0.1.1

### Patch Changes

- Updated dependencies [6f42898]
  - @examind/calculator-core@0.2.0
