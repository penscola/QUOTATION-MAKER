---
name: QuoteCraft
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  tabular-numeric-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  tabular-numeric-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system establishes an ultra-refined, high-density financial SaaS interface tailored for modern enterprise quotation, revenue operations, and pricing configuration workflows. The aesthetic merges technical precision with institutional confidence—delivering a focused, cockpit-like environment that reduces cognitive strain across data-intensive tasks.

### Brand Tone & Persona
- **Direct & Analytical:** Optimized for fast data entry, formula parsing, and clear hierarchy without decorative distractions.
- **Engineered & Precise:** Exact line boundaries, high-legibility tabular alignment, and disciplined visual cadence convey computational rigor and stability.
- **Modern Institutional:** Balances rich dark slate tones with vibrant indigo and electric cyan highlights, providing the authoritative presence expected by high-volume B2B operations.

### Design Style: Modern Financial SaaS
The system combines dark-mode slate surfaces with high-precision micro-borders and structured tabular grids. It relies on crisp layer contrast rather than heavy atmospheric blur or exaggerated elevation, ensuring calculations, itemized line items, and dynamic margin percentages remain instantly scan-able.

## Colors

The palette is engineered around dark slate architecture, high-contrast typography, and purposeful stateful accents that steer operational velocity.

### Base Surface Architecture
- **Canvas / Root Background (`#0F172A` - Slate 900):** Deepest structural canvas anchor, grounding all viewports and modal scrim backdrops.
- **Surface Elevation 1 (`#1E293B` - Slate 800):** Card panels, table wrappers, sidebar containers, and calculation blocks.
- **Surface Elevation 2 (`#334155` - Slate 700):** Nested sub-cards, active item rows, toolbars, and input field backgrounds.
- **Surface Elevation 3 (`#475569` - Slate 600):** Hover states on neutral controls, segmented button active states, and drag handles.

### Borders & Delimiters
- **Subtle Dividers (`#1E293B`):** Internal cell breaks and baseline rules.
- **Structural Outlines (`#334155`):** Exterior card boundaries, input strokes, sticky header margins, and panel separators.
- **High-Contrast Focus Outlines (`#4F46E5` / `#6366F1`):** Keyboard rings, active cell highlights, and drag-and-drop landing boundaries.

### Accents & Semantic Signals
- **Primary Interactive (`#4F46E5` - Indigo 600, Hover `#6366F1` - Indigo 500):** Primary actions, active navigation anchors, selection indicators, and submission triggers.
- **Cyan Secondary / Badges (`#06B6D4` - Cyan 500):** Margin tags, live recalculation badges, dynamic discount meters, and real-time status telemetry.
- **Operational Positive (`#10B981` - Emerald 500):** Positive profit deltas, signed approvals, and validated tax statuses.
- **Operational Warning & Error:** Amber (`#F59E0B`) for pending line item discrepancies; Crimson (`#EF4444`) for margin loss thresholds and validation breaks.

### Typography Legibility Tiers
- **Text Primary (`#F8FAFC` - Slate 50 / Slate 100):** Numerical outputs, main line descriptions, modal titles, and active inputs.
- **Text Secondary (`#94A3B8` - Slate 400):** Column metrics, metadata labels, unit calculations, and placeholder states.
- **Text Muted (`#64748B` - Slate 500):** Disabled elements, currency symbols, and shortcut tags.

## Typography

Typography is calibrated for extreme density, immediate legibility, and strict mathematical alignment across nested quotation grids.

### Font Family & Feature Settings
- **Uniform Single-Family Architecture:** `Inter` is applied globally across display, body, and UI labels to ensure consistent visual metrics and cross-browser rendering reliability.
- **OpenType Feature Activation:** Tables, line item rates, volume counters, and calculation summaries mandate `font-feature-settings: "tnum" 1, "cv05" 1, "zero" 1` to ensure all numerical characters maintain uniform column widths and unambiguous zero rendering.
- **Hierarchy Rules:** Large visual headlines are restrained; enterprise quoting interfaces prioritize clear section groupings, high-density row labels, and uppercase tracking over sprawling hero typography.

## Layout & Spacing

The spatial model enforces a condensed 8px/4px hybrid rhythm tailored to information-dense quotation software. Content space is prioritized over excessive negative space to keep calculation bars, pricing tiers, and line item tables visible without unnecessary vertical scrolling.

### Grid & Master Frame
- **Application Shell:** Fluid full-bleed dashboard architecture constrained within a maximum readable width of `1600px` for multi-column workbenches, falling back to full viewport width for tabular calculation grids.
- **Column Mechanics:** 12-column layout on desktop with `1rem` (16px) gutters; collapsible 4-column layout on tablet and single-column stacked hierarchy on mobile.
- **Sidebar & Summary Rail:** Fixed persistent widths (Sidebar: 240px; Financial Calculation Summary Rail: 360px on wide viewports, dockable to fixed bottom sheet on smaller viewports).

### Density Scaling
- **Dense Mode (Default Quoting Grid):** Uses `space-xs` and `space-sm` for table cell padding (4px vertical, 8px horizontal) to maximize row capacity above the fold.
- **Form & Card Container Mode:** Uses `space-md` (12px) to `space-lg` (20px) for container padding, ensuring input fields maintain accessible touch and click targets without ballooning vertical space.

