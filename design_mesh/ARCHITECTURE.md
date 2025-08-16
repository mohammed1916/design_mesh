# Design Mesh - Modular Architecture

The App.tsx has been refactored into a modular component structure for better maintainability, reusability, and separation of concerns.

## New Structure

### 📁 Store (`src/ui/store/`)

- **`appStore.ts`** - Redux store configuration, slices, and actions
  - Manages application state (symbols, inventory, selection, tags, toast)
  - Exports store instance and action creators
  - Provides TypeScript types for state and dispatch

### 📁 Constants (`src/ui/constants/`)

- **`inventory.ts`** - Application constants and type definitions
  - Default inventory items (basic shapes)
  - SVG conversion parameters and interfaces
  - Centralized configuration values

### 📁 Utils (`src/ui/utils/`)

- **`svgUtils.ts`** - SVG processing utilities
  - `sourceToSvg()` - Convert SVG source to DOM element
  - `unitsToPixels()` - Convert CSS units to pixels
  - `encodeSvgToBase64()` - UTF-8 aware base64 encoding
  - `svgToBlob()` - Convert SVG to PNG/JPEG blob with format options

### 📁 Hooks (`src/ui/hooks/`)

- **`useInventoryLogic.ts`** - Inventory management logic

  - Load, add, remove, and tag inventory items
  - Persist inventory to Adobe storage
  - Handle inventory state synchronization

- **`useShapeAndUploadLogic.ts`** - Shape creation and file upload logic
  - Insert basic shapes (rect, circle, polygon, curve)
  - Handle file uploads with validation
  - SVG conversion workflow
  - Integration with Adobe Document APIs

### 📁 Components (`src/ui/components/`)

- **`ShapeControls.tsx`** - Top toolbar with shape buttons and upload

  - Shape insertion buttons
  - File upload with drag-and-drop
  - Tooltips for supported formats

- **`SvgConversionModal.tsx`** - SVG conversion settings dialog

  - Format selection (PNG/JPEG)
  - Aspect ratio options
  - Conversion controls

- **`InventoryComponent.tsx`** - Complete inventory management UI

  - Collapsible inventory panel
  - Edit mode with multi-select
  - Tag filtering and management
  - Grid layout for inventory items

- **`App.tsx`** - Main application container (significantly reduced)
  - Theme provider and layout
  - Component orchestration
  - State management coordination

## Key Benefits

### 🔧 Maintainability

- **Single Responsibility**: Each component/hook has a focused purpose
- **Easier Debugging**: Issues are isolated to specific modules
- **Code Organization**: Related functionality is grouped together

### 🔄 Reusability

- **Composable Components**: Can be reused in different contexts
- **Portable Hooks**: Logic can be shared across components
- **Modular Utilities**: SVG utils can be used in other projects

### 📈 Scalability

- **Easy to Extend**: New features can be added as separate modules
- **Team Development**: Multiple developers can work on different modules
- **Testing**: Individual components can be unit tested in isolation

### 🎯 Type Safety

- **Strong Typing**: All modules have proper TypeScript interfaces
- **IDE Support**: Better autocomplete and error detection
- **Runtime Safety**: Reduced chance of type-related bugs

## Usage Patterns

### Adding New Features

1. Create new hook in `hooks/` for logic
2. Create new component in `components/` for UI
3. Add any constants to `constants/`
4. Update main App.tsx to integrate

### State Management

- Use Redux store for global state
- Use local state in components for UI-only state
- Custom hooks abstract complex state logic

### File Organization

```
src/ui/
├── components/          # UI Components
├── hooks/              # Custom React hooks
├── store/              # Redux store and slices
├── constants/          # Constants and types
├── utils/              # Utility functions
├── context/            # React contexts
└── styles/             # CSS files
```

## Migration Benefits

### Before (Monolithic App.tsx)

- 965 lines of mixed concerns
- Complex state management
- Difficult to test individual features
- Hard to reuse logic

### After (Modular Structure)

- App.tsx reduced to ~230 lines
- Clear separation of concerns
- Testable, reusable modules
- Easier to understand and maintain

This modular architecture makes the codebase more professional, maintainable, and ready for future growth.
