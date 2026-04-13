// Waveform.
export const resolution = 15
export const fillColor = {
  r: 107,
  g: 114,
  b: 128,
}
export const preload = 10
export const blockDuration = 20
export const widthScale = 0.8

// Subtitle cards.
export const cardOverscanHeight = 200

// Horizontal "safe" insets at the left/right edges of a panel where pointer
// interactions should be ignored — used to avoid fighting with adjacent
// resizable separator hit zones (react-resizable-panels uses ~27px hit area
// for fine pointers; half on each side).
export const LEFT_SAFE_AREA = 14
export const RIGHT_SAFE_AREA = 14
