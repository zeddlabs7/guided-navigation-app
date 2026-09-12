import type { Timestamp, Language } from './common';
import type { AvailabilityMode, CourierContactPreference } from './guidance';

export interface User {
  id: string; // Firebase Auth UID
  email: string | null;
  phoneNumber: string | null;
  languagePreference: Language;
  defaultAvailabilityMode: AvailabilityMode;
  defaultAvailabilityStartTime: string | null; // HH:mm format
  defaultAvailabilityEndTime: string | null; // HH:mm format
  courierContactPreference: CourierContactPreference;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export type CreateUserInput = Pick<User, 'email' | 'phoneNumber' | 'languagePreference'>;

export type UpdateUserInput = Partial<Pick<User,
  | 'email'
  | 'phoneNumber'
  | 'languagePreference'
  | 'isActive'
  | 'defaultAvailabilityMode'
  | 'defaultAvailabilityStartTime'
  | 'defaultAvailabilityEndTime'
  | 'courierContactPreference'
>>;
