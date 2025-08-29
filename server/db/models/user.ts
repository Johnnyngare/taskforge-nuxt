// server/db/models/user.ts (UPDATED)
import mongoose, { Schema, model, type Document } from "mongoose";
import { UserRole } from "~/types/user"; // Keep this import, as it defines UserRole
import type { IUser } from "~/types/user";

export interface IUserModel extends Document, Omit<IUser, 'id' | 'password' | 'createdAt' | 'updatedAt'> {
  password?: string;
  googleId?: string;
  role: UserRole;
  managedProjects: mongoose.Types.ObjectId[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: {
      type: String,
      select: false,
      required: function() {
        return this.provider === 'local';
      },
    },
    provider: { type: String, required: true, default: "local", enum: ["local", "google"] },
    googleId: { type: String, unique: true, sparse: true },
    profilePhoto: { type: String },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.FieldOfficer,
    },
    managedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    passwordResetToken: String,
    passwordResetExpires: Date,
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

        if (ret.managedProjects && Array.isArray(ret.managedProjects)) {
            ret.managedProjects = ret.managedProjects.map((id: mongoose.Types.ObjectId) => id.toString());
        }
        return ret as IUser;
      },
    },
    id: true,
  },
);

export const UserModel = model<IUserModel>("User", userSchema);

// CRITICAL FIX: Re-export UserRole so other files can import it from here.
export { UserRole };