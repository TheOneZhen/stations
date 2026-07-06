/**
 * Tunable animation timing constants for the slide transition effect.
 * Durations and delays are expressed in seconds unless noted otherwise.
 */
export const MIN_DURATION = 0.8;
export const MAX_DURATION = 1.2;
/** Horizontal stagger: faces farther right start later. */
export const MAX_DELAY_X = 0.9;
/** Vertical stagger magnitude for in/out phases. */
export const MAX_DELAY_Y = 0.125;
/** Random jitter added to each face delay (scaled by face duration). */
export const STRETCH = 0.11;

/** Default slide plane size in world units. */
export const DEFAULT_SLIDE_WIDTH = 100;
export const DEFAULT_SLIDE_HEIGHT = 60;

export const DEFAULT_FOV = 80;
export const DEFAULT_CAMERA_Z = 60;

/** GSAP timeline length for one full play-through of the effect. */
export const TWEEN_DURATION = 3;
export const REPEAT_DELAY = 1;
/** Mouse/touch scrub sensitivity (progress delta per pixel). */
export const SCRUB_SEEK_SPEED = 0.001;
