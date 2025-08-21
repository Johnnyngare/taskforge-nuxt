// types/user.ts
export enum UserRole {
  Admin = "admin",
  Manager = "manager", 
  FieldOfficer = "field_officer",
  Dispatcher = "dispatcher",
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole; // Using the enum for type safety
  profilePhoto?: string | null;
  provider?: "google" | "local"; // To distinguish login methods
  createdAt?: string;
  updatedAt?: string;
}