import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    project:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    milestone: { type: mongoose.Schema.Types.ObjectId },
    payer:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payee:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    amount:      { type: Number, required: true },
    currency:    { type: String, default: "USD" },
    type:        { type: String, enum: ["milestone","escrow","release","refund","bonus"], default: "milestone" },

    status: {
      type: String,
      enum: ["pending","in_escrow","approved","released","cancelled","disputed"],
      default: "pending",
    },

    // Split payments
    splits: [
      {
        freelancer:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        percentage:          { type: Number },
        amount:              { type: Number },
        contributionBased:   { type: Boolean, default: true },
        released:            { type: Boolean, default: false },
        releasedAt:          { type: Date },
      },
    ],

    // Approval workflow
    approvalHistory: [
      {
        action:     { type: String, enum: ["submitted","approved","rejected","disputed","released"] },
        performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note:       { type: String },
        timestamp:  { type: Date, default: Date.now },
      },
    ],

    // Transaction metadata
    transactionId:    { type: String, default: "" },
    stripeIntentId:   { type: String, default: "" },
    paymentMethod:    { type: String, default: "simulated" },
    invoiceUrl:     { type: String, default: "" },
    notes:          { type: String, default: "" },
    dueDate:        { type: Date },
    releasedAt:     { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ project: 1, status: 1 });
paymentSchema.index({ payer: 1 });
paymentSchema.index({ payee: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
