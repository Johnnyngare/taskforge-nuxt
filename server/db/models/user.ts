// taskforge-nuxt/server/db/models/user.ts
import mongoose, { Schema, Model, Document } from "mongoose";

// Define the interface for a User document
interface IUser extends Document {
  email: string;
  passwordHash?: string; // Optional for Google OAuth users
  name: string;
  profilePhoto?: string; // URL to profile photo
  googleId?: string; // Nullable for non-Google users
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      // Required for local registration, but not for Google OAuth users
      // This will be handled in the registration/login logic
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: null, // Default to null if not provided
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have null for this field
      default: null,
    },
    // Timestamps will automatically add createdAt and updatedAt fields
  },
  {
    timestamps: true,
    // Optional: Add toJSON transform to remove sensitive fields when converting to JSON
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create and export the User model
// Using a check to prevent recompiling the model if it already exists
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
