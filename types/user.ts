// types/user.ts
export enum UserRole {
  Admin = "admin",
  Manager = "manager", // CORRECTED: Renamed from TeamManager to Manager for direct string match
  FieldOfficer = "field_officer",
  Dispatcher = "dispatcher",
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole; // This is correctly typed as UserRole
  profilePhoto?: string | null;
  provider?: "google" | "local";
  createdAt?: string;
  updatedAt?: string;
}