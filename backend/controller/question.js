import mongoose from "mongoose";
import question from "../models/question.js";
import user from "../models/auth.js";

export const Askquestion = async (req, res) => {
  const data = req.body.postquestiondata || req.body;
  const userid = data?.userid;

  try {
    // Check subscription plan and question posting limits
    if (userid && mongoose.Types.ObjectId.isValid(userid)) {
      const currentUser = await user.findById(userid);
      if (currentUser) {
        const plan = currentUser.subscription?.plan || "Free";

        let dailyLimit = 1; // Free Plan default
        if (plan === "Bronze") dailyLimit = 5;
        else if (plan === "Silver") dailyLimit = 10;
        else if (plan === "Gold") dailyLimit = Infinity;

        // Calculate start of today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const questionsToday = await question.countDocuments({
          userid: String(userid),
          askedon: { $gte: startOfToday },
        });

        if (questionsToday >= dailyLimit) {
          return res.status(403).json({
            message: `You have reached your daily limit of ${dailyLimit} question(s) for the ${plan} Plan. Please upgrade your subscription to post more questions.`,
            error: "PLAN_LIMIT_REACHED",
            plan,
            dailyLimit,
            questionsToday,
          });
        }
      }
    }

    const postques = new question({ ...data });
    await postques.save();
    res.status(200).json({ data: postques });
  } catch (error) {
    console.error("Askquestion error:", error);
    res.status(500).json({ message: "Something went wrong while posting question." });
  }
};

export const getallquestion = async (req, res) => {
  try {
    const allquestion = await question.find().sort({ askedon: -1 });
    res.status(200).json({ data: allquestion });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong fetching questions." });
  }
};

export const getQuestionById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid question ID" });
  }
  try {
    const foundQuestion = await question.findById(id);
    if (!foundQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json({ data: foundQuestion });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong fetching question." });
  }
};

export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Question unavailable" });
  }
  try {
    await question.findByIdAndDelete(_id);
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong deleting question." });
  }
};

export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value, userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }

    const upindex = questionDoc.upvote.findIndex((id) => id === String(userid));
    const downindex = questionDoc.downvote.findIndex(
      (id) => id === String(userid)
    );

    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = questionDoc.downvote.filter(
          (id) => id !== String(userid)
        );
      }
      if (upindex === -1) {
        questionDoc.upvote.push(userid);
      } else {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
      }
      if (downindex === -1) {
        questionDoc.downvote.push(userid);
      } else {
        questionDoc.downvote = questionDoc.downvote.filter(
          (id) => id !== String(userid)
        );
      }
    }

    const questionvote = await question.findByIdAndUpdate(_id, questionDoc, {
      new: true,
    });
    res.status(200).json({ data: questionvote });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong voting on question." });
  }
};
