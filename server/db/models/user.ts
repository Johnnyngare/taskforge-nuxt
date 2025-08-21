import mongoose, { Schema, model, type Document } from "mongoose"; // ADDED: import mongoose
import { UserRole } from "~/types/user";
import type { IUser } from "~/types/user"; // Ensure this type is correctly imported

// Define a separate interface for the Mongoose Document, extending the base IUser
// Omit 'id' because Mongoose uses '_id'.
// Add fields that are Mongoose-specific or not directly part of the frontend IUser for type purposes.
export interface IUserModel extends Document, Omit<IUser, 'id' | 'password' | 'createdAt' | 'updatedAt'> { // Omit createdAt/updatedAt from IUser if you define them as Date here
  password?: string; // Stored hashed password (marked as optional for Google users etc.)
  googleId?: string;
  role: UserRole; // Using the enum for type safety
  managedProjects: mongoose.Types.ObjectId[]; // NEW: Correctly typed as an array of ObjectIds
  createdAt: Date; // Mongoose timestamps provides this as Date objects
  updatedAt: Date; // Mongoose timestamps provides this as Date objects
}

const userSchema = new Schema<IUserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Password should ideally be required for local accounts.
    // If optional, your registration/login logic needs to handle its absence carefully.
    // For local login, this should be required. For Google login, it might be optional.
    password: { type: String, required: true, select: false }, // REVISED: Made required for local auth.
    // Consider adding a custom validator here or in pre-save hook:
    // validate: {
    //   validator: function(v: any) {
    //     // Only require password if the provider is 'local' and it's a new document or password is being updated
    //     return (this.provider !== 'local' || v !== undefined);
    //   },
    //   message: 'Password is required for local accounts.'
    // }

    provider: { type: String, required: true, default: "local", enum: ["local", "google"] },
    googleId: { type: String, unique: true, sparse: true }, // sparse index allows nulls
    profilePhoto: { type: String },
    role: { // Correct top-level field for role
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.FieldOfficer,
    },
    // NEW: Correct top-level field for managedProjects
    managedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
    toJSON: {
      virtuals: true, // Include virtuals (like 'id')
      transform: (doc, ret: Record<string, any>): IUser => { // Type 'ret' for safety
        ret.id = ret._id.toString(); // Convert ObjectId to string for frontend 'id'
        delete ret._id; // Remove Mongoose's internal _id
        delete ret.__v; // Remove Mongoose's version key
        delete ret.password; // IMPORTANT: Ensure password hash is NEVER sent to frontend

        // No need to explicitly re-assign existing properties like name, email, role, etc.
        // They are already part of `ret` after `doc.toJSON()` and before `delete` operations.

        // Ensure managedProjects is converted to string IDs if populated
        if (ret.managedProjects && Array.isArray(ret.managedProjects)) {
            ret.managedProjects = ret.managedProjects.map((id: mongoose.Types.ObjectId) => id.toString());
        }

        // Return the transformed object as the frontend IUser interface expects
        return ret as IUser;
      },
    },
    id: true, // Tell Mongoose to create an 'id' virtual
  },
);

// No explicit schema.index({ email: 1 }); needed here if `unique: true` is on the field.
export const UserModel = model<IUserModel>("User", userSchema);