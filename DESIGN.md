---
name: ServerlessInsight
description: A restrained monochrome system with violet interaction accents.
colors:
  si-bg: "#111111"
  si-panel: "#141414"
  si-text: "#f8f8f8"
  si-muted: "#bcbcbc"
  si-step: "#a3a3a3"
  si-border: "#3d3d3d"
  si-border-strong: "#626262"
  si-link: "#a384eb"
  si-secondary-border: "#8473a7"
  si-hover: "#292929"
  si-button-hover: "#dddddd"
  si-paper: "#ffffff"
  si-ink: "#111111"
  si-ink-muted: "#626262"
  si-light-border: "#d6d6d6"
  si-code-bg: "#fafafa"
  si-code-header: "#f3f3f3"
  si-link-light: "#6640bf"
  si-mist: "#f5f5f5"
typography:
  display:
    fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(3rem, 5.45vw, 4.875rem)"
    fontWeight: 720
    lineHeight: 1.01
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(2.1rem, 4.1vw, 3.5rem)"
    fontWeight: 680
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  label:
    fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "11px"
    fontWeight: 550
    lineHeight: 1.5
    letterSpacing: "0.09em"
rounded:
  control: "4px"
  panel: "5px"
  inset: "3px"
  menu: "6px"
spacing:
  compact: "12px"
  standard: "20px"
  roomy: "24px"
  section-gap: "36px"
components:
  button-primary:
    backgroundColor: "{colors.si-text}"
    textColor: "{colors.si-bg}"
    rounded: "{rounded.control}"
    padding: "0 25px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.si-button-hover}"
    textColor: "{colors.si-bg}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.si-link}"
    rounded: "{rounded.control}"
    padding: "0 25px"
    height: "48px"
  deployment-panel:
    backgroundColor: "{colors.si-panel}"
    textColor: "{colors.si-text}"
    rounded: "{rounded.panel}"
  code-window:
    backgroundColor: "{colors.si-code-bg}"
    textColor: "{colors.si-ink}"
    rounded: "{rounded.panel}"
---

# Design System: ServerlessInsight

## Overview

**Creative North Star: "Deployment Clarity"**

The implemented site presents a calm, precise developer platform: large neutral typography, real configuration excerpts, and a readable deployment illustration. Its enterprise SaaS presentation describes the visual tone; it does not establish enterprise capabilities or customer proof.

The expanded landing page preserves the approved dark hero, provider strip, CLI sequence, and closing action. White and mist bands make room for features, deployment planning, local workflow, a real console capture with example data, use cases, open-source context, pricing, and FAQs. Both homepages keep this fixed art direction. Pricing, documentation, and legal pages share its Inter typography, neutral palette, flat borders, modest corners, and monochrome actions while retaining native VitePress theme controls and reading structures. The same branded dark footer closes every route.

**Key Characteristics:**

- Neutral surfaces and display text with restrained violet interaction accents.
- Flat outlined artifacts, code-native geometry, and the existing ServerlessInsight logo.
- Clear editorial bands with functional tabs, copy controls, and localized navigation.
- A shared site identity with theme-aware inner pages and a fixed dark footer.

## Colors

The palette is grayscale first; violet identifies interaction and selected states.

### Primary

- **Soft Violet** (`si-link`): links, selected-tab underline, focus, and YAML keys on dark surfaces.
- **Deep Violet** (`si-link-light`): the corresponding interaction and syntax color on white and mist surfaces, including the selected Resources label.
- **Muted Violet Border** (`si-secondary-border`): the outlined secondary action.

### Neutral

- **Near Black / Quiet Panel** (`si-bg`, `si-panel`): fixed homepage and footer canvas, dark reading surfaces, and deployment artifact.
- **Soft White / Supporting Gray** (`si-text`, `si-muted`, `si-step`): headings, body copy, and ordered workflow numerals.
- **Dark Dividers** (`si-border`, `si-border-strong`): section boundaries and artifact structure.
- **Paper / Ink** (`si-paper`, `si-ink`, `si-ink-muted`): light reading and pricing surfaces plus feature, workflow, console, use-case, and FAQ bands with readable code annotation.
- **Mist** (`si-mist`): deployment planning, homepage pricing, inner-page alternate surfaces, and the native docs sidebar, separating longer content without extra decoration.
- **Code Paper** (`si-code-bg`, `si-code-header`, `si-light-border`): the light YAML window.

**The Semantic Ownership Rule.** Primary actions stay monochrome across home and inner pages. Pricing identifies the featured plan with a violet border and small label. Green is reserved for explicit free or zero-AMR signals through the existing success tokens. Deployment changes use neutral symbols and explicit text. Provider colors belong to provider identities; site chrome remains neutral. Violet remains a small part of each viewport, never a display headline or a broad background.

## Typography

Inter is the deliberate shared site typeface, matching the approved composition and the existing bundled font. Chinese falls back to PingFang SC and Microsoft YaHei. Commands and configuration use the VitePress monospace family.

- **Display:** tight, heavy, stacked hero text. The frontmatter records the desktop English role; Chinese uses a gentler line height (1.15) and its own responsive sizes.
- **Headline:** compact multiline section headings; mobile sections settle at (35px).
- **Body:** hero supporting copy uses the frontmatter role and is limited to (36ch) on desktop; expanded sections use smaller supporting copy, pricing copy, and screenshot captions. These component roles form the implemented type ramp rather than a single global body size.
- **Label:** small uppercase eyebrows with deliberate tracking. These and the light ordered workflow numerals are approved composition details.
- **Code:** small, exact technical text, with horizontal scrolling where required. Keep code separate from prose and preserve readable line spacing.

Inner-page interface sizes are intentional: details, table text, navigation, labels, and supporting copy range from (11–18px); plan names use (20px); reading and pricing subheads use (22px), (26px), or (30px). Pricing and reading display roles range from (32–72px), with narrower-screen overrides rather than a global enlargement. Reading prose uses (16px) with line height (1.8), and introductory paragraphs use (18px). These roles complement the larger homepage hero recorded in the frontmatter; advisory type-ramp notices do not by themselves justify flattening the hierarchy.

## Layout

The landing content width is capped at (1280px), with desktop side gutters (40px). Gutters reduce to (32px) below (1200px) and (20px) below (600px). Hero and configuration bands use near-equal two-column grids. The workflow is an ordered three-column sequence separated by vertical rules.

At (959px), the hero and configuration layouts stack and the header becomes an overlay navigation menu. Expanded sections also adapt at (767px) and (599px): the two-column pricing explainer stacks at (767px). The console section places its heading, description, benefits, and action beside the proportional screenshot on desktop and tablet, then stacks below 768px. The preview remains uncropped with a full-size link; code regions scroll internally instead of widening the page. Below (600px), CLI workflow steps become ruled rows, the closing action area stacks, and footer groups wrap. Preserve comfortable control targets and localized heading breaks rather than forcing desktop geometry onto small screens.

Dedicated pricing shares the (1280px) maximum width and (40px), (32px), and (20px) responsive gutters. Its editorial hero stacks below (960px), plan cards stack below (768px), resource-coverage rows reduce from three to two to one column, and tables scroll within their frame. Legal reading pages cap their outer container at (848px), with (32px) desktop and (20px) mobile padding. Documentation keeps the native sidebar and outline. On desktop, the sidebar starts below the shared header and places its first control 24px inside its own scroll area; the native header curtain is unnecessary with this geometry. On desktop docs routes, the footer begins beside the sidebar and sizes its grid to the available content width; container rules move the brand above four link columns, then reduce links to two columns.

## Elevation & Depth

The site is flat: it uses tonal separation, thin borders, and nested artifact frames rather than shadows, glass, gradients, or ornamental lighting. Alternating white, mist, and dark content bands provide rhythm across the expanded page. Landing and pricing interaction transitions are short color and border changes (160ms ease-out); reduced-motion preferences disable their transitions and animations. Reading content follows the selected theme; the shared footer always uses the dark palette.

## Shapes

Controls and pricing cards have modest corners (4px), with slightly softer landing panel and menu corners. Thin rules organize the provider strip, workflow, footer, and code frames. Icons and diagrams use inline geometry. The landing header and shared footer reuse `docs/public/logo-dark.png`, the existing hexagon, cloud, and arrow logo, in its original colors and square aspect ratio. Inner-page headers use the existing `logo.png` and `logo-dark.png` variants for their respective themes. Do not recreate or recolor the brand mark. Existing provider images are rendered monochrome on the landing; no new raster artwork is required.

## Components

### Buttons and links

Landing primary actions use a soft-white fill with near-black text. Inner-page primary actions use near-black fill in light mode and light fill in dark mode. Secondary landing actions are transparent, outlined, and violet; inner-page ghost actions use neutral borders and text. Text links are underlined, usually paired with a small directional icon. Homepage pricing uses one monochrome link to the localized dedicated pricing page. Dedicated pricing also uses monochrome actions, including the featured plan, with each plan action placed before its feature list.

Hover changes fill or border; keyboard focus uses a visible violet outline (2px) with an offset (5px). Copy controls retain localized labels and expose success or failure through text as well as an icon.

### Navigation

All pages use the VitePress navigation component and the same localized menu configuration: Features, Cloud support, Pricing, and Docs. Features and Cloud support open their homepage sections; Pricing opens the dedicated localized pricing page. The shared header includes the original logo, language menu, authentication entry, and monochrome signup action. Language switching retains the corresponding page. Below 960px, the menu opens as a full-screen overlay with an explicit expanded state and Escape dismissal. Documentation retains its native sidebar and outline. Inner pages offer persistent light/dark selection in the desktop header, tablet overflow menu, and mobile menu. The homepage keeps its fixed palette and hides appearance controls. Authentication labels derive their language from the SSR-safe page path, so Sign in or Console remains visible while document language initializes. The same `LandingFooter.vue` serves home and every inner route, with `SiteFooter.vue` as a thin wrapper.

The fixed dark footer preserves the useful destinations from the standard site footer across all routes and both reading themes. Product, Resources, Community, and Legal use labeled navigation lists, including guides, support, GitHub Issues, social channels, and the refund policy. The brand area includes the support email; copyright and license sit below a single rule. At ample available width the brand sits alongside four link columns. As its container narrows, the brand spans the row and links then form two columns with minimum (44px) tap targets. Desktop docs retain the sidebar beside the footer rather than allowing it to cover footer content. Keep destinations equivalent in both languages and retain the existing external URLs.

### Deployment artifact

A flat bordered panel contains Configuration and Deployment plan tabs, a readable plan table, and a simple gateway → function → storage relationship diagram. The plan is explicitly illustrative and labeled as an Alibaba Cloud example. Tabs provide ARIA relationships, selected state, and Arrow/Home/End keyboard navigation. Do not replace this current artifact with the retired animated hero.

### Configuration window

The white feature band pairs the resource summary with a line-numbered, locally defined minimal function YAML excerpt. Violet highlights keys; values remain neutral. A copy action copies the exact excerpt. The caption directs readers to the full resource reference rather than presenting the excerpt as a full-stack sample.

### Expanded content and console capture

White and mist sections use ruled feature groups, deployment planning, local workflow, API/full-stack/scheduled use cases, and an Apache-2.0 band. The team section uses localized captures of the real console components with example workspace and resource data. Preserve the actual icon rail, workspace/stage selectors, summary cards, search fields, and service/resource tables; do not redraw an invented console. The two 1280×900 JPEGs retain the product UI's own visual treatment, including semantic status colors. Each stays below 70KB, loads lazily with explicit dimensions and useful alt text, and has a labeled full-size link. No production account or customer data appears. The original dark CLI sequence and team section provide a deliberate midpoint.

### Pricing and FAQs

The homepage mist band explains “Pay as you go. Grow at your pace.” in two columns. Copy introduces the free allowance, then managed resource usage in AMR, followed by one short paragraph covering Developer personal projects, the Team subscription's included resources and collaboration, and Enterprise tailored requirements. One monochrome link opens the localized dedicated pricing page. The static right-hand figure uses Alibaba Cloud resource weights from `usePricing.ts`: one function, one bucket, and one database table total 3 AMR per month with the current payload. Its caption marks the example as illustrative and points to stage eligibility and monthly counting rules. Cloud infrastructure is billed separately.

The homepage has no plan cards, prices, quotas, billing toggle, or plan actions. It continues to share `usePricing.ts` for resource weights but no longer uses `pricing-utils.mjs` annual-price calculations. The dedicated pricing page retains its full plan details and existing calculations. Its editorial hero leads into flat (4px) plan cards, with a violet border and small label for Team, monochrome actions before feature lists, a ruled resource table, coverage rows, billing rules, and native disclosures. Monthly and annual buttons expose their selected state through `aria-pressed`; annual remains the initial selection. Prices, allowances, AMR weights, and billing math continue to come from the existing shared pricing data and utilities. Six native homepage disclosure FAQs follow on white; the first opens initially. English and Chinese answers direct readers to dedicated pricing rather than referring to prices or allowances above.

## Do's and Don'ts

### Do:

- **Do** preserve neutral display text, monochrome primary actions, and restrained violet interaction cues.
- **Do** preserve the fixed landing theme and alternating dark, white, and mist bands across both locales.
- **Do** keep examples truthful, provider limitations explicit, and Chinese and English behavior equivalent.
- **Do** retain keyboard controls, visible focus, status text, and reduced-motion support.

### Don't:

- **Don't** infer customer proof, compliance, enterprise features, pricing, or cloud parity from the visual style.
- **Don't** use green to decorate deployment status, or vendor color for site chrome.
- **Don't** add decorative imagery, gradient display text, glass panels, or broad violet fills to this landing.
- **Don't** force the homepage's fixed palette or composition onto inner pages; preserve their native theme controls, sidebar, outline, and reading structure.


### Motion and continuity

The homepage guides attention through the illustrative deployment-plan rows, then gateway to function to storage, in a bounded sequence lasting 3.85 seconds. Existing values and diagram labels remain unchanged. The sequence starts once when the diagram becomes visible, including below the mobile fold. A localized, keyboard-operable replay button repeats the workflow and returns to the deployment-plan tab; its server-rendered markup keeps footer dimensions stable during hydration.

Headline lines enter over 720ms with 28px travel and a capped stagger. The deployment panel and three product artifacts (configuration, stage example, console capture) enter once when visible. Mobile uses vertical travel to avoid horizontal overflow. Surrounding prose remains still. Pricing uses the same arrival timing. Documentation and legal pages have no initial choreography. Arriving from home or pricing reveals the content over 420ms with 16px of vertical travel and introduces the sidebar navigation separately, while the shared header stays anchored. Navigation between reading pages uses only a 220ms opacity change.

Billing uses a sliding selection thumb and brief feedback on the updated amount. Deployment tabs use an animated underline and short content feedback. Prices and selected states update immediately. Menus, sidebars, copy feedback, disclosures, button presses, and directional link arrows share quick interaction timing. Keyboard focus and native controls remain authoritative.

CSS and the browser Web Animations API require no added dependency. One observer per marketing route unobserves each target after arrival. Route changes, unmount, hidden pages, and reduced-motion preference changes cancel animations and disconnect observers. Default content stays visible without enhancement. Reduced motion removes entrances, workflow animation, and replay while retaining immediate controls and brief state feedback. There are no loops, permanent will-change layers, or layout-property animation. The numbered CLI workflow follows local development, validation, then deployment in both languages.
