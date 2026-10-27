import express from "express";
import { Askanswer, deleteanswer, voteanswer } from "../controller/answer.js";

const router = express.Router();

router.post("/postanswer/:id", Askanswer);
router.delete("/delete/:id", deleteanswer);
router.patch("/vote/:id", voteanswer);

export default router;
