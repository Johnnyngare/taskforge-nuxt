// server/db/models/user.ts
import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  profilePhoto?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}

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
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        // FIX: Type 'ret' as Record<string, any>
        delete ret.passwordHash;
        delete ret.__v;
        // Optionally, if you also transform _id to string for ret, do it here
        if (ret._id) {
          ret._id = ret._id.toString();
        }
        return ret;
      },
    },
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
