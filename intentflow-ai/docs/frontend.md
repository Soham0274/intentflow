# IntentFlow AI — Frontend System Documentation

> **Stack:** React 18 · CSS Custom Properties · DM Sans + Syne fonts  
> **Screens:** 8 · **Themes:** Dark (source-of-truth) + Light (derived)  
> **Status:** Production-ready, zero dependencies beyond React 18 CDN

---

## 1. File Structure

```
intentflow/
├── intentflow.html          # Self-contained deliverable (React via CDN)
├── IntentFlow.jsx           # Modular JSX source (for build-tool projects)
└── frontend.md              # This document
```

### For Build-Tool Projects (Vite / Expo Web / CRA)
Import `IntentFlow.jsx` and ensure these packages are installed:
```bash
npm install react react-dom
# Fonts via Google Fonts or local install:
# DM Sans, Syne
```

---

## 2. Color Token System

All tokens are defined as CSS custom properties on `:root` (dark) and `.light-theme` (light).
Swap the class on your `<html>` or a container element to switch themes globally.

### Dark Theme (Source of Truth — matches uploaded screens)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#08090E` | Page / screen background |
| `--bg-surface` | `#111318` | Bottom bars, header surfaces |
| `--bg-card` | `#171A23` | Card surfaces, input backgrounds |
| `--bg-card-alt` | `#1D2030` | Secondary cards, disabled states |
| `--bg-input` | `#1A1D28` | Text inputs, search bars |
| `--border` | `rgba(255,255,255,0.07)` | Default card/component borders |
| `--border-active` | `rgba(255,255,255,0.15)` | Hover/focus borders |
| `--text-primary` | `#FFFFFF` | Headings, primary labels |
| `--text-secondary` | `#6B7080` | Body text, captions |
| `--text-muted` | `#3D4258` | Labels, placeholders, dividers |
| `--accent` | `#7C6FFF` | Primary action color (purple-violet) |
| `--accent-2` | `#5A4FE8` | Gradient end for CTAs |
| `--teal` | `#00E5C9` | Success states, NLP badges, active |
| `--teal-dim` | `rgba(0,229,201,0.15)` | Teal icon backgrounds |
| `--red` | `#FF4455` | Error states, offline indicators |
| `--red-dim` | `rgba(255,68,85,0.12)` | Error card background tints |
| `--green` | `#00C896` | "System Online" dot, success |
| `--amber` | `#F5A623` | Trigger/calc badges |
| `--pill-bg` | `rgba(255,255,255,0.06)` | Status pill background |
| `--pill-border` | `rgba(255,255,255,0.10)` | Status pill border |

### Light Theme (Derived counterpart)

| Token | Value | Adaptation rationale |
|-------|-------|----------------------|
| `--bg-base` | `#F0F1F7` | Off-white, not pure white — avoids glare |
| `--bg-surface` | `#FFFFFF` | Pure white for elevated surfaces |
| `--bg-card` | `#FFFFFF` | Cards lift with shadow, not darkness |
| `--bg-card-alt` | `#F4F5FA` | Subtle blue-tinted grey |
| `--bg-input` | `#EAEBF4` | Slightly deeper for input contrast |
| `--border` | `rgba(0,0,0,0.07)` | Inverted opacity rule |
| `--text-primary` | `#0D0F1A` | Near-black with slight blue cast |
| `--text-secondary` | `#6B7080` | Same mid-grey (works on both) |
| `--accent` | `#6C5FEF` | Slightly deeper for WCAG AA on light |
| `--teal` | `#00A89A` | Darker teal for light-bg contrast |
| `--red` | `#E83548` | Slightly deeper red |

---

## 3. Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display headings (`h1`, `h2`) | Syne | 800 | 26–34px |
| Screen titles | Syne | 700 | 16px |
| Body text | DM Sans | 400–600 | 13–15px |
| Labels / section headers | DM Sans | 800 | 10px, uppercase, 0.14em tracking |
| Status pills / badges | DM Sans | 700–800 | 10–11px |
| Button text | DM Sans / Syne | 700–800 | 13–16px |

```html
<!-- Font import (place in <head>) -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
```

---

## 4. Screens & Components

