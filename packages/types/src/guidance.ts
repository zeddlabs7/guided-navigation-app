import type { Timestamp, Language, SupportedImageMimeType } from './common';

export type GuidanceStatus = 'DRAFT' | 'PUBLISHED' | 'DISABLED';

export type AvailabilityMode = 'ANYTIME_TODAY' | 'TIME_WINDOW' | 'NOT_AVAILABLE_TODAY';

export type StepType =
  | 'PIN_CHECK'
  | 'APPROACH'
  | 'GATE_ENTRY'
  | 'WALK_PATH'
  | 'TURN'
  | 'STAIRS'
  | 'ELEVATOR'
  | 'LANDMARK'
  | 'DOOR_ENTRY'
  | 'RECEPTION'
  | 'DROPOFF_POINT';

export type ContentType = 'PHOTO' | 'TEXT';

export type OverlayType = 'arrow' | 'marker';
export type ArrowStyle = '2d' | '3d';

export interface Coordinates {
  latitude: number;
  longitude: number;
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
  rotation: number; // Degrees
  scale: number; // 0.4 to 2.5, default 1.0
  label: string | null;
  arrowStyle?: ArrowStyle; // Only for arrow type, default '3d'
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export type CreateGuidanceSetInput = Pick<
  GuidanceSet,
  'title' | 'description' | 'languageOriginal' | 'availabilityMode' | 'destinationCoordinates'
> & {
  availabilityStartTs?: Timestamp;
  availabilityEndTs?: Timestamp;
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
  >
>;

export type CreateGuidanceStepInput = Pick<
  GuidanceStep,
  'stepType' | 'contentType' | 'title' | 'instructionOriginal'
> & {
  stepIndex?: number;
};

export type UpdateGuidanceStepInput = Partial<
  Pick<GuidanceStep, 'stepType' | 'contentType' | 'title' | 'instructionOriginal' | 'overlays' | 'image'>
>;

export const STEP_TYPE_LABELS: Record<StepType, { en: string; ar: string }> = {
  PIN_CHECK: { en: 'Confirm Starting Point', ar: 'تأكيد نقطة البداية' },
  APPROACH: { en: 'Approach', ar: 'اقتراب' },
  GATE_ENTRY: { en: 'Gate Entry', ar: 'دخول البوابة' },
  WALK_PATH: { en: 'Walk Path', ar: 'مسار المشي' },
  TURN: { en: 'Turn', ar: 'انعطاف' },
  STAIRS: { en: 'Stairs', ar: 'درج' },
  ELEVATOR: { en: 'Elevator', ar: 'مصعد' },
  LANDMARK: { en: 'Landmark', ar: 'معلم' },
  DOOR_ENTRY: { en: 'Door Entry', ar: 'دخول الباب' },
  RECEPTION: { en: 'Reception', ar: 'استقبال' },
  DROPOFF_POINT: { en: 'Drop-off Point', ar: 'نقطة التسليم' },
};
