import type { Timestamp, Language } from './common';

export interface User {
  id: string; // Firebase Auth UID
  email: string | null;
  phoneNumber: string | null;
  languagePreference: Language;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export type CreateUserInput = Pick<User, 'email' | 'phoneNumber' | 'languagePreference'>;

export type UpdateUserInput = Partial<Pick<User, 'email' | 'phoneNumber' | 'languagePreference' | 'isActive'>>;
