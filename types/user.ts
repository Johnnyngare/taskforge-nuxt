// types/user.ts
export enum UserRole {
  Admin = "admin",
  TeamManager = "manager", // Ensure this matches the string used in DB/JWT
  FieldOfficer = "field_officer",
  Dispatcher = "dispatcher",
  Viewer = "viewer" // Add if you have this role
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePhoto?: string | null;
  provider?: "google" | "local";
  createdAt?: string;
  updatedAt?: string;
}