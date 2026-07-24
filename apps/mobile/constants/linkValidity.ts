import { DEFAULT_LINK_EXPIRY_MINUTES } from '@guidenav/types';

export interface LinkValidityOption {
  labelKey: string;
  minutes: number;
}

export const LINK_VALIDITY_OPTIONS: LinkValidityOption[] = [
  { labelKey: 'linkValidity.6hours', minutes: 360 },
  { labelKey: 'linkValidity.24hours', minutes: DEFAULT_LINK_EXPIRY_MINUTES },
  { labelKey: 'linkValidity.3days', minutes: 4320 },
];

export const DEFAULT_VALIDITY_OPTION = LINK_VALIDITY_OPTIONS.find(
  (o) => o.minutes === DEFAULT_LINK_EXPIRY_MINUTES
)!;