### Screen 1 — `VoiceScreen` (Home / Listening)
**State:** Active voice capture  
**Key elements:**
- Animated waveform bars (CSS `scaleY` keyframe, staggered `animation-delay`)
- Transcript text with highlighted vs. greyed-out segments
- NLP parse card: Entity / Action / Trigger rows with confidence badges
- Mic FAB with radial pulse animation (`pulse-mic` keyframe)

**Navigation triggers:**
- Mic button → `confirm`
- Avatar → `profile`

---

### Screen 2 — `ProfileScreen`
**Key elements:**
- Gradient ring avatar (3px `linear-gradient(teal → accent)` padding + inner card bg circle)
- Two-state toggles for Voice Sensitivity and Auto-Confirm Intent
- Connected Ecosystem list: ACTIVE badge vs Connect CTA
- Recent Intents preview row

---

### Screen 3 — `ErrorScreen`
**State:** System Offline / network failure  
**Key elements:**
- Red-tinted status pill with `blink-dot` animation
- Full-bleed error headline with muted continuation text
- Error code card with `rgba(255,68,85,0.07)` background
- Reconnect button: triggers 1.5s spinner → navigates away

---

### Screen 4 — `ReviewScreen` (HITL)
**State:** Human-in-the-loop verification  
**Key elements:**
- Dual-line header: "INTENT CONFIRMED" (teal) + screen title
- Form rows: Contact, Action Type, Trigger Time, Additional Notes
- Notes field is a live `<textarea>` (editable)
- Bottom command bar with dot indicator + mic + send

---

### Screen 5 — `ConfirmScreen`
**Key elements:**
- Teal checkmark tile with `check-pop` spring animation on mount
- Summary card with 3 detail rows (Reminder For, Action, Trigger)
- INT-ID badge (top-right of card)
- Primary CTA: full-width gradient button with purple glow shadow
- Secondary CTA: outline-style "Edit Details"

---

### Screen 6 — `AmbiguityScreen`
**State:** Multiple intent interpretations detected  
**Key elements:**
- Option cards toggle between collapsed (icon + label + confidence) and expanded (+ description + tags) based on `selected` state
- Selected card gets `border: 1.5px solid var(--accent)` + `background: rgba(124,111,255,0.07)`
- Confidence badge changes color on selection

---

### Screen 7 — `AlertsScreen`
**Key elements:**
- Smart Nudges featured card: gradient border background, larger icon, descriptive copy
- Delivery Rules card with embedded toggle rows
- Quiet Hours expands time-picker row when toggled ON
- Frequency row uses `›` chevron indicating drill-down

---

### Screen 8 — `CollectionsScreen`
**Key elements:**
- Horizontal scroll row of Life Area cards (min-width 178px, fixed 220px height)
- Card backgrounds: unique gradient per area (blue, purple, pink, teal)
- Task badge: `rgba(255,255,255,0.22)` pill top-right of each card
- Bottom nav: 5 items with centered `+` FAB (gradient, box-shadow glow)
- Smart Nudges compact strip before nav

---

## 5. Shared Components

### `Avatar`
```jsx
<Avatar letter="A" size={36} gradient={true} onClick={fn} />
```
- `gradient=false`: Dark card background, teal letter (standard)
- `gradient=true`: `linear-gradient(135deg, teal, accent)` fill (profile hero)

### `StatusPill`
```jsx
<StatusPill status="online" />  // online | offline | analyzing | ready
```
Each variant overrides dot color, text color, background, and border from a static map.

### `Toggle`
```jsx
<Toggle on={bool} onToggle={fn} />
```
46×26px pill, thumb slides 20px on state change via CSS `transition: left 0.25s`.

### `Card`
```jsx
<Card style={overrides} className="card-hover" onClick={fn}>…</Card>
```
Base: `bg-card`, `border: 1px solid var(--border)`, `border-radius: 18px`.  
`.card-hover` adds `:hover` border lift. `.card-selected` applies accent border + tint.

### `Section`
```jsx
<Section label="DELIVERY RULES">…</Section>
```
Renders uppercase 10px label + child content below.

### `TopBar`
```jsx
<TopBar status="online" left={<HamburgerBtn />} onProfileClick={fn} />
```
Fixed 3-column layout: left slot (36px) · centered StatusPill · right slot (Avatar or custom).

---

## 6. Animation Catalog

