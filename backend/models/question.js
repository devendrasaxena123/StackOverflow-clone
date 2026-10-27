import mongoose from "mongoose";

const questionschema = mongoose.Schema(
  {
    questiontitle: { type: String, required: true },
    questionbody: { type: String, required: true },
    questiontags: { type: [String], required: true },
    noofanswer: { type: Number, default: 0 },
    upvote: { type: [String], default: [] },
    downvote: { type: [String], default: [] },
    userposted: { type: String },
    userid: { type: String },
    askedon: { type: Date, default: Date.now },
    answer: [
      {
        answerbody: { type: String, required: true },
        useranswered: { type: String, required: true },
        userid: { type: String, required: true },
        answeredon: { type: Date, default: Date.now },
        upvote: { type: [String], default: [] },
        downvote: { type: [String], default: [] },
        bonusAwarded: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("question", questionschema);
