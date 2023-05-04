const { Router } = require("express");
const { body } = require("express-validator");

const router = Router();

const authController = require("../controllers/auth");
const User = require("../models/user");
const isAuth = require("../middlewares/is-auth");

router.put("/signup", [
    body("name")
        .trim()
        .not()
        .isEmpty()
        .isLength({ max: 255 }),
    body("email")
        .trim()
        .isEmail().withMessage("Please, enter a valid email.")
        .custom(async (email, { req }) => {
            try {
                const userDoc = await User.findOne({ email });
                if(userDoc) {
                    return Promise.reject("E-mail address alredy exists!")
                }
                return Promise.resolve()
            } catch (err) {
                console.error(err);
                return Promise.reject("An error occurred while checking the email address.");
            }
        }).normalizeEmail(),
    body("password")
        .trim()
        .isLength({min: 5})
], authController.signup);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getUserStatus);

router.patch("/status", [
    body("status")
        .trim()
        .notEmpty()
], isAuth, authController.updateUserStatus);

module.exports = router;