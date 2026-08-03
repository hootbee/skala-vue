# Product UI and Engineering Guidelines

## Scope and Priority

These guidelines apply to every page, view, component, state, and visual revision in this Vue weather portal. Follow them unless an explicit user request or assignment requirement conflicts with them. Explicit requirements take priority, but preserve the remaining guidance wherever possible.

The product is a calm, content-first weather archive for exploring regional weather information. Do not copy the visual identity or proprietary layouts of any named product; apply the underlying principles in a way that fits this project.

## Product Direction

- Make weather information understandable before making it decorative.
- Give each screen one clear purpose: the home view helps users search and compare cities, the detail view explains one city's current conditions, the about view explains the service.
- Show the most useful weather information first: city, condition, temperature, and the next relevant action.
- Keep the interface friendly, calm, and easy to scan with a restrained blue palette.
- Prefer progressive disclosure: keep comparison details on the home page and reveal fuller observations on the city detail page.

## UX Principles

- Use concise Korean copy that matches the user's vocabulary and avoids technical jargon.
- Make search, unit switching, city selection, and detail navigation obvious without extra explanation.
- Keep navigation consistent across `/`, `/about`, and `/weather/:cityId`.
- Preserve search input and user context while navigating or changing the temperature unit.
- Provide clear empty, loading, error, and unavailable-city states whenever live weather data is introduced.
- Explain API or network failures in plain language and provide a recovery action where possible.
- Use sensible defaults: Celsius, the existing city list, and the home route.

## Visual Hierarchy

- Use one dominant `h1` per view and a logical heading order below it.
- Prioritize city names, current conditions, temperatures, and primary actions over decorative symbols.
- Use whitespace and grouping before adding borders, containers, or shadows.
- Use cards for independently selectable weather items or focused panels only; do not place every section in a card.
- Keep page width, spacing, typography, border radius, borders, and shadows consistent across views.
- Use color consistently, and never use color as the only indicator of weather severity, selection, or status.
- Keep text readable at comfortable line lengths and maintain strong contrast against the pale background.

## Interaction and Component Rules

- Links navigate (`RouterLink`); buttons perform actions such as unit changes or detail commands.
- Use native controls whenever they satisfy the requirement.
- Every interactive component must have a clear label and visible default, hover, focus, active, disabled, loading, and error states when applicable.
- Keep hit targets comfortably usable on touch screens and provide enough space between adjacent controls.
- Use `@click.stop` only when it prevents an intentional event conflict, such as a detail button inside a selectable weather card.
- Keep components focused and predictable:
  - `WeatherHomeView.vue` owns home-page state, filtering, and selection.
  - `WeatherDetailView.vue` owns route-based city details.
  - `UnitToggler.vue` changes the Pinia configuration state.
  - `BaseDashboardCard.vue`, `SearchBar.vue`, and `WeatherCard.vue` provide reusable exercise components.
- Keep shared configuration in `src/stores/configStore.js`; do not duplicate Celsius/Fahrenheit conversion logic in views.
- Keep API calls in `src/services/` and read credentials from Vite environment variables. Never commit real API keys.

## Accessibility Requirements

- Prefer semantic HTML (`nav`, `main`, `header`, `section`, `form`, `label`, and `button`) before adding ARIA.
- Ensure every view has a unique, meaningful page title and one clear `h1`.
- Associate every input with a persistent visible label; placeholder text must not be the only label.
- Keep keyboard order consistent with visual order. Cards must remain usable by keyboard, and links/buttons must be reachable and activatable without a pointer.
- Provide a visible, high-contrast `:focus-visible` indicator for all interactive elements.
- Announce search results, selection changes, loading, and errors with an appropriate status region when needed.
- Do not rely only on color, icon shape, position, or motion to communicate weather status.
- Target WCAG 2.2 AA contrast: at least 4.5:1 for normal text and 3:1 for large text and essential interface graphics.
- Ensure content reflows at 200% zoom and remains usable at a 375px-wide viewport without clipping or horizontal overlap.
- Respect user text sizing and `prefers-reduced-motion`; non-essential motion must be disabled or minimized.

## Motion and Feedback

- Use short, smooth transitions only to clarify hover, focus, selection, or route feedback.
- Avoid excessive rotation, bouncing, large scaling, or decorative animation.
- Never make hover the only way to discover or complete an action.
- Give immediate feedback when a city is selected or the temperature unit changes.

## Responsive Behavior

- Design and review the home, detail, about, and not-found views at desktop, tablet, and 375px mobile widths.
- Use flexible Grid and Flexbox layouts; content must not clip, overlap, or require accidental horizontal scrolling.
- Preserve task priority on small screens rather than merely shrinking desktop elements.
- Test Korean labels, long city names, empty search results, and variable weather descriptions.

## Data and State Conventions

- Keep raw weather temperatures in Celsius internally and format them only at the display boundary through the Pinia config store.
- Keep `unit` values explicit and stable (`celsius` or `fahrenheit`).
- Treat Mock data and OpenWeatherMap responses as separate concerns; normalize external data before passing it to presentation components.
- Represent loading, success, empty, and error states explicitly when replacing Mock data with Axios requests.
- Keep route parameters validated and show a useful not-found state for unknown city IDs.

## Review Checklist

Before considering a UI change complete:

- Confirm the primary purpose and content hierarchy of the affected view.
- Check desktop and 375px mobile layouts for clipping, overlap, and readable spacing.
- Test keyboard navigation, focus visibility, form labels, and status announcements.
- Test Celsius/Fahrenheit switching on both the home cards and detail view.
- Check empty search results, unknown city routes, and API failure states when relevant.
- Verify reduced-motion behavior and maintain the calm blue visual system.
- Run `npm run build` and review the final diff for unrelated changes.
