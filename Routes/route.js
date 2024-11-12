import express from "express";
import { register, verify, login, resendVerification, forgotPassword, resetPassword, nutrition, recipe, createmeal, searchmeal, updatemeal, deletemeal, createuserhealth, getuserhealth, updateuserhealth, deleteuserhealth, createmacro, getmacro, updatemacro, deletemacro } from "../Controller/controller.js";

const router = express.Router();

//user routes
router.post("/register", register)
router.post("/verify", verify)
router.post("/login", login)
router.post("/resendVerification", resendVerification)
router.post("/forgotPassword", forgotPassword)
router.post("/reset-password/:token", resetPassword)
//external api routes
router.get("/nutrition", nutrition)
router.get("/recipe", recipe)
//Meals routes
router.post("/createmeal",createmeal)
router.get("/searchmeal",searchmeal)
router.put("/updatemeal/:mealId",updatemeal)
router.delete("/deletemeal/:mealId",deletemeal)
//User-Health routes
router.post("/createuserhealth",createuserhealth)
router.get("/getuserhealth/:userId",getuserhealth)
router.put("/updateuserhealth",updateuserhealth)
router.delete("/deleteuserhealth/:userId",deleteuserhealth)
//Macro routes
router.post("/createmacro",createmacro)
router.get("/getmacro/:userId",getmacro)
router.put("/updatemacro/:userId/:search",updatemacro)
router.delete("/deletemacro/:userId",deletemacro)


export default router