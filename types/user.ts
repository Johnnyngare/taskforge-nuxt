// types/user.ts

// Define the roles for your application
export enum UserRole {
  Admin = "admin",
  TeamManager = "team_manager",
  FieldOfficer = "field_officer",
  Dispatcher = "dispatcher",
}

// This is the user object shape for the frontend
// It should match the output of your Mongoose transform in the user model
export interface IUser {
  id: string; // Transformed from _id
  name: string;
  email: string;
  role: UserRole; // Use the enum for type safety
  profilePhoto?: string;
  provider: "google" | "local"; // Required field as per your schema default
  // No password field here, as it's removed by toJSON transform
  // createdAt and updatedAt might be included if you expose them through transform
}