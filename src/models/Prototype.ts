import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrototype extends Document {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  shortId: string;
  originalUrl: string;
  isActive: boolean;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PrototypeSchema = new Schema<IPrototype>(
  {
    userId: {
      type: Schema.Types.Mixed,
      ref: "User",
      index: true,
      default: "guest",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "Untitled Prototype",
    },
    shortId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: [true, "Original URL is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    scanCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user query performance
PrototypeSchema.index({ userId: 1, createdAt: -1 });

export const Prototype: Model<IPrototype> =
  mongoose.models.Prototype || mongoose.model<IPrototype>("Prototype", PrototypeSchema);
