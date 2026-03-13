export type Timestamp = string;

export type Language = 'en' | 'ar';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'ar'];

export const DEFAULT_TIMEZONE = 'Asia/Riyadh';

export const MAX_STEPS_PER_GUIDANCE = 20;

export const DEFAULT_LINK_EXPIRY_MINUTES = 1440; // 24 hours

export const IMAGE_CONSTRAINTS = {
  maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
  maxWidth: 4096,
  maxHeight: 4096,
  supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

export type SupportedImageMimeType = (typeof IMAGE_CONSTRAINTS.supportedMimeTypes)[number];
