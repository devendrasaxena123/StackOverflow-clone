import express from "express";
import {
  Askquestion,
  getallquestion,
  getQuestionById,
  deletequestion,
  votequestion,
} from "../controller/question.js";

const router = express.Router();

router.post("/Askquestion", Askquestion);
router.post("/ask", Askquestion);
router.get("/getallquestion", getallquestion);
router.get("/:id", getQuestionById);
router.delete("/delete/:id", deletequestion);
router.patch("/vote/:id", votequestion);

export default router;
