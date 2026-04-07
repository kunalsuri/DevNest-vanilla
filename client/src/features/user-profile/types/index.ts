export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  linkedAccounts?: LinkedAccount[];
  createdAt?: Date;
  updatedAt?: Date;
  age?: number | null;
  officeLocation?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
}

export interface LinkedAccount {
  id: string;
  provider: string;
  email: string;
  connectedAt: Date;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  age?: number | null;
  officeLocation?: string | null;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
}

// AccountPreferences moved to @shared/schema for consistency
