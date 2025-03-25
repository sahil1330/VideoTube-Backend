import { searchContent } from "../controllers/search.controller.js";
import { Router } from "express";

const router = Router();

// Search route
router.get("/", searchContent);

export default router;