export const STEP_SPACING = 105;
export function advanceScroll(offset, speed, dt) {
  return (offset + speed * dt) % STEP_SPACING;
}
