const express = require("express");
const auth = require("../controller/authController");
const verifyJwt = require("../middleware/jwt");
const router = express.Router();

router.post("/signup", auth.signUpNew);

router.post("/getOtp", auth.requestOtpNew);

router.post("/verifyOtp", auth.verifyOTPNew);

router.post("/login", auth.LoginNew);

router.post('/update_user_cart', verifyJwt.verifyJwtToken, auth.updateUserCartNew);

router.get('/get_user_details_by_id', verifyJwt.verifyJwtToken, auth.getUserDetailsById)

router.post('/add_user_details', verifyJwt.verifyJwtToken, auth.updateWishList)

// router.post("/resetPassOtp", auth.checkIfUserExist, auth.getOtp);
router.post('/update_user_details', verifyJwt.verifyJwtToken, auth.updateUserDeailsNew)

router.post("/resetPassword", auth.resetPassword);

module.exports = router;