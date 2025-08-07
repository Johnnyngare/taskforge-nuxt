// server/db/models/user.ts
import { Schema, model, Document } from "mongoose";
// Import UserRole and IUser (as type) from types/user.ts
import { UserRole } from "~/types/user";
import type { IUser } from "~/types/user";

// Define the Mongoose Document interface.
// This reflects the structure *in the database* before transformation.
// It extends Mongoose's Document and the IUser interface for property consistency.
export interface IUserModel extends Document, Omit<IUser, 'id'> { // Omit 'id' because MongoDB uses '_id'
  password?: string; // Password is only in the DB model, not the frontend IUser
  googleId?: string; // Specific to the DB model
  createdAt: Date; // Mongoose adds these as Date objects
  updatedAt: Date; // Mongoose adds these as Date objects
}

const userSchema = new Schema<IUserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: false, select: false },
    provider: { type: String, required: true, default: "local", enum: ["local", "google"] },
    googleId: { type: String, unique: true, sparse: true },
    profilePhoto: { type: String },
    role: {
      type: String,
      // CRUCIAL FIX: Ensure UserRole is accessible here.
      // Object.values(UserRole) will produce an array like ['admin', 'team_manager', ...]
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.FieldOfficer, // Use the imported enum for default
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: Record<string, any>): IUser => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        // The return type should directly match IUser, so ensure all required IUser properties are present.
        // Assuming provider, name, email, role are always present.
        return ret as IUser;
      },
    },
    id: true, // Ensures a virtual 'id' getter is created, which .toJSON().id relies on
  },
);

// Add an index for the email field if not already handled by unique: true
// Only add this if you are not using `unique: true` for `email` in the schema definition itself.
// Since you have `unique: true` on email, this line should generally NOT be present.
// If you're still getting the duplicate index error with 'unique: true', then remove the `userSchema.index` line completely.
// If `unique: true` was removed, then uncomment the below line.
// userSchema.index({ email: 1 });

export const UserModel = model<IUserModel>("User", userSchema);