import mongoose from "mongoose";
import question from "../models/question.js";
import user from "../models/auth.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Question unavailable" });
  }
  const { noofanswer, answerbody, useranswered, userid } = req.body;

  try {
    const newAnswerObj = {
      answerbody,
      useranswered,
      userid,
      answeredon: new Date(),
      upvote: [],
      downvote: [],
      bonusAwarded: false,
    };

    const updatequestion = await question.findByIdAndUpdate(
      _id,
      {
        $inc: { noofanswer: 1 },
        $push: { answer: newAnswerObj },
      },
      { new: true }
    );

    // REWARD SYSTEM: Each time a user answers a question, they will receive 5 points
    if (userid && mongoose.Types.ObjectId.isValid(userid)) {
      const answeringUser = await user.findById(userid);
      if (answeringUser) {
        answeringUser.points = (answeringUser.points || 0) + 5;
        answeringUser.pointsHistory.unshift({
          amount: 5,
          type: "answer_reward",
          description: "Earned 5 points for answering a question",
          date: new Date(),
        });
        await answeringUser.save();
      }
    }

    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.error("Askanswer error:", error);
    res.status(500).json({ message: "Something went wrong posting answer." });
  }
};

export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerid } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "Answer unavailable" });
  }

  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }

    const targetAnswer = questionDoc.answer.id(answerid);
    const authorId = targetAnswer ? targetAnswer.userid : null;

    // Remove answer
    questionDoc.answer.pull({ _id: answerid });
    questionDoc.noofanswer = questionDoc.answer.length;
    await questionDoc.save();

    // REWARD DEDUCTION: Points will be deducted if an answer is removed (-5 points)
    if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
      const answerAuthor = await user.findById(authorId);
      if (answerAuthor) {
        answerAuthor.points = Math.max(0, (answerAuthor.points || 0) - 5);
        answerAuthor.pointsHistory.unshift({
          amount: -5,
          type: "answer_deleted",
          description: "Deducted 5 points because answer was removed",
          date: new Date(),
        });
        await answerAuthor.save();
      }
    }

    res.status(200).json({ data: questionDoc, message: "Answer deleted successfully" });
  } catch (error) {
    console.error("deleteanswer error:", error);
    res.status(500).json({ message: "Something went wrong deleting answer." });
  }
};

export const voteanswer = async (req, res) => {
  const { id: _id } = req.params; // Question ID
  const { answerid, value, userid } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id) || !mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "Invalid question or answer ID" });
  }

  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }

    const answerDoc = questionDoc.answer.id(answerid);
    if (!answerDoc) {
      return res.status(404).json({ message: "Answer not found" });
    }

    if (!answerDoc.upvote) answerDoc.upvote = [];
    if (!answerDoc.downvote) answerDoc.downvote = [];

    const upIndex = answerDoc.upvote.findIndex((uid) => uid === String(userid));
    const downIndex = answerDoc.downvote.findIndex((uid) => uid === String(userid));
    let penaltyApplied = false;

    if (value === "upvote") {
      if (downIndex !== -1) {
        answerDoc.downvote = answerDoc.downvote.filter((uid) => uid !== String(userid));
      }
      if (upIndex === -1) {
        answerDoc.upvote.push(String(userid));
      } else {
        answerDoc.upvote = answerDoc.upvote.filter((uid) => uid !== String(userid));
      }
    } else if (value === "downvote") {
      if (upIndex !== -1) {
        answerDoc.upvote = answerDoc.upvote.filter((uid) => uid !== String(userid));
      }
      if (downIndex === -1) {
        answerDoc.downvote.push(String(userid));
        penaltyApplied = true;
      } else {
        answerDoc.downvote = answerDoc.downvote.filter((uid) => uid !== String(userid));
      }
    }

    // BONUS REWARD: if that answer reaches 5 upvotes, an additional 5 points will be awarded
    let bonusAwardedNow = false;
    if (answerDoc.upvote.length >= 5 && !answerDoc.bonusAwarded) {
      answerDoc.bonusAwarded = true;
      bonusAwardedNow = true;
    }

    await questionDoc.save();

    // Apply points changes to the author of the answer
    if (answerDoc.userid && mongoose.Types.ObjectId.isValid(answerDoc.userid)) {
      const author = await user.findById(answerDoc.userid);
      if (author) {
        if (bonusAwardedNow) {
          author.points = (author.points || 0) + 5;
          author.pointsHistory.unshift({
            amount: 5,
            type: "upvote_bonus",
            description: "Earned 5 bonus points because your answer reached 5 upvotes!",
            date: new Date(),
          });
        }
        if (penaltyApplied) {
          // Points deducted if answer receives a downgrade/downvote
          author.points = Math.max(0, (author.points || 0) - 1);
          author.pointsHistory.unshift({
            amount: -1,
            type: "downvote_penalty",
            description: "Deducted 1 point due to downvote on your answer",
            date: new Date(),
          });
        }
        await author.save();
      }
    }

    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.error("voteanswer error:", error);
    res.status(500).json({ message: "Failed to vote on answer." });
  }
};
