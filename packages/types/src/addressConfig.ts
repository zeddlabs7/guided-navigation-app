import type { AddressType, StepType } from './guidance';

export interface StepTypeConfig {
  type: StepType;
  orderHint: string;
  orderIndex: number;
}

export type MetadataFieldType = 
  | 'buildingNumber' 
  | 'floorNumber' 
  | 'doorNumber'
  | 'compoundName'
  | 'gateNumber'
  | 'unitType'
  | 'villaNumber'
  | 'apartmentNumber'
  | 'locationDescription';

export type UnitType = 'villa' | 'apartment';

export interface MetadataFieldConfig {
  field: MetadataFieldType;
  label: { en: string; ar: string };
  placeholder: { en: string; ar: string };
  required: boolean;
  dependsOn?: { field: MetadataFieldType; value: string };
}

export interface AddressTypeConfig {
  stepTypes: StepTypeConfig[];
  requiresMetadata: boolean;
  metadataFields?: MetadataFieldType[];
  metadataFieldConfigs?: MetadataFieldConfig[];
  sectionTitle?: { en: string; ar: string };
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
    metadataFieldConfigs: [
      {
        field: 'buildingNumber',
        label: { en: 'Building Number', ar: 'رقم المبنى' },
        placeholder: { en: 'e.g. Building 5, Tower A', ar: 'مثال: مبنى 5، برج أ' },
        required: true,
      },
      {
        field: 'floorNumber',
        label: { en: 'Floor Number', ar: 'رقم الطابق' },
        placeholder: { en: 'e.g. 12, Ground Floor, Basement 1', ar: 'مثال: 12، الطابق الأرضي، القبو 1' },
        required: true,
      },
      {
        field: 'doorNumber',
        label: { en: 'Door / Unit Number', ar: 'رقم الباب / الوحدة' },
        placeholder: { en: 'e.g. Apartment 1205, Unit 3B', ar: 'مثال: شقة 1205، وحدة 3ب' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Building Details', ar: 'تفاصيل المبنى' },
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
    requiresMetadata: true,
    metadataFields: ['villaNumber'],
    metadataFieldConfigs: [
      {
        field: 'villaNumber',
        label: { en: 'Villa Number', ar: 'رقم الفيلا' },
        placeholder: { en: 'e.g. Villa 25, House 12A', ar: 'مثال: فيلا 25، منزل 12أ' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Villa Details', ar: 'تفاصيل الفيلا' },
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
    requiresMetadata: true,
    metadataFields: ['compoundName', 'gateNumber', 'unitType', 'buildingNumber', 'floorNumber', 'apartmentNumber', 'villaNumber'],
    metadataFieldConfigs: [
      {
        field: 'compoundName',
        label: { en: 'Compound Name', ar: 'اسم المجمع' },
        placeholder: { en: 'e.g. Al Raha Gardens, Arabian Ranches', ar: 'مثال: حدائق الراحة، المرابع العربية' },
        required: true,
      },
      {
        field: 'gateNumber',
        label: { en: 'Gate Number / Name', ar: 'رقم / اسم البوابة' },
        placeholder: { en: 'e.g. Gate 3, Main Entrance', ar: 'مثال: بوابة 3، المدخل الرئيسي' },
        required: true,
      },
      {
        field: 'unitType',
        label: { en: 'Unit Type', ar: 'نوع الوحدة' },
        placeholder: { en: 'Select unit type', ar: 'اختر نوع الوحدة' },
        required: true,
      },
      {
        field: 'buildingNumber',
        label: { en: 'Building Number', ar: 'رقم المبنى' },
        placeholder: { en: 'e.g. Building 5, Tower A', ar: 'مثال: مبنى 5، برج أ' },
        required: true,
        dependsOn: { field: 'unitType', value: 'apartment' },
      },
      {
        field: 'floorNumber',
        label: { en: 'Floor Number', ar: 'رقم الطابق' },
        placeholder: { en: 'e.g. 12, Ground Floor', ar: 'مثال: 12، الطابق الأرضي' },
        required: true,
        dependsOn: { field: 'unitType', value: 'apartment' },
      },
      {
        field: 'apartmentNumber',
        label: { en: 'Apartment Number', ar: 'رقم الشقة' },
        placeholder: { en: 'e.g. Apartment 1205, Unit 3B', ar: 'مثال: شقة 1205، وحدة 3ب' },
        required: true,
        dependsOn: { field: 'unitType', value: 'apartment' },
      },
      {
        field: 'villaNumber',
        label: { en: 'Villa Number', ar: 'رقم الفيلا' },
        placeholder: { en: 'e.g. Villa 25, House 12A', ar: 'مثال: فيلا 25، منزل 12أ' },
        required: true,
        dependsOn: { field: 'unitType', value: 'villa' },
      },
    ],
    sectionTitle: { en: 'Compound Details', ar: 'تفاصيل المجمع' },
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
    metadataFieldConfigs: [
      {
        field: 'buildingNumber',
        label: { en: 'Building Number', ar: 'رقم المبنى' },
        placeholder: { en: 'e.g. Building 5, Tower A', ar: 'مثال: مبنى 5، برج أ' },
        required: true,
      },
      {
        field: 'floorNumber',
        label: { en: 'Floor Number', ar: 'رقم الطابق' },
        placeholder: { en: 'e.g. 12, Ground Floor, Basement 1', ar: 'مثال: 12، الطابق الأرضي، القبو 1' },
        required: true,
      },
      {
        field: 'doorNumber',
        label: { en: 'Office / Unit Number', ar: 'رقم المكتب / الوحدة' },
        placeholder: { en: 'e.g. Office 501, Suite 3B', ar: 'مثال: مكتب 501، جناح 3ب' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Office Details', ar: 'تفاصيل المكتب' },
  },

  OTHER: {
    stepTypes: [
      { type: 'LOCATION_CHECK', orderHint: 'Usually 1st', orderIndex: 1 },
      { type: 'LANDMARK_REFERENCE', orderHint: 'Usually 2nd', orderIndex: 2 },
      { type: 'PARKING_LOCATION', orderHint: 'Usually 3rd', orderIndex: 3 },
      { type: 'DROP_OFF_POINT', orderHint: 'Usually last', orderIndex: 4 },
      { type: 'OTHER', orderHint: 'Anytime', orderIndex: 99 },
    ],
    requiresMetadata: true,
    metadataFields: ['locationDescription'],
    metadataFieldConfigs: [
      {
        field: 'locationDescription',
        label: { en: 'Location Description', ar: 'وصف الموقع' },
        placeholder: { en: 'e.g. Shop #15 in the mall, Warehouse B3', ar: 'مثال: متجر رقم 15 في المول، مستودع ب3' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Location Details', ar: 'تفاصيل الموقع' },
  },
};

export function getStepTypesForAddressType(addressType: AddressType): StepTypeConfig[] {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].stepTypes;
}

export function requiresMetadata(addressType: AddressType): boolean {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].requiresMetadata;
}

export function getMetadataFields(addressType: AddressType): MetadataFieldType[] {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].metadataFields || [];
}

export function getMetadataFieldConfigs(addressType: AddressType): MetadataFieldConfig[] {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].metadataFieldConfigs || [];
}

export function getMetadataSectionTitle(addressType: AddressType): { en: string; ar: string } | undefined {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].sectionTitle;
}
