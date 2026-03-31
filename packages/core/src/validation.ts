import {
  MAX_STEPS_PER_GUIDANCE,
  IMAGE_CONSTRAINTS,
  type GuidanceStep,
  type AddressType,
  ADDRESS_TYPE_STEP_CONFIG,
} from '@guidenav/types';

export function validateStepCount(currentCount: number): { valid: boolean; error?: string } {
  if (currentCount >= MAX_STEPS_PER_GUIDANCE) {
    return {
      valid: false,
      error: `Maximum ${MAX_STEPS_PER_GUIDANCE} steps allowed per guidance set`,
    };
  }
  return { valid: true };
}

export function validateImageFile(file: {
  size: number;
  type: string;
  width?: number;
  height?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (file.size > IMAGE_CONSTRAINTS.maxFileSizeBytes) {
    const maxMB = IMAGE_CONSTRAINTS.maxFileSizeBytes / (1024 * 1024);
    errors.push(`File size exceeds ${maxMB}MB limit`);
  }

  if (!IMAGE_CONSTRAINTS.supportedMimeTypes.includes(file.type as any)) {
    errors.push(`Unsupported file type. Allowed: JPEG, PNG, WebP`);
  }

  if (file.width && file.width > IMAGE_CONSTRAINTS.maxWidth) {
    errors.push(`Image width exceeds ${IMAGE_CONSTRAINTS.maxWidth}px limit`);
  }

  if (file.height && file.height > IMAGE_CONSTRAINTS.maxHeight) {
    errors.push(`Image height exceeds ${IMAGE_CONSTRAINTS.maxHeight}px limit`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateGuidanceTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();
  if (!trimmed) {
    return { valid: false, error: 'Title is required' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Title must be 100 characters or less' };
  }
  return { valid: true };
}

export function validateStepTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();
  if (!trimmed) {
    return { valid: false, error: 'Step title is required' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Step title must be 100 characters or less' };
  }
  return { valid: true };
}

export function validateStepInstructions(instructions: string): { valid: boolean; error?: string } {
  const trimmed = instructions.trim();
  if (!trimmed) {
    return { valid: false, error: 'Instructions are required' };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: 'Instructions must be 500 characters or less' };
  }
  return { valid: true };
}

export function validateBuildingMetadata(
  addressType: AddressType,
  metadata: {
    buildingNumber?: string;
    floorNumber?: string;
    doorNumber?: string;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = ADDRESS_TYPE_STEP_CONFIG[addressType];
  
  if (!config.requiresMetadata) {
    return { valid: true, errors: [] };
  }
  
  const metadataFields = config.metadataFields || [];
  
  if (metadataFields.includes('buildingNumber') && !metadata.buildingNumber?.trim()) {
    errors.push('Building number is required');
  }
  
  if (metadataFields.includes('floorNumber') && !metadata.floorNumber?.trim()) {
    errors.push('Floor number is required');
  }
  
  if (metadataFields.includes('doorNumber') && !metadata.doorNumber?.trim()) {
    errors.push('Door/Unit number is required');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateStepOrder(steps: GuidanceStep[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (steps.length === 0) {
    return { valid: true, errors: [] };
  }

  const firstStep = steps.find((s) => s.stepIndex === 0);
  const lastStep = steps.reduce((max, s) => (s.stepIndex > max.stepIndex ? s : max), steps[0]);

  if (firstStep && firstStep.stepType !== 'LOCATION_CHECK') {
    errors.push('First step should be LOCATION_CHECK');
  }

  if (lastStep && lastStep.stepType !== 'DROP_OFF_POINT') {
    errors.push('Last step should be DROP_OFF_POINT');
  }

  return { valid: errors.length === 0, errors };
}
