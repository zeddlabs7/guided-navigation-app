import { DEFAULT_LINK_EXPIRY_MINUTES } from '@guidenav/types';

export interface LinkValidityOption {
  label: string;
  minutes: number;
  premium: boolean;
}

export const LINK_VALIDITY_OPTIONS: LinkValidityOption[] = [
  { label: '1 hour', minutes: 60, premium: false },
  { label: '6 hours', minutes: 360, premium: false },
  { label: '24 hours', minutes: DEFAULT_LINK_EXPIRY_MINUTES, premium: false },
  { label: '3 days', minutes: 4320, premium: false },
  { label: '7 days', minutes: 10080, premium: true },
  { label: '30 days', minutes: 43200, premium: true },
];

export const DEFAULT_VALIDITY_OPTION = LINK_VALIDITY_OPTIONS.find(
  (o) => o.minutes === DEFAULT_LINK_EXPIRY_MINUTES
)!;
