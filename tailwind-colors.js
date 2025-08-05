// tailwind-colors.js (or directly in tailwind.config.js extend.colors)
const colors = require("tailwindcss/colors");

module.exports = {
  // Use Tailwind's default dark mode shades for a smooth transition.
  // Nuxt UI components will pick these up via `primary: 'emerald'` and `gray: 'slate'`.
  // We explicitly list them here for full control over the extended palette.
  emerald: colors.emerald,
  slate: colors.slate,
  blue: colors.blue,
  amber: colors.amber,
  rose: colors.rose,

  // Define semantic colors for dark theme consistency
  // These will be used directly in your component classes
  background: colors.slate[900], // Darkest for the body
  surface: colors.slate[800], // Slightly lighter for cards/panels
  "surface-alt": colors.slate[700], // Even lighter for nested elements/hover states
  border: colors.slate[700], // For borders and dividers

  "text-light": colors.slate[200], // Primary text color on dark backgrounds
  "text-mid": colors.slate[400], // Secondary/helper text
  "text-dark": colors.slate[900], // For text on light backgrounds (if any)

  // Status colors (can map to existing Tailwind colors or custom shades)
  success: colors.emerald,
  info: colors.blue,
  warning: colors.amber,
  danger: colors.rose,
};