| Name | Keyframe | Usage |
|------|----------|-------|
| `slide-up` | `translateY(12px) → 0` + fade | Screen mount transition |
| `fade-in` | opacity 0 → 1 | Subtle reveals |
| `pulse-mic` | radial box-shadow pulse | Mic FAB on VoiceScreen |
| `blink-dot` | opacity 1 → 0.3 | Status pill dot |
| `bar-wave` | `scaleY(0.4)` → `scaleY(1)` | Waveform bars (staggered delays) |
| `spin-reconnect` | 360deg rotation | Reconnect button loading state |
| `check-pop` | scale(0.5) → scale(1.1) → scale(1) | Confirm screen checkmark |

---

## 7. Theme Switching

### HTML (current implementation)
```javascript
// Add/remove class on the app root element
document.getElementById("app-root").classList.toggle("light-theme");
document.body.style.background = isLight ? "#E0E2EC" : "#050507";
```

### React Context pattern (recommended for larger apps)
```jsx
const ThemeCtx = React.createContext({ dark: true, toggle: () => {} });

function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

// In any component:
const { dark, toggle } = useContext(ThemeCtx);
```

### Tailwind config equivalent
```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "bg-base":    { DEFAULT: "#08090E", light: "#F0F1F7" },
        "bg-surface": { DEFAULT: "#111318", light: "#FFFFFF" },
        "bg-card":    { DEFAULT: "#171A23", light: "#FFFFFF" },
        accent:       { DEFAULT: "#7C6FFF", light: "#6C5FEF" },
        teal:         { DEFAULT: "#00E5C9", light: "#00A89A" },
        // ... etc.
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["DM Sans", "sans-serif"],
      },
    },
  },
};
```

---

## 8. Expo / React Native Adaptation Notes

Since IntentFlow is primarily a **React Native (Expo)** app, map these tokens:

| Web CSS var | RN StyleSheet equivalent |
|-------------|--------------------------|
| `var(--bg-base)` | `colors.bgBase` from a theme context |
| `border-radius: 18px` | `borderRadius: 18` |
| `linear-gradient(...)` | `expo-linear-gradient` `<LinearGradient>` |
| CSS animations | `Animated` API or `react-native-reanimated` |
| `overflow: auto` | `<ScrollView>` |
| `position: absolute` | Same in RN |
| `box-shadow` | `shadow*` props (iOS) or `elevation` (Android) |
| `backdrop-filter: blur` | `expo-blur` `<BlurView>` |

### Waveform in RN
Replace the CSS keyframe bars with:
```jsx
import { Animated } from "react-native";
// Array of Animated.Values, loop between 0.3 and 1 with staggered delays
```

### Gradient cards in RN
```jsx
import { LinearGradient } from "expo-linear-gradient";
<LinearGradient colors={["#3B5BDB","#6741D9"]} style={styles.card}>
  {children}
</LinearGradient>
```

---

## 9. Accessibility Checklist

- [ ] All interactive elements have `role="button"` or semantic tag
- [ ] Color contrast: primary text on `--bg-base` exceeds 7:1 (dark) / 8:1 (light)
- [ ] Accent `#7C6FFF` on `#08090E`: contrast ratio ≈ 5.2:1 (WCAG AA for large text ✓)
- [ ] Toggle component needs `aria-checked` and `role="switch"`
- [ ] Status pills should have `aria-live="polite"` for dynamic updates
- [ ] Focus rings: add `:focus-visible` outlines for keyboard navigation
- [ ] Mic button: `aria-label="Start voice input"` + `aria-pressed` state

---

## 10. Next Steps for Production

1. **Replace emoji icons** with a consistent icon library (Lucide React or Phosphor Icons)
2. **Add gesture support** — swipe between screens using `react-native-gesture-handler`
3. **Connect to backend** — wire `VoiceScreen` → real Gemini NLP response → `ConfirmScreen`
4. **Persistent theme** — store user preference in `AsyncStorage` (RN) or `localStorage` (web)
5. **Error boundaries** — wrap each screen in React `<ErrorBoundary>` 
6. **Skeleton states** — add loading skeletons for the profile and collections data fetches
7. **Haptic feedback** — add `expo-haptics` on Confirm Action and mic press

---

*Generated from 8 design screenshots · IntentFlow AI · March 2026*
