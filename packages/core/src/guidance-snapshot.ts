import type { GuidanceStep, StepPublishedSnapshot } from '@guidenav/types';

export function buildStepPublishedSnapshot(
  step: Pick<
    GuidanceStep,
    | 'stepType'
    | 'contentType'
    | 'title'
    | 'instructionOriginal'
    | 'instructionTranslations'
    | 'image'
    | 'overlays'
    | 'isRequired'
    | 'locationData'
  >,
): StepPublishedSnapshot {
  return {
    stepType: step.stepType,
    contentType: step.contentType,
    title: step.title ?? null,
    instructionOriginal: step.instructionOriginal,
    instructionTranslations: step.instructionTranslations ?? {},
    image: step.image ?? null,
    overlays: step.overlays ?? [],
    isRequired: step.isRequired ?? true,
    locationData: step.locationData ?? null,
  };
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce<Record<string, unknown>>((sorted, k) => {
          sorted[k] = val[k];
          return sorted;
        }, {});
    }
    return val;
  });
}

export function stepDiffersFromSnapshot(step: GuidanceStep): boolean {
  const snapshot = step.publishedSnapshot;
  if (!snapshot) {
    return false;
  }
  const current = buildStepPublishedSnapshot(step);
  return stableJson(current) !== stableJson(snapshot);
}

/** True when a published guidance set has step edits not yet republished for couriers */
export function hasUnpublishedStepChanges(steps: GuidanceStep[]): boolean {
  return steps.some((step) => {
    if (step.publishedSnapshot === null) {
      return true;
    }
    if (step.publishedSnapshot === undefined) {
      return false;
    }
    return stepDiffersFromSnapshot(step);
  });
}
