# UI/UX Design and Implementation Guidelines

## Product Intent

Build this portal as a content-first personal archive that makes complex information easy and comfortable to explore. The interface should help users understand what is available, what matters most, and what they can do next without unnecessary effort.

## Core Principles

### Simple, Clear Structure

- Give each screen one primary purpose.
- Establish a clear hierarchy between the page title, supporting description, content, and actions.
- Prefer familiar layouts and concise labels over decorative or ambiguous presentation.

### Low Cognitive Load

- Remove redundant explanations, controls, and visual decoration.
- Make the next useful action obvious without requiring users to deliberate.
- Keep related information together and avoid making users repeatedly switch context.

### Content Comes First

- Prioritize real content such as classes, profile information, trips, and recent updates over cards, effects, and ornamental UI.
- Use visual treatments to support comprehension, not to compete with the content.
- Do not introduce a card layout where a table, grouped information layout, or image-led layout is more appropriate.

### Consistent Visual System

- Use a calm blue palette as the primary visual language.
- Keep page width, spacing, typography, border radius, border treatment, and shadows consistent across pages.
- Define reusable styles and components when the same visual rule appears in multiple places.

### Purposeful Page Differentiation

- Use a table-oriented layout for schedules and timetables.
- Use grouped information sections for profiles.
- Use a photo-first layout for travel albums.
- Let the content type determine the layout; do not force every page into an identical card grid.

### Predictable Interaction

- Use links for navigation and buttons for actions.
- Make interactive elements visually distinct from static content.
- Preserve expected browser behavior such as keyboard focus, Enter activation, and clear hover states.
- Keep navigation labels and destinations consistent throughout the portal.

### Restrained Motion

- Use hover and transition effects only when they clarify feedback or support an interaction.
- Prefer fast, smooth transitions.
- Avoid excessive rotation, scaling, bouncing, or attention-stealing animation.
- Respect `prefers-reduced-motion` and disable non-essential motion when requested.

### Responsive Layout

- Design for desktop, tablet, and a 375px-wide mobile viewport.
- Use flexible Grid and Flexbox layouts so content does not clip, overlap, or require accidental horizontal scrolling.
- Test long labels, Korean text, narrow screens, and variable content lengths.
- Keep touch targets comfortably usable on mobile devices.

### Accessibility First

- Use semantic HTML elements and a logical heading hierarchy.
- Provide visible, high-contrast focus indicators for keyboard users.
- Ensure all interactive controls are keyboard accessible and have clear accessible names.
- Maintain sufficient color contrast and do not communicate meaning through color alone.
- Associate form labels with their controls and provide useful status or error messages.
- Support `prefers-reduced-motion` for all non-essential animation.

## Implementation Rules

- Start from the content hierarchy and user task before choosing visual components.
- Keep page-level layout decisions in page or view components and shared visual rules in reusable components.
- Avoid adding visual complexity unless it improves comprehension, navigation, or feedback.
- When reviewing UI changes, check both the default desktop view and a 375px mobile viewport.
- Verify keyboard navigation, focus visibility, responsive behavior, and reduced-motion behavior for interactive changes.