## Elevation & Depth

This design system deliberately de-emphasizes heavy diffuse drop shadows in favor of surface tonal contrast and crisp, structural outline boundaries (`#334155`).

### Depth Tiers
1. **Level 0 (App Shell Canvas):** Root background `#0F172A`. Flat, static, absorbing.
2. **Level 1 (Card & Module Containers):** Surface background `#1E293B` surrounded by a `1px` continuous border in `#334155`. No ambient shadow is used; structural borders handle layer detachment.
3. **Level 2 (Dropdowns, Popovers, & Cell Overlays):** Surface background `#1E293B`, border `1px solid #475569`, backed by an ambient crisp shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.45)`.
4. **Level 3 (Modal Workbenches & Formula Editors):** Elevated surface `#1E293B`, reinforced with dual borders (`1px solid #4F46E5` on header dividers, `1px solid #334155` overall boundary), backed by `0 20px 32px -8px rgba(0, 0, 0, 0.6)`.

### Border Highlights & State Shimmers
- Surface cards utilize an internal hairline gradient or solid 1px highlight (`rgba(255, 255, 255, 0.05)`) along the top edge to simulate subtle industrial edge refraction.
- Focused or active records replace the neutral `#334155` border with an indigo stroke (`#4F46E5`), accompanied by a subtle `0 0 0 1px #4F46E5` ring to guarantee focus state discovery.

## Shapes

The geometric identity balances clean engineering with ergonomic refinement. Radii are distributed systematically according to component scale:

- **Primary Cards & Modals (`rounded-xl`):** `1.5rem` (24px) for major outer container shells and modular quotation panels, softening the large slate blocks.
- **Secondary Surfaces & Nested Sections (`rounded-lg`):** `1rem` (16px) for inner summary cards, tiered discount boxes, and formula groups.
- **Interactive Controls & Inputs (`rounded`):** `0.5rem` (8px) for buttons, inputs, segmented controls, dropdown triggers, and tabular action cells.
- **Micro Elements & Badges:** `0.25rem` (4px) to `0.375rem` (6px) for itemized line code tags, currency indicators, and status chips, ensuring data tags remain compact and geometrically aligned.

## Components

### Buttons
- **Primary Action (Generate Quote, Confirm Terms):** Background `#4F46E5`, text `#FFFFFF`, font-weight 600. Hover: `#6366F1`. Active focus ring: `ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F172A]`. Transition: 150ms ease-out.
- **Secondary Action (Add Item, Apply Template):** Background `#1E293B`, border `1px solid #334155`, text `#F8FAFC`. Hover: background `#334155`, border `#475569`.
- **Tertiary / Utility:** Background transparent, text `#94A3B8`. Hover: text `#F8FAFC`, background `rgba(51, 65, 85, 0.4)`.

### Inputs & Number Steppers
- **Text & Currency Inputs:** Background `#0F172A`, border `1px solid #334155`, text `#F8FAFC`, placeholder `#64748B`. Focused state: border `#4F46E5`, outline ring `ring-1 ring-indigo-500`.
- **Inline Tabular Inputs:** Embedded seamlessly in line item grids without fixed background borders until hover/focus, maintaining table scannability while supporting instant inline edits.
- **Tabular Numeric Cells:** Always right-aligned, monospaced/tnum enabled, subtle right margin for currency anchor alignment.

### Badges & Status Chips
- **Cyan Accents (Active Margins, In Review, Discount %):** Background `rgba(6, 182, 212, 0.12)`, text `#22D3EE`, border `1px solid rgba(6, 182, 212, 0.3)`. Text size: `label-caps` (`10px`, bold).
- **Approved / Profit Positive:** Background `rgba(16, 185, 129, 0.12)`, text `#34D399`, border `1px solid rgba(16, 185, 129, 0.25)`.
- **Draft / Inactive:** Background `rgba(51, 65, 85, 0.5)`, text `#94A3B8`, border `1px solid #334155`.

### Tabular Grid Component (Quotation Core)
- **Header Row:** Background `#1E293B`, bottom border `1px solid #334155`, typography `label-caps` in `#94A3B8`.
- **Data Rows:** Background `#1E293B`, alternating hover background `#243248`. Row separator `1px solid rgba(51, 65, 85, 0.6)`.
- **Total & Subtotal Anchors:** Sticky bottom footer bar within container, background `#1E293B`, top border `2px solid #334155`, high-contrast figures in `#F8FAFC` (`tabular-numeric-lg`).

### Cards & Financial Panels
- Built with `rounded-xl`, background `#1E293B`, and `1px solid #334155`.
- Section dividers within cards utilize hairline borders (`#334155`) with no margin leakage.

### Selection Controls
- **Checkboxes:** Size 16x16px, `rounded` (4px), background `#0F172A`, border `1px solid #334155`. Checked state: background `#4F46E5`, border `#4F46E5`, icon white checkmark.
- **Radio Buttons:** Circular, size 16x16px, background `#0F172A`, border `1px solid #334155`. Active: inner dot `#4F46E5`.