import type { AddressType, StepType } from './guidance';

export interface StepTypeConfig {
  type: StepType;
  orderHint: string;
  orderIndex: number;
}

export interface AddressTypeConfig {
  stepTypes: StepTypeConfig[];
  requiresMetadata: boolean;
  metadataFields?: ('buildingNumber' | 'floorNumber' | 'doorNumber')[];
}

export const ADDRESS_TYPE_STEP_CONFIG: Record<AddressType, AddressTypeConfig> = {
  APARTMENT_BUILDING: {
    stepTypes: [
      { type: 'LOCATION_CHECK', orderHint: 'Usually 1st', orderIndex: 1 },
      { type: 'LANDMARK_REFERENCE', orderHint: 'Usually 2nd', orderIndex: 2 },
      { type: 'PARKING_LOCATION', orderHint: 'Usually 3rd', orderIndex: 3 },
      { type: 'BUILDING_ENTRY', orderHint: 'Usually 4th', orderIndex: 4 },
      { type: 'RECEPTION_OR_SECURITY', orderHint: 'Usually 5th', orderIndex: 5 },
      { type: 'LOBBY_NAVIGATION', orderHint: 'Usually 6th', orderIndex: 6 },
      { type: 'ELEVATOR_ENTRY', orderHint: 'Usually 7th', orderIndex: 7 },
      { type: 'STAIRS_ENTRY', orderHint: 'Alternative to elevator', orderIndex: 7 },
      { type: 'FLOOR_NUMBER', orderHint: 'Usually 8th', orderIndex: 8 },
      { type: 'CORRIDOR_OR_PATH', orderHint: 'Usually 9th', orderIndex: 9 },
      { type: 'DOOR_IDENTIFICATION', orderHint: 'Usually 10th', orderIndex: 10 },
      { type: 'DROP_OFF_POINT', orderHint: 'Usually last', orderIndex: 11 },
      { type: 'OTHER', orderHint: 'Anytime', orderIndex: 99 },
    ],
    requiresMetadata: true,
    metadataFields: ['buildingNumber', 'floorNumber', 'doorNumber'],
  },

  VILLA: {
    stepTypes: [
      { type: 'LOCATION_CHECK', orderHint: 'Usually 1st', orderIndex: 1 },
      { type: 'LANDMARK_REFERENCE', orderHint: 'Usually 2nd', orderIndex: 2 },
      { type: 'GATE_ENTRY', orderHint: 'Usually 3rd', orderIndex: 3 },
      { type: 'PARKING_LOCATION', orderHint: 'Usually 4th', orderIndex: 4 },
      { type: 'UNIT_OR_DOOR_IDENTIFICATION', orderHint: 'Usually 5th', orderIndex: 5 },
      { type: 'DROP_OFF_POINT', orderHint: 'Usually last', orderIndex: 6 },
      { type: 'OTHER', orderHint: 'Anytime', orderIndex: 99 },
    ],
    requiresMetadata: false,
  },

  RESIDENTIAL_COMPOUND: {
    stepTypes: [
      { type: 'LOCATION_CHECK', orderHint: 'Usually 1st', orderIndex: 1 },
      { type: 'LANDMARK_REFERENCE', orderHint: 'Usually 2nd', orderIndex: 2 },
      { type: 'PARKING_LOCATION', orderHint: 'Usually 3rd', orderIndex: 3 },
      { type: 'GATE_ENTRY', orderHint: 'Usually 4th', orderIndex: 4 },
      { type: 'RECEPTION_OR_SECURITY', orderHint: 'Usually 5th', orderIndex: 5 },
      { type: 'CORRIDOR_OR_PATH', orderHint: 'Usually 6th', orderIndex: 6 },
      { type: 'BUILDING_ENTRY', orderHint: 'Usually 7th', orderIndex: 7 },
      { type: 'FLOOR_NAVIGATION', orderHint: 'Usually 8th', orderIndex: 8 },
      { type: 'UNIT_OR_DOOR_IDENTIFICATION', orderHint: 'Usually 9th', orderIndex: 9 },
      { type: 'DROP_OFF_POINT', orderHint: 'Usually last', orderIndex: 10 },
      { type: 'OTHER', orderHint: 'Anytime', orderIndex: 99 },
    ],
    requiresMetadata: false,
  },

  OFFICE_BUILDING: {
    stepTypes: [
      { type: 'LOCATION_CHECK', orderHint: 'Usually 1st', orderIndex: 1 },
      { type: 'LANDMARK_REFERENCE', orderHint: 'Usually 2nd', orderIndex: 2 },
      { type: 'PARKING_LOCATION', orderHint: 'Usually 3rd', orderIndex: 3 },
      { type: 'GATE_ENTRY', orderHint: 'Usually 4th', orderIndex: 4 },
      { type: 'BUILDING_ENTRY', orderHint: 'Usually 5th', orderIndex: 5 },
      { type: 'RECEPTION_OR_SECURITY', orderHint: 'Usually 6th', orderIndex: 6 },
      { type: 'LOBBY_NAVIGATION', orderHint: 'Usually 7th', orderIndex: 7 },
      { type: 'ELEVATOR_ENTRY', orderHint: 'Usually 8th', orderIndex: 8 },
      { type: 'FLOOR_NUMBER', orderHint: 'Usually 9th', orderIndex: 9 },
      { type: 'CORRIDOR_OR_PATH', orderHint: 'Usually 10th', orderIndex: 10 },
      { type: 'UNIT_OR_DOOR_IDENTIFICATION', orderHint: 'Usually 11th', orderIndex: 11 },
      { type: 'DROP_OFF_POINT', orderHint: 'Usually last', orderIndex: 12 },
      { type: 'OTHER', orderHint: 'Anytime', orderIndex: 99 },
    ],
    requiresMetadata: true,
    metadataFields: ['buildingNumber', 'floorNumber', 'doorNumber'],
  },

  OTHER: {
    stepTypes: [
      { type: 'LOCATION_CHECK', orderHint: 'Usually 1st', orderIndex: 1 },
      { type: 'LANDMARK_REFERENCE', orderHint: 'Usually 2nd', orderIndex: 2 },
      { type: 'PARKING_LOCATION', orderHint: 'Usually 3rd', orderIndex: 3 },
      { type: 'DROP_OFF_POINT', orderHint: 'Usually last', orderIndex: 4 },
      { type: 'OTHER', orderHint: 'Anytime', orderIndex: 99 },
    ],
    requiresMetadata: false,
  },
};

export function getStepTypesForAddressType(addressType: AddressType): StepTypeConfig[] {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].stepTypes;
}

export function requiresMetadata(addressType: AddressType): boolean {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].requiresMetadata;
}

export function getMetadataFields(addressType: AddressType): ('buildingNumber' | 'floorNumber' | 'doorNumber')[] {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].metadataFields || [];
}
