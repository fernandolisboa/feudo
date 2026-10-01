export type Box = { top: number; left: number; width: number; height: number };

export const SPOTLIGHT_PADDING = 6;

// A target taller than half the viewport (a whole section, a long table) is
// cut down to its top part, so the card anchored to it still has room on
// screen instead of being pushed below the fold.
const MAX_HEIGHT_RATIO = 0.5;

export function spotlightBox(target: Box, viewportHeight: number): Box {
  const height = target.height + SPOTLIGHT_PADDING * 2;
  return {
    top: target.top - SPOTLIGHT_PADDING,
    left: target.left - SPOTLIGHT_PADDING,
    width: target.width + SPOTLIGHT_PADDING * 2,
    height: Math.min(height, Math.round(viewportHeight * MAX_HEIGHT_RATIO)),
  };
}
