import type { AddressType, StepType, TranslatedLabel } from './guidance';

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
  label: TranslatedLabel;
  placeholder: TranslatedLabel;
  required: boolean;
  dependsOn?: { field: MetadataFieldType; value: string };
}

export interface AddressTypeConfig {
  stepTypes: StepTypeConfig[];
  requiresMetadata: boolean;
  metadataFields?: MetadataFieldType[];
  metadataFieldConfigs?: MetadataFieldConfig[];
  sectionTitle?: TranslatedLabel;
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
        label: { en: 'Building Number', ar: 'رقم المبنى', hi: 'भवन संख्या', ur: 'عمارت نمبر', bn: 'ভবন নম্বর' },
        placeholder: { en: 'e.g. Building 5, Tower A', ar: 'مثال: مبنى 5، برج أ', hi: 'e.g. Building 5, Tower A', ur: 'e.g. Building 5, Tower A', bn: 'e.g. Building 5, Tower A' },
        required: true,
      },
      {
        field: 'floorNumber',
        label: { en: 'Floor Number', ar: 'رقم الطابق', hi: 'मंजिल संख्या', ur: 'منزل نمبر', bn: 'তলা নম্বর' },
        placeholder: { en: 'e.g. 12, Ground Floor, Basement 1', ar: 'مثال: 12، الطابق الأرضي، القبو 1', hi: 'e.g. 12, Ground Floor, Basement 1', ur: 'e.g. 12, Ground Floor, Basement 1', bn: 'e.g. 12, Ground Floor, Basement 1' },
        required: true,
      },
      {
        field: 'doorNumber',
        label: { en: 'Door / Unit Number', ar: 'رقم الباب / الوحدة', hi: 'दरवाज़ा / यूनिट नंबर', ur: 'دروازہ / یونٹ نمبر', bn: 'দরজা / ইউনিট নম্বর' },
        placeholder: { en: 'e.g. Apartment 1205, Unit 3B', ar: 'مثال: شقة 1205، وحدة 3ب', hi: 'e.g. Apartment 1205, Unit 3B', ur: 'e.g. Apartment 1205, Unit 3B', bn: 'e.g. Apartment 1205, Unit 3B' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Building Details', ar: 'تفاصيل المبنى', hi: 'भवन विवरण', ur: 'عمارت کی تفصیلات', bn: 'ভবনের বিবরণ' },
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
        label: { en: 'Villa Number', ar: 'رقم الفيلا', hi: 'विला नंबर', ur: 'ولا نمبر', bn: 'ভিলা নম্বর' },
        placeholder: { en: 'e.g. Villa 25, House 12A', ar: 'مثال: فيلا 25، منزل 12أ', hi: 'e.g. Villa 25, House 12A', ur: 'e.g. Villa 25, House 12A', bn: 'e.g. Villa 25, House 12A' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Villa Details', ar: 'تفاصيل الفيلا', hi: 'विला विवरण', ur: 'ولا کی تفصیلات', bn: 'ভিলার বিবরণ' },
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
        label: { en: 'Compound Name', ar: 'اسم المجمع', hi: 'परिसर का नाम', ur: 'کمپاؤنڈ کا نام', bn: 'কমপাউন্ডের নাম' },
        placeholder: { en: 'e.g. Al Raha Gardens, Arabian Ranches', ar: 'مثال: حدائق الراحة، المرابع العربية', hi: 'e.g. Al Raha Gardens, Arabian Ranches', ur: 'e.g. Al Raha Gardens, Arabian Ranches', bn: 'e.g. Al Raha Gardens, Arabian Ranches' },
        required: true,
      },
      {
        field: 'gateNumber',
        label: { en: 'Gate Number / Name', ar: 'رقم / اسم البوابة', hi: 'गेट नंबर / नाम', ur: 'گیٹ نمبر / نام', bn: 'গেট নম্বর / নাম' },
        placeholder: { en: 'e.g. Gate 3, Main Entrance', ar: 'مثال: بوابة 3، المدخل الرئيسي', hi: 'e.g. Gate 3, Main Entrance', ur: 'e.g. Gate 3, Main Entrance', bn: 'e.g. Gate 3, Main Entrance' },
        required: true,
      },
      {
        field: 'unitType',
        label: { en: 'Unit Type', ar: 'نوع الوحدة', hi: 'यूनिट प्रकार', ur: 'یونٹ کی قسم', bn: 'ইউনিটের ধরন' },
        placeholder: { en: 'Select unit type', ar: 'اختر نوع الوحدة', hi: 'Select unit type', ur: 'Select unit type', bn: 'Select unit type' },
        required: true,
      },
      {
        field: 'buildingNumber',
        label: { en: 'Building Number', ar: 'رقم المبنى', hi: 'भवन संख्या', ur: 'عمارت نمبر', bn: 'ভবন নম্বর' },
        placeholder: { en: 'e.g. Building 5, Tower A', ar: 'مثال: مبنى 5، برج أ', hi: 'e.g. Building 5, Tower A', ur: 'e.g. Building 5, Tower A', bn: 'e.g. Building 5, Tower A' },
        required: true,
        dependsOn: { field: 'unitType', value: 'apartment' },
      },
      {
        field: 'floorNumber',
        label: { en: 'Floor Number', ar: 'رقم الطابق', hi: 'मंजिल संख्या', ur: 'منزل نمبر', bn: 'তলা নম্বর' },
        placeholder: { en: 'e.g. 12, Ground Floor', ar: 'مثال: 12، الطابق الأرضي', hi: 'e.g. 12, Ground Floor', ur: 'e.g. 12, Ground Floor', bn: 'e.g. 12, Ground Floor' },
        required: true,
        dependsOn: { field: 'unitType', value: 'apartment' },
      },
      {
        field: 'apartmentNumber',
        label: { en: 'Apartment Number', ar: 'رقم الشقة', hi: 'अपार्टमेंट नंबर', ur: 'اپارٹمنٹ نمبر', bn: 'অ্যাপার্টমেন্ট নম্বর' },
        placeholder: { en: 'e.g. Apartment 1205, Unit 3B', ar: 'مثال: شقة 1205، وحدة 3ب', hi: 'e.g. Apartment 1205, Unit 3B', ur: 'e.g. Apartment 1205, Unit 3B', bn: 'e.g. Apartment 1205, Unit 3B' },
        required: true,
        dependsOn: { field: 'unitType', value: 'apartment' },
      },
      {
        field: 'villaNumber',
        label: { en: 'Villa Number', ar: 'رقم الفيلا', hi: 'विला नंबर', ur: 'ولا نمبر', bn: 'ভিলা নম্বর' },
        placeholder: { en: 'e.g. Villa 25, House 12A', ar: 'مثال: فيلا 25، منزل 12أ', hi: 'e.g. Villa 25, House 12A', ur: 'e.g. Villa 25, House 12A', bn: 'e.g. Villa 25, House 12A' },
        required: true,
        dependsOn: { field: 'unitType', value: 'villa' },
      },
    ],
    sectionTitle: { en: 'Compound Details', ar: 'تفاصيل المجمع', hi: 'परिसर विवरण', ur: 'کمپاؤنڈ کی تفصیلات', bn: 'কমপাউন্ডের বিবরণ' },
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
        label: { en: 'Building Number', ar: 'رقم المبنى', hi: 'भवन संख्या', ur: 'عمارت نمبر', bn: 'ভবন নম্বর' },
        placeholder: { en: 'e.g. Building 5, Tower A', ar: 'مثال: مبنى 5، برج أ', hi: 'e.g. Building 5, Tower A', ur: 'e.g. Building 5, Tower A', bn: 'e.g. Building 5, Tower A' },
        required: true,
      },
      {
        field: 'floorNumber',
        label: { en: 'Floor Number', ar: 'رقم الطابق', hi: 'मंजिल संख्या', ur: 'منزل نمبر', bn: 'তলা নম্বর' },
        placeholder: { en: 'e.g. 12, Ground Floor, Basement 1', ar: 'مثال: 12، الطابق الأرضي، القبو 1', hi: 'e.g. 12, Ground Floor, Basement 1', ur: 'e.g. 12, Ground Floor, Basement 1', bn: 'e.g. 12, Ground Floor, Basement 1' },
        required: true,
      },
      {
        field: 'doorNumber',
        label: { en: 'Office / Unit Number', ar: 'رقم المكتب / الوحدة', hi: 'कार्यालय / यूनिट नंबर', ur: 'آفس / یونٹ نمبر', bn: 'অফিস / ইউনিট নম্বর' },
        placeholder: { en: 'e.g. Office 501, Suite 3B', ar: 'مثال: مكتب 501، جناح 3ب', hi: 'e.g. Office 501, Suite 3B', ur: 'e.g. Office 501, Suite 3B', bn: 'e.g. Office 501, Suite 3B' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Office Details', ar: 'تفاصيل المكتب', hi: 'कार्यालय विवरण', ur: 'آفس کی تفصیلات', bn: 'অফিসের বিবরণ' },
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
        label: { en: 'Location Description', ar: 'وصف الموقع', hi: 'स्थान विवरण', ur: 'مقام کی تفصیل', bn: 'অবস্থানের বিবরণ' },
        placeholder: { en: 'e.g. Shop #15 in the mall, Warehouse B3', ar: 'مثال: متجر رقم 15 في المول، مستودع ب3', hi: 'e.g. Shop #15 in the mall, Warehouse B3', ur: 'e.g. Shop #15 in the mall, Warehouse B3', bn: 'e.g. Shop #15 in the mall, Warehouse B3' },
        required: true,
      },
    ],
    sectionTitle: { en: 'Location Details', ar: 'تفاصيل الموقع', hi: 'स्थान विवरण', ur: 'مقام کی تفصیلات', bn: 'অবস্থানের বিবরণ' },
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

export function getMetadataSectionTitle(addressType: AddressType): TranslatedLabel | undefined {
  return ADDRESS_TYPE_STEP_CONFIG[addressType].sectionTitle;
}
