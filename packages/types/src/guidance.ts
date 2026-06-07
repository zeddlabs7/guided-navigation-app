import type { Timestamp, Language, SupportedImageMimeType } from './common';

export type GuidanceStatus = 'DRAFT' | 'PUBLISHED' | 'DISABLED';

export type AvailabilityMode = 'ANYTIME_TODAY' | 'TIME_WINDOW' | 'NOT_AVAILABLE_TODAY';

export type AddressType =
  | 'APARTMENT_BUILDING'
  | 'VILLA'
  | 'RESIDENTIAL_COMPOUND'
  | 'OFFICE_BUILDING'
  | 'OTHER';

export type StepType =
  | 'LOCATION_CHECK'
  | 'LANDMARK_REFERENCE'
  | 'PARKING_LOCATION'
  | 'BUILDING_ENTRY'
  | 'RECEPTION_OR_SECURITY'
  | 'LOBBY_NAVIGATION'
  | 'ELEVATOR_ENTRY'
  | 'STAIRS_ENTRY'
  | 'FLOOR_NUMBER'
  | 'CORRIDOR_OR_PATH'
  | 'DOOR_IDENTIFICATION'
  | 'DROP_OFF_POINT'
  | 'GATE_ENTRY'
  | 'UNIT_OR_DOOR_IDENTIFICATION'
  | 'FLOOR_NAVIGATION'
  | 'OTHER';

export type ContentType = 'PHOTO' | 'TEXT';

export type OverlayType = 'arrow' | 'marker';
export type ArrowDirection = 'left' | 'right' | 'up-down' | 'forward-backward';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coordinates: Coordinates;
  formattedAddress: string;
  placeId?: string;
}

export interface GuidanceSet {
  id: string;
  recipientUserId: string;
  title: string;
  description: string | null;
  status: GuidanceStatus;
  languageOriginal: Language;
  supportedLanguages: Language[];
  availabilityMode: AvailabilityMode;
  availabilityStartTs: Timestamp | null;
  availabilityEndTs: Timestamp | null;
  timezone: string;
  destinationCoordinates: Coordinates | null;
  currentVersion: number;
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
  addressType: AddressType;
  buildingNumber?: string;
  floorNumber?: string;
  doorNumber?: string;
  compoundName?: string;
  gateNumber?: string;
  unitType?: 'villa' | 'apartment';
  villaNumber?: string;
  apartmentNumber?: string;
  locationDescription?: string;
  recipientPhoneNumber?: string;
}

export interface StepImage {
  storagePath: string;
  publicUrl: string | null;
  width: number;
  height: number;
  fileSize: number;
  mimeType: SupportedImageMimeType;
}

export interface Overlay {
  id: string;
  type: OverlayType;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  scale: number; // 0.4 to 2.5, default 1.0
  rotation: number; // Degrees, default 0
  label: string | null;
  arrowDirection?: ArrowDirection; // Only for arrow type, default 'up-down'
}

/** Frozen step content served to couriers after publish */
export interface StepPublishedSnapshot {
  stepType: StepType;
  contentType: ContentType;
  title: string | null;
  instructionOriginal: string;
  instructionTranslations: Record<Language, string>;
  image: StepImage | null;
  overlays: Overlay[];
  isRequired: boolean;
  locationData: LocationData | null;
}

export interface GuidanceStep {
  id: string;
  guidanceSetId: string;
  stepIndex: number;
  stepType: StepType;
  contentType: ContentType;
  title: string | null;
  instructionOriginal: string;
  instructionTranslations: Record<Language, string>;
  image: StepImage | null;
  overlays: Overlay[];
  isRequired: boolean;
  locationData: LocationData | null;
  /** undefined = legacy doc (pre-snapshot); null = not yet published; object = courier-visible version */
  publishedSnapshot?: StepPublishedSnapshot | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export type CreateGuidanceSetInput = Pick<
  GuidanceSet,
  'title' | 'description' | 'languageOriginal' | 'availabilityMode' | 'destinationCoordinates' | 'addressType'
> & {
  availabilityStartTs?: Timestamp;
  availabilityEndTs?: Timestamp;
  buildingNumber?: string;
  floorNumber?: string;
  doorNumber?: string;
  compoundName?: string;
  gateNumber?: string;
  unitType?: 'villa' | 'apartment';
  villaNumber?: string;
  apartmentNumber?: string;
  locationDescription?: string;
  recipientPhoneNumber?: string;
};

export type UpdateGuidanceSetInput = Partial<
  Pick<
    GuidanceSet,
    | 'title'
    | 'description'
    | 'status'
    | 'availabilityMode'
    | 'availabilityStartTs'
    | 'availabilityEndTs'
    | 'destinationCoordinates'
    | 'addressType'
    | 'buildingNumber'
    | 'floorNumber'
    | 'doorNumber'
    | 'compoundName'
    | 'gateNumber'
    | 'unitType'
    | 'villaNumber'
    | 'apartmentNumber'
    | 'locationDescription'
    | 'recipientPhoneNumber'
  >
>;

export type CreateGuidanceStepInput = Pick<
  GuidanceStep,
  'stepType' | 'contentType' | 'title' | 'instructionOriginal'
> & {
  stepIndex?: number;
  locationData?: LocationData | null;
  instructionTranslations?: Partial<Record<Language, string>>;
};

export type UpdateGuidanceStepInput = Partial<
  Pick<GuidanceStep, 'stepType' | 'contentType' | 'title' | 'instructionOriginal' | 'overlays' | 'image' | 'locationData'>
> & {
  instructionTranslations?: Partial<Record<Language, string>>;
};

export type TranslatedLabel = Record<Language, string>;

export const STEP_TYPE_LABELS: Record<StepType, TranslatedLabel> = {
  LOCATION_CHECK: { en: 'Location Check', ar: 'التحقق من الموقع', hi: 'स्थान जांच', ur: 'مقام کی جانچ', bn: 'অবস্থান যাচাই' },
  LANDMARK_REFERENCE: { en: 'Landmark Reference', ar: 'مرجع المعلم', hi: 'लैंडमार्क संदर्भ', ur: 'نشان زد مقام', bn: 'ল্যান্ডমার্ক রেফারেন্স' },
  PARKING_LOCATION: { en: 'Parking Location', ar: 'موقع الوقوف', hi: 'पार्किंग स्थान', ur: 'پارکنگ کا مقام', bn: 'পার্কিং অবস্থান' },
  BUILDING_ENTRY: { en: 'Building Entry', ar: 'دخول المبنى', hi: 'भवन प्रवेश', ur: 'عمارت میں داخلہ', bn: 'ভবনে প্রবেশ' },
  RECEPTION_OR_SECURITY: { en: 'Reception / Security', ar: 'الاستقبال / الأمن', hi: 'रिसेप्शन / सुरक्षा', ur: 'استقبالیہ / سیکیورٹی', bn: 'রিসেপশন / নিরাপত্তা' },
  LOBBY_NAVIGATION: { en: 'Lobby Navigation', ar: 'التنقل في الردهة', hi: 'लॉबी नेविगेशन', ur: 'لابی نیویگیشن', bn: 'লবি নেভিগেশন' },
  ELEVATOR_ENTRY: { en: 'Elevator Entry', ar: 'دخول المصعد', hi: 'लिफ्ट प्रवेश', ur: 'لفٹ میں داخلہ', bn: 'লিফটে প্রবেশ' },
  STAIRS_ENTRY: { en: 'Stairs Entry', ar: 'دخول الدرج', hi: 'सीढ़ी प्रवेश', ur: 'سیڑھیوں میں داخلہ', bn: 'সিঁড়িতে প্রবেশ' },
  FLOOR_NUMBER: { en: 'Floor Number', ar: 'رقم الطابق', hi: 'मंजिल संख्या', ur: 'منزل نمبر', bn: 'তলা নম্বর' },
  CORRIDOR_OR_PATH: { en: 'Corridor / Path', ar: 'الممر / المسار', hi: 'गलियारा / रास्ता', ur: 'گلیارا / راستہ', bn: 'করিডোর / পথ' },
  DOOR_IDENTIFICATION: { en: 'Door Identification', ar: 'تحديد الباب', hi: 'दरवाज़ा पहचान', ur: 'دروازے کی شناخت', bn: 'দরজা শনাক্তকরণ' },
  DROP_OFF_POINT: { en: 'Drop-off Point', ar: 'نقطة التسليم', hi: 'डिलीवरी पॉइंट', ur: 'ڈیلیوری پوائنٹ', bn: 'ডেলিভারি পয়েন্ট' },
  GATE_ENTRY: { en: 'Gate Entry', ar: 'دخول البوابة', hi: 'गेट प्रवेश', ur: 'گیٹ میں داخلہ', bn: 'গেটে প্রবেশ' },
  UNIT_OR_DOOR_IDENTIFICATION: { en: 'Unit / Door Identification', ar: 'تحديد الوحدة / الباب', hi: 'यूनिट / दरवाज़ा पहचान', ur: 'یونٹ / دروازے کی شناخت', bn: 'ইউনিট / দরজা শনাক্তকরণ' },
  FLOOR_NAVIGATION: { en: 'Floor Navigation', ar: 'التنقل في الطابق', hi: 'मंज़िल नेविगेशन', ur: 'منزل نیویگیشن', bn: 'তলা নেভিগেশন' },
  OTHER: { en: 'Other', ar: 'أخرى', hi: 'अन्य', ur: 'دیگر', bn: 'অন্যান্য' },
};

export const STEP_TYPE_DEFAULT_INSTRUCTIONS: Record<StepType, TranslatedLabel> = {
  LOCATION_CHECK: { en: '', ar: '', hi: '', ur: '', bn: '' },
  LANDMARK_REFERENCE: { en: '', ar: '', hi: '', ur: '', bn: '' },
  PARKING_LOCATION: { en: '', ar: '', hi: '', ur: '', bn: '' },
  BUILDING_ENTRY: { en: '', ar: '', hi: '', ur: '', bn: '' },
  RECEPTION_OR_SECURITY: { en: '', ar: '', hi: '', ur: '', bn: '' },
  LOBBY_NAVIGATION: { en: '', ar: '', hi: '', ur: '', bn: '' },
  ELEVATOR_ENTRY: { en: '', ar: '', hi: '', ur: '', bn: '' },
  STAIRS_ENTRY: { en: '', ar: '', hi: '', ur: '', bn: '' },
  FLOOR_NUMBER: { en: '', ar: '', hi: '', ur: '', bn: '' },
  CORRIDOR_OR_PATH: { en: '', ar: '', hi: '', ur: '', bn: '' },
  DOOR_IDENTIFICATION: { en: '', ar: '', hi: '', ur: '', bn: '' },
  DROP_OFF_POINT: { en: '', ar: '', hi: '', ur: '', bn: '' },
  GATE_ENTRY: { en: '', ar: '', hi: '', ur: '', bn: '' },
  UNIT_OR_DOOR_IDENTIFICATION: { en: '', ar: '', hi: '', ur: '', bn: '' },
  FLOOR_NAVIGATION: { en: '', ar: '', hi: '', ur: '', bn: '' },
  OTHER: { en: '', ar: '', hi: '', ur: '', bn: '' },
};

export const ADDRESS_TYPE_LABELS: Record<AddressType, TranslatedLabel> = {
  APARTMENT_BUILDING: { en: 'Apartment Building', ar: 'مبنى سكني', hi: 'अपार्टमेंट बिल्डिंग', ur: 'اپارٹمنٹ بلڈنگ', bn: 'অ্যাপার্টমেন্ট বিল্ডিং' },
  VILLA: { en: 'Villa', ar: 'فيلا', hi: 'विला', ur: 'ولا', bn: 'ভিলা' },
  RESIDENTIAL_COMPOUND: { en: 'Residential Compound', ar: 'مجمع سكني', hi: 'आवासीय परिसर', ur: 'رہائشی کمپاؤنڈ', bn: 'আবাসিক কমপাউন্ড' },
  OFFICE_BUILDING: { en: 'Office Building', ar: 'مبنى مكاتب', hi: 'कार्यालय भवन', ur: 'آفس بلڈنگ', bn: 'অফিস বিল্ডিং' },
  OTHER: { en: 'Other', ar: 'أخرى', hi: 'अन्य', ur: 'دیگر', bn: 'অন্যান্য' },
};
