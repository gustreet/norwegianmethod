/** Hard limits — change only with matching test updates. */

export const LAP_CLASS = {
  workMetersMin: 350,
  workMetersAltMin: 300,
  workSecondsAltMin: 60,
  recoveryMetersMax: 120,
  recoverySecondsMax: 45,
} as const;

export const COPELAND = {
  /** Max HR at or above LTHR counts as a crossing. */
  lthrCrossBorderlineCount: 1,
  lthrCrossFailCount: 3,
  lthrCrossWarnShare: 0.4,
  paceDriftBorderlinePct: 6,
  paceDriftFlagPct: 8,
  paceDriftFailPct: 12,
  paceDriftFlagMinReps: 10,
  recoveryShortSec: 35,
  recoveryHotHrBelowLthr: 5,
  recoveryHotShare: 0.5,
  earlyConservativeBelowLthr: 20,
  earlyConservativeMinReps: 6,
  earlySubThresholdWindowReps: 3,
  earlySubThresholdBelowLthr: 8,
} as const;

export const BAKKEN = {
  targetRepCountMin: 20,
  targetRepCountMax: 25,
  classicRecoverySec: 30,
  recoveryToleranceSec: 10,
  /** Rep pace slower than rep-1 by more than this % counts as a miss. */
  paceMissSlowPct: 3,
  /** Rep pace faster than rep-1 by more than this % counts as a hot miss. */
  paceMissFastPct: 2,
  consecutiveMissStop: 2,
  lthrCrossBorderlineCount: 1,
  lthrCrossFailCount: 3,
  paceDriftBorderlinePct: 6,
  paceDriftFailPct: 12,
  paceCvBorderlinePct: 4,
  trackRepCountMin: 8,
  trackRepCountMax: 25,
} as const;
