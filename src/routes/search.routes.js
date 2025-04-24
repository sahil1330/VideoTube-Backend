import { autoCompleteSearch, searchContent } from "../controllers/search.controller.js";
import { Router } from "express";

const router = Router();

// Search route
router.get("/", searchContent);
router.get("/auto-complete", autoCompleteSearch);

export default router;