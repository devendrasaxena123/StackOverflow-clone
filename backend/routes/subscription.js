import express from "express";
import {
  getPaymentWindowStatus,
  processCheckout,
  getSubscriptionStatus,
} from "../controller/subscription.js";

const router = express.Router();

router.get("/window-status", getPaymentWindowStatus);
router.post("/checkout", processCheckout);
router.get("/status/:userId", getSubscriptionStatus);

export default router;
