// server/db/models/user.ts
import { Schema, model, Document } from "mongoose";
import { UserRole } from "~/types/user";
import type { IUser } from "~/types/user";

export interface IUserModel extends Document, Omit<IUser, 'id'> {
  password?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
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
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.FieldOfficer,
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
        ret.name = ret.name;
        ret.email = ret.email;
        ret.role = ret.role;
        ret.profilePhoto = ret.profilePhoto;
        ret.provider = ret.provider;
        return ret as IUser;
      },
    },
    id: true,
  },
);

// No explicit schema.index({ email: 1 }); needed here if `unique: true` is on the field.
export const UserModel = model<IUserModel>("User", userSchema);