# Implementation notes

## Current behavior

All player-facing copy is English: landing page, instructions, score units, results, pause screen, tooltips, accessibility labels, document title, metadata, and live announcements. The original Korean whitepaper is a historical reference.

The camera is orthogonal: vertical rails/grooves, horizontal step seams and comb plate, vertical player movement. The body-center ingestion line is Y=674. There is no gore.

## Seamless belt motion

The old renderer wrapped accumulated travel at 1000px while the visible steps repeated every 105px. Those periods did not match, producing a discontinuity when the accumulator wrapped. Both offset wrapping and step rendering now use `STEP_SPACING = 105` from `src/motion.js`. Visible seams move at a constant 70px/s through every wrap. Character animation phase is also accumulated, avoiding jumps when the animation rate changes.

## Fatigue replaces forced acceleration

The previous staged belt speeds and random spikes have been removed. No survival deadline exists. Only 0.18 seconds of continuous contact with the ingestion line ends the run.

- Baseline holding effort: 85px/s before fatigue.
- Each fresh press: +28 effort, with exponential decay over 0.65 seconds.
- Movement effort: the greater of holding effort and accumulated tap effort.
- Efficiency: `1 / (1 + elapsed / 60)` using actual survival time, excluding score bonuses.
- Target speed: effort times efficiency. Bursts are also affected by fatigue.
- More presses can compensate for reduced efficiency; tap effort has no artificial rate cap.
- Sweat starts gradually, even away from the teeth. More fatigue adds drops, heavier breathing, and mild lateral movement. Motion-reduction settings suppress breathing scale and lateral shake and show stationary sweat.
- Pausing freezes time, effort decay, and fatigue. Restarting resets all three.

Holding alone still eventually loses ground. This is the result of fatigue and position, not a randomly selected death time. Actual players will have a practical tapping limit; the simulation imposes no maximum session length.

## Verification

15 automated tests cover core physics, burst cost/cooldown, ingestion grace, escape bonuses, pause/restart, invalid storage, fatigue compensation, input events, and loop continuity.

Specific regressions:

- Ten taps per second without holding survive 60 seconds in simulation.
- Input increasing with fatigue survives three minutes in simulation without moving the character manually or suppressing collision.
- Fifteen units of effort at 30 seconds match ten units at the start.
- A two-minute scroll simulation checks every frame, including the old 1000px reset boundaries.
- Real key/pointer events add effort; keyboard auto-repeat does not; pointer cancellation and focus loss release input.

These synthetic input rates validate the mechanics, not human endurance or touch-device usability. Real iOS/Android playtesting and audio listening remain separate checks.

Browser review confirmed English title/pause/result screens at mobile sizes, no Korean text remaining in runtime source, and no console errors during the checked flow. A temporary renderer comparison was used to inspect the fresh, 30-second, and 90-second fatigue/sweat states, then removed.

## Scope

Local personal best, result commentary, 1.5-second non-gory death animation, instant retry, pause, synthesized audio, and responsive layout are included. Accounts, online leaderboards, NPCs, skins, and share cards are not included.
