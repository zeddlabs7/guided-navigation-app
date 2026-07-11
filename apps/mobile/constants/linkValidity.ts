import { DEFAULT_LINK_EXPIRY_MINUTES } from '@guidenav/types';

export interface LinkValidityOption {
  labelKey: string;
  minutes: number;
  premium: boolean;
}

export const LINK_VALIDITY_OPTIONS: LinkValidityOption[] = [
  { labelKey: 'linkValidity.1hour', minutes: 60, premium: false },
  { labelKey: 'linkValidity.6hours', minutes: 360, premium: false },
  { labelKey: 'linkValidity.24hours', minutes: DEFAULT_LINK_EXPIRY_MINUTES, premium: false },
  { labelKey: 'linkValidity.3days', minutes: 4320, premium: false },
  { labelKey: 'linkValidity.7days', minutes: 10080, premium: true },
  { labelKey: 'linkValidity.30days', minutes: 43200, premium: true },
];

export const DEFAULT_VALIDITY_OPTION = LINK_VALIDITY_OPTIONS.find(
  (o) => o.minutes === DEFAULT_LINK_EXPIRY_MINUTES
)!;
