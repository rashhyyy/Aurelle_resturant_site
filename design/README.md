# Aurelle Design System & Figma Specification

This folder documents the design architecture and tokens corresponding to your **Figma design files** and matching the **Tailwind CSS** implementation.

---

## 🎨 1. Figma Project Link

Add your Figma design and prototype links below:
- **Figma Design File**: `[Paste your Figma file URL here]`
- **Figma Prototype**: `[Paste your Figma presentation / prototype URL here]`
- **Component Library / UI Kit**: `[Paste design system / components URL here]`

---

## 🌈 2. Color Palette & Design Tokens

### Primary Brand
- **Primary / Brand**: `#6366F1` (Indigo 500)
- **Primary Hover**: `#4F46E5` (Indigo 600)
- **Primary Active**: `#4338CA` (Indigo 700)
- **Primary Subtle / Glow**: `rgba(99, 102, 241, 0.15)`

### Surface & Background (Dark Theme First)
- **Background Root**: `#020617` (Slate 950)
- **Surface Elevation 1 (Card / Panel)**: `#0F172A` (Slate 900)
- **Surface Elevation 2 (Input / Nested Card)**: `#1E293B` (Slate 800)
- **Border Default**: `rgba(51, 65, 85, 0.8)` (Slate 800)
- **Border Focused / Active**: `#6366F1` (Indigo 500)

### Text Hierarchy
- **Heading & Primary Text**: `#F8FAFC` (Slate 50)
- **Body & Secondary Text**: `#CBD5E1` (Slate 300)
- **Muted & Tertiary Text**: `#94A3B8` (Slate 400)
- **Placeholder / Disabled**: `#64748B` (Slate 500)

### State & Feedback
- **Success**: `#10B981` (Emerald 500)
- **Info / WebSocket**: `#0284C7` (Sky 600)
- **Warning**: `#F59E0B` (Amber 500)
- **Error / Danger**: `#F43F5E` (Rose 500)

---

## 🔤 3. Typography Scale

Matching Next.js Geist Sans font definitions:

| Style | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display / H1** | 36px - 44px | 800 (ExtraBold) | 1.15 | Page heroes, landing titles |
| **Heading / H2** | 24px - 28px | 700 (Bold) | 1.25 | Card headers, section titles |
| **Subtitle / H3** | 18px - 20px | 600 (SemiBold) | 1.35 | Widget headers, modal titles |
| **Body Large** | 16px | 400 (Regular) / 500 | 1.5 | Hero subtext, prominent copy |
| **Body Regular** | 14px | 400 (Regular) | 1.5 | Standard copy, inputs, buttons |
| **Caption / Small** | 12px | 500 (Medium) | 1.4 | Badges, timestamps, helpers |
| **Code / Monospace** | 12px - 13px | 400 / 600 | 1.4 | API paths, JSON payloads, tokens |

---

## 📐 4. Spacing & Grid System

- **Base Unit**: `4px` (8pt grid system)
- **Container Max-Width**: `1280px` (`max-w-7xl`)
- **Card Padding**: `20px` to `24px` (`p-5` / `p-6`)
- **Border Radius**:
  - Small elements (inputs, badges): `8px` (`rounded-lg`)
  - Medium cards & modals: `12px` to `16px` (`rounded-xl` / `rounded-2xl`)

---

## 🧩 5. UI Component Hierarchy

When exporting designs from Figma into `client/src/components`:

1. **Atoms**:
   - `Button`: Primary, secondary, outline, danger states
   - `Input`: Text, email, password (with show/hide), validation states
   - `Badge`: Status indicators (Connected, Online, Pending, Failed)
2. **Molecules**:
   - `AuthModal` / `AuthCard`: Login and Register forms with validation error callouts
   - `MetricCard`: Status monitor showing real-time pings and counts
   - `LiveChatWidget`: Real-time Socket.IO dispatch and message stream
3. **Organisms / Templates**:
   - `Navbar`: Brand logo, session status, user menu, socket status
   - `DashboardLayout`: Grid layout for modules and analytics
   - `Footer`: Links, system status, metadata

---

## 🔄 6. Syncing Figma with Tailwind CSS

1. Define colors and font styles as Figma Styles or Figma Variables.
2. Ensure variable names match Tailwind CSS classes (e.g. `indigo-500`, `slate-950`).
3. Export SVG icons and vector assets directly to `client/public/` or utilize `lucide-react`.
