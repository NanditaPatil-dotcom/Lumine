import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profile?: {
     firstName?: string;
     lastName?: string;
     avatar?: string;
     bio?: string;
  };
  preferences?: {
    theme?: "light" | "dark" | "system";
    spacedRepetition?: {
      enabled?: boolean;
      intervals?: number[];
      dailyLimit?: number;
      streak?: number;
      lastReviewDate?: Date;
    };
    notifications?: {
      webPush?: boolean;
      email?: boolean;
    };
  };
  pushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  comparePassword(candidate: string): Promise<boolean>;
  toJSON(): any;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profile: {
      firstName: { type: String },
      lastName: { type: String },
      avatar: { type: String },
      bio: { type: String },
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      spacedRepetition: {
        enabled: {
          type: Boolean,
          default: true,
        },
        intervals: {
          type: [Number],
          default: [3, 7, 14, 30],
        },
        dailyLimit: {
          type: Number,
          default: 20,
        },
        streak: {
          type: Number,
          default: 0,
        },
        lastReviewDate: { type: Date },
      },
      notifications: {
        webPush: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: false,
        },
      },
    },
    pushSubscription: {
      endpoint: { type: String },
      keys: {
        p256dh: { type: String },
        auth: { type: String },
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  const doc = this as IUser;
  if (!doc.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    doc.password = await bcrypt.hash(doc.password, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, (this as IUser).password);
};

// Remove sensitive fields from JSON output
UserSchema.methods.toJSON = function () {
  const obj = (this as any).toObject();
  delete obj.password;
  delete obj.pushSubscription;
  return obj;
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);