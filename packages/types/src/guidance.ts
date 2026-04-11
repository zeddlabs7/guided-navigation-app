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
  >
>;

export type CreateGuidanceStepInput = Pick<
  GuidanceStep,
  'stepType' | 'contentType' | 'title' | 'instructionOriginal'
> & {
  stepIndex?: number;
  locationData?: LocationData | null;
};

export type UpdateGuidanceStepInput = Partial<
  Pick<GuidanceStep, 'stepType' | 'contentType' | 'title' | 'instructionOriginal' | 'overlays' | 'image' | 'locationData'>
>;

export const STEP_TYPE_LABELS: Record<StepType, { en: string; ar: string }> = {
  LOCATION_CHECK: { en: 'Location Check', ar: 'التحقق من الموقع' },
  LANDMARK_REFERENCE: { en: 'Landmark Reference', ar: 'مرجع المعلم' },
  PARKING_LOCATION: { en: 'Parking Location', ar: 'موقع الوقوف' },
  BUILDING_ENTRY: { en: 'Building Entry', ar: 'دخول المبنى' },
  RECEPTION_OR_SECURITY: { en: 'Reception / Security', ar: 'الاستقبال / الأمن' },
  LOBBY_NAVIGATION: { en: 'Lobby Navigation', ar: 'التنقل في الردهة' },
  ELEVATOR_ENTRY: { en: 'Elevator Entry', ar: 'دخول المصعد' },
  STAIRS_ENTRY: { en: 'Stairs Entry', ar: 'دخول الدرج' },
  FLOOR_NUMBER: { en: 'Floor Number', ar: 'رقم الطابق' },
  CORRIDOR_OR_PATH: { en: 'Corridor / Path', ar: 'الممر / المسار' },
  DOOR_IDENTIFICATION: { en: 'Door Identification', ar: 'تحديد الباب' },
  DROP_OFF_POINT: { en: 'Drop-off Point', ar: 'نقطة التسليم' },
  GATE_ENTRY: { en: 'Gate Entry', ar: 'دخول البوابة' },
  UNIT_OR_DOOR_IDENTIFICATION: { en: 'Unit / Door Identification', ar: 'تحديد الوحدة / الباب' },
  FLOOR_NAVIGATION: { en: 'Floor Navigation', ar: 'التنقل في الطابق' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};

export const STEP_TYPE_DEFAULT_INSTRUCTIONS: Record<StepType, { en: string; ar: string }> = {
  LOCATION_CHECK: {
    en: 'You should see this view when you arrive at the location',
    ar: 'يجب أن ترى هذا المنظر عند وصولك إلى الموقع',
  },
  LANDMARK_REFERENCE: {
    en: 'Look for this landmark to confirm you are in the right area',
    ar: 'ابحث عن هذا المعلم للتأكد من أنك في المنطقة الصحيحة',
  },
  PARKING_LOCATION: {
    en: 'Park your vehicle here',
    ar: 'أوقف مركبتك هنا',
  },
  BUILDING_ENTRY: {
    en: 'Enter the building through this entrance',
    ar: 'ادخل المبنى من هذا المدخل',
  },
  RECEPTION_OR_SECURITY: {
    en: 'Check in with reception or security at this point',
    ar: 'سجل حضورك عند الاستقبال أو الأمن هنا',
  },
  LOBBY_NAVIGATION: {
    en: 'Walk through the lobby in this direction',
    ar: 'امشِ عبر الردهة في هذا الاتجاه',
  },
  ELEVATOR_ENTRY: {
    en: 'Take the elevator from here',
    ar: 'استخدم المصعد من هنا',
  },
  STAIRS_ENTRY: {
    en: 'Take the stairs from here',
    ar: 'استخدم الدرج من هنا',
  },
  FLOOR_NUMBER: {
    en: 'Go to this floor',
    ar: 'اذهب إلى هذا الطابق',
  },
  CORRIDOR_OR_PATH: {
    en: 'Follow this corridor',
    ar: 'اتبع هذا الممر',
  },
  DOOR_IDENTIFICATION: {
    en: 'Look for this door',
    ar: 'ابحث عن هذا الباب',
  },
  DROP_OFF_POINT: {
    en: 'Leave the delivery here',
    ar: 'اترك التوصيل هنا',
  },
  GATE_ENTRY: {
    en: 'Enter through this gate',
    ar: 'ادخل من هذه البوابة',
  },
  UNIT_OR_DOOR_IDENTIFICATION: {
    en: 'This is the unit/door number',
    ar: 'هذا هو رقم الوحدة/الباب',
  },
  FLOOR_NAVIGATION: {
    en: 'Navigate through this floor as shown',
    ar: 'تنقل في هذا الطابق كما هو موضح',
  },
  OTHER: {
    en: 'Follow these instructions',
    ar: 'اتبع هذه التعليمات',
  },
};

export const ADDRESS_TYPE_LABELS: Record<AddressType, { en: string; ar: string }> = {
  APARTMENT_BUILDING: { en: 'Apartment Building', ar: 'مبنى سكني' },
  VILLA: { en: 'Villa', ar: 'فيلا' },
  RESIDENTIAL_COMPOUND: { en: 'Residential Compound', ar: 'مجمع سكني' },
  OFFICE_BUILDING: { en: 'Office Building', ar: 'مبنى مكاتب' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};
