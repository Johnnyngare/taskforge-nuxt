// C:/Users/HomePC/taskforge-nuxt/server/db/models/user.ts
import mongoose, { Schema, model, type Document } from "mongoose";
import { UserRole } from "~/types/user";
import type { IUser } from "~/types/user";

export interface IUserModel extends Document, Omit<IUser, 'id' | 'password' | 'createdAt' | 'updatedAt'> {
  password?: string;
  googleId?: string;
  role: UserRole;
  managedProjects: mongoose.Types.ObjectId[];
  passwordResetToken?: string; // NEW: Field for storing password reset token
  passwordResetExpires?: Date; // NEW: Field for storing password reset token expiry
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
    passwordResetToken: String, // NEW: Schema field
    passwordResetExpires: Date, // NEW: Schema field
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