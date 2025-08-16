# Theme System Implementation

This document describes the theme system implemented in the Adobe Add-on project, based on the crypt project's theme architecture.

## Overview

The theme system provides three distinct themes with **COOL** visual effects:
- **Light Theme**: Clean, bright interface with high contrast
- **Dark Theme**: Dark interface with light text for reduced eye strain
- **Acrylic Theme**: Glassmorphism effect with animated gradient background, floating particles, and shimmer effects

## Architecture

### Core Components

1. **ThemeContext** (`src/ui/context/ThemeContext.tsx`)
   - Manages theme state using React Context
   - Handles localStorage persistence
   - Provides theme switching functionality
   - Supports system preference detection

2. **ThemeSwitcher** (`src/ui/components/ThemeSwitcher.tsx`)
   - UI component for switching between themes
   - Displays theme icons for each mode
   - Integrates with Adobe's button components

3. **ThemeIcon** (`src/ui/components/ThemeIcon.tsx`)
   - SVG icons for each theme mode
   - Custom acrylic icon with gradient effects

### CSS Architecture

#### Theme Variables (`src/ui/styles/themes.css`)

The theme system uses CSS custom properties (variables) for consistent theming:

```css
:root {
  /* Light theme variables */
  --adobe-background: #ffffff;
  --adobe-surface: #f5f5f5;
  --adobe-border: #e0e0e0;
  --adobe-text: #2c2c2c;
  --adobe-accent: #1473e6;
  /* ... more variables */
}

.dark {
  /* Dark theme variables */
  --adobe-background: #2c2c2c;
  --adobe-surface: #3a3a3a;
  /* ... more variables */
}

.acrylic {
  /* Acrylic theme variables */
  --adobe-background: rgba(44, 44, 44, 0.8);
  /* ... more variables */
}
```

#### Acrylic Effects

The acrylic theme includes **AMAZING** special effects:
- Animated gradient background with multiple layers
- Backdrop blur effects with enhanced glassmorphism
- Floating particle system
- Shimmer effects on cards and icons
- Neon glow effects on active elements
- Smooth transitions with bounce animations
- Sparkling animated icons
- Hover effects with light sweeps

## Usage

### Basic Implementation

```tsx
import { ThemeProvider } from "../context/ThemeContext";
import { ThemeSwitcher } from "./ThemeSwitcher";

function App() {
  return (
    <ThemeProvider>
      <div className="adobe-addon-container">
        <header>
          <ThemeSwitcher />
        </header>
        {/* Your app content */}
      </div>
    </ThemeProvider>
  );
}
```

### Using Theme in Components

```tsx
import { useTheme } from "../context/ThemeContext";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="adobe-addon-surface">
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### CSS Classes

#### Theme-aware Classes
- `.adobe-addon-container`: Main container with theme background
- `.adobe-addon-surface`: Surface elements with theme styling
- `.adobe-addon-button`: Themed button styling
- `.acrylic-card`: Acrylic glassmorphism effect
- `.theme-transition`: Smooth theme transitions

#### Utility Classes
- `.elevation-hover`: Hover effects with elevation
- `.animate-fade-in`: Fade-in animation
- `.animate-fade-out`: Fade-out animation
- `.neon-glow`: Cool neon glow effect
- `.floating`: Floating animation
- `.shimmer`: Shimmer effect
- `.glitch`: Glitch effect (for special occasions)
- `.particles`: Particle system container

## Integration with Adobe Components

The theme system is designed to work seamlessly with Adobe's Spectrum Web Components:

```tsx
import { Theme } from "@swc-react/theme";
import { Button } from "@swc-react/button";

<ThemeProvider>
  <Theme system="express" scale="medium" color="light">
    <Button variant="primary">Themed Button</Button>
  </Theme>
</ThemeProvider>
```

## Features

### Automatic Theme Detection
- Detects system preference on first load
- Remembers user's choice in localStorage
- Falls back to light theme if no preference is set

### Smooth Transitions
- All theme changes include smooth CSS transitions
- Prevents jarring visual changes
- Maintains user experience during theme switching

### Responsive Design
- Theme effects adapt to different screen sizes
- Acrylic blur effects are optimized for mobile
- Maintains performance across devices

### Accessibility
- High contrast ratios in all themes
- Proper color combinations for readability
- Keyboard navigation support

## Customization

### Adding New Themes

1. Add theme variables to `themes.css`:
```css
.new-theme {
  --adobe-background: #your-color;
  --adobe-surface: #your-color;
  /* ... more variables */
}
```

2. Update `ThemeContext.tsx`:
```tsx
export type ThemeMode = "light" | "dark" | "acrylic" | "new-theme";
```

3. Add theme icon in `ThemeIcon.tsx`

4. Update `ThemeSwitcher.tsx` with new theme option

### Custom Theme Variables

You can add custom variables for your components:

```css
:root {
  --my-component-bg: #ffffff;
  --my-component-text: #2c2c2c;
}

.dark {
  --my-component-bg: #2c2c2c;
  --my-component-text: #ffffff;
}
```

## Browser Support

- Modern browsers with CSS custom properties support
- Backdrop filter support for acrylic effects
- Graceful degradation for older browsers

## Performance Considerations

- CSS variables provide efficient theme switching
- Minimal JavaScript overhead
- Optimized animations and transitions
- Efficient localStorage usage

## Troubleshooting

### Theme Not Switching
- Check if `ThemeProvider` wraps your app
- Verify localStorage permissions
- Ensure CSS variables are properly defined

### Acrylic Effects Not Working
- Check browser support for backdrop-filter
- Verify CSS is properly loaded
- Ensure no conflicting styles

### Performance Issues
- Reduce animation complexity on low-end devices
- Optimize gradient animations
- Consider disabling acrylic effects on mobile
