import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScan extends Document {
  prototypeId: mongoose.Types.ObjectId;
  timestamp: Date;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  referrer: string;
}

const ScanSchema = new Schema<IScan>(
  {
    prototypeId: {
      type: Schema.Types.ObjectId,
      ref: "Prototype",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userAgent: {
      type: String,
      default: "Unknown",
    },
    device: {
      type: String,
      default: "Desktop",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    os: {
      type: String,
      default: "Unknown",
    },
    referrer: {
      type: String,
      default: "Direct",
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for querying prototype scans over time
ScanSchema.index({ prototypeId: 1, timestamp: -1 });

export const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>("Scan", ScanSchema);
