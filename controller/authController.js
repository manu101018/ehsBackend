const userDb = require("../model/userModel");
const posterDb = require("../model/posterModel");
const materialDimensionDb = require("../model/materialDimensionModel");

const jwt = require("jsonwebtoken");
const transporter = require("../helpers/mail");
require("dotenv").config();
const configs = require("../configs");
const client = require("twilio")(configs.accountSID, configs.authToken);
const crypto = require("crypto");
const commonFunction = require("../common/common")
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mongoose = require("mongoose");

exports.getUsers = (req, res, next) => {
    userDb
        .find({},
            "_id firstname lastname emailid phonenumber address isAccountActive isActive"
        )
        .then((users) => {
            res.status(200).json({ message: "Successfully loaded!!!", users: users });
        })
        .catch((err) => {
            res.status(400).json({ error: `${err}` });
        });
};

exports.updateUserDeailsNew = async(req, res, next) => {
    try {
        let payload = req.body;
        let updateObj = {};
        let user_obj_id = req.userId

        payload.name ? updateObj.name = payload.name : ""
        payload.confromPass ? updateObj.confromPass = payload.confromPass : ""
        payload.passwordSet ? updateObj.passwordSet = payload.passwordSet : ""


        //payload.changePass should be 1 if you want to change pass 
        let changePass = payload.changePass || 0
        if (changePass && payload.oldPassword && payload.passwordSet) {
            if (payload.confromPass !== payload.passwordSet) {
                throw new Error("Confrom and set password Mismtach")
            }
            let findCriteria = {
                _id: mongoose.Types.ObjectId(user_obj_id)
            }
            let userResult = await userDb.find(findCriteria)
            if (!(userResult && Array.isArray(userResult) && userResult.length)) {
                throw new Error('Invalid User')
            }

            let isMatched = await bcrypt.compare(payload.oldPassword, userResult[0].password)
            if (!isMatched) {
                throw new Error(" Password is Incorrect Cant Change")
            }
            let passwordHash = await bcrypt.hash(updateObj.passwordSet, saltRounds)
            let updateCriteria = {
                password: passwordHash,

            }
            let userAdded = await userDb.findOneAndUpdate(findCriteria, updateCriteria, { new: true })
            let response = {
                info: "Password Changed Successfully !!"
            }
            return commonFunction.actionCompleteResponse(res, response)


        }
        delete updateObj.confromPass;
        delete updateObj.passwordSet;

        let findCriteria = {
            _id: mongoose.Types.ObjectId(user_obj_id)
        }
        let userAdded = await userDb.findOneAndUpdate(findCriteria, updateObj, { new: true })
        let response = {
            info: "User Details Updated"
        }
        return commonFunction.actionCompleteResponse(res, response)
    } catch (err) {
        console.log(err)
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
}

exports.updateWishList = async(req, res, next) => {
    try {
        let user_obj_id = req.userId
        let findCriteria = {
            _id: mongoose.Types.ObjectId(user_obj_id)
        }
        let payload = req.body
        let poster_obj_id = payload.poster_obj_id
        if (payload.add) {

            let updateCriteria = {}
            payload.poster_obj_id ? updateCriteria.$addToSet = {...updateCriteria.$addToSet, wishList: payload.poster_obj_id } : ""
            payload.address ? updateCriteria.$addToSet = {...updateCriteria.$addToSet, address: payload.address } : ""
            payload.editAddress ? updateCriteria.address = payload.editAddress : ""
            let userResult = await userDb.findOneAndUpdate(findCriteria, updateCriteria, { new: true })
            return commonFunction.actionCompleteResponse(res, userResult)

        } else {
            let updateCriteria = {}
            payload.poster_obj_id ? updateCriteria.$pull = {...updateCriteria.$pull, wishList: payload.poster_obj_id } : ""
            payload.address_pincode ? updateCriteria.$pull = {...updateCriteria.$pull,
                "address": {
                    "pincode": payload.address_pincode
                }
            } : ""
            console.log(updateCriteria)
            let userResult = await userDb.findOneAndUpdate(findCriteria, updateCriteria, { new: true })
            return commonFunction.actionCompleteResponse(res, userResult)

        }
    } catch (err) {
        console.log(err)
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
}

exports.getUserDetailsById = async(req, res, next) => {
    try {
        let user_obj_id = req.userId
        let findCriteria = {
            _id: mongoose.Types.ObjectId(user_obj_id)
        }
        let onlywish = req.query.onlywish
        let onlyCart = req.query.onlyCart
        if (onlywish) {
            let userResult = await userDb.find(findCriteria, {
                    _id: 1,
                    name: 1,
                    wishList: 1
                })
                .populate('wishList')
                .limit(1).exec()
            return commonFunction.actionCompleteResponse(res, userResult)

        }
        if (onlyCart) {
            let userResult = await userDb.find(findCriteria, {
                    _id: 1,
                    name: 1,
                    cart: 1
                })
                .populate('cart.poster_details')
                .populate('cart.materialDimension')
                .limit(1).exec()
            return commonFunction.actionCompleteResponse(res, userResult)

        }
        let userResult = await userDb.find(findCriteria)
            .populate('cart.poster_details')
            .populate('cart.materialDimension')
            .populate('wishList')
            .limit(1).exec()
        return commonFunction.actionCompleteResponse(res, userResult)
    } catch (err) {
        console.log(err)
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}




exports.updateUserCartNew = async(req, res, next) => {
    try {
        let user_obj_id = req.userId
        let payload = req.body
        let poster_obj_id = payload.poster_obj_id
        let material_obj_id = payload.material_obj_id
        let quantity = payload.quantity
        let removeCart = payload.removeCart

        if (removeCart) {
            let updaCri = {
                _id: mongoose.Types.ObjectId(user_obj_id)
            }
            let updaObj = {
                $pull: {
                    "cart": {
                        "poster_details": mongoose.Types.ObjectId(poster_obj_id)
                    }
                }
            }
            let updatedCart = await userDb.findOneAndUpdate(updaCri, updaObj, { new: true })
            return commonFunction.actionCompleteResponse(res, updatedCart)
        }

        if (!poster_obj_id || !material_obj_id || !quantity) {
            throw new Error("Please post with valid Details")
        }
        let posterFindCriteria = {
            _id: mongoose.Types.ObjectId(poster_obj_id),
            isActive: 1
        }
        let posterFound = await posterDb.find(posterFindCriteria).limit(1).exec();
        if (!(posterFound && Array.isArray(posterFound) && posterFound.length)) {
            throw new Error("poster id is wrong or poster Not Found")
        }
        let findMaterialDimesn = {
            isActive: 1,
            _id: mongoose.Types.ObjectId(material_obj_id)
        }
        let materialFind = await materialDimensionDb.find(findMaterialDimesn)
        if (!(materialFind && Array.isArray(materialFind) && materialFind.length)) {
            throw new Error("poster id is wrong or poster Not Found")
        }
        let materialJsonDetails = materialFind[0]
        let posterJsonDetails = posterFound[0]
        let totalPrice = materialJsonDetails.price * quantity;
        let insertObj = {
            poster_details: mongoose.Types.ObjectId(poster_obj_id),
            materialDimension: mongoose.Types.ObjectId(material_obj_id),
            quantity: quantity,
            total: totalPrice
        }
        let userFindCriteria = {
            _id: mongoose.Types.ObjectId(user_obj_id),
        }
        let userDetails = await userDb.find(userFindCriteria).limit(1).exec()
        if (!(userDetails && Array.isArray(userDetails) && userDetails.length)) {
            throw new Error("User Not Found");
        }

        let userJsonData = userDetails[0]
        let cartItems = userJsonData.cart || [];

        if (cartItems.length) {
            let existingRatingObject = cartItems.find(
                (ele) => ele.poster_details.toString() === poster_obj_id.toString()
            );
            if (existingRatingObject === undefined) {
                let updateCriteria = {
                    $addToSet: {
                        cart: insertObj
                    }
                }
                let updatedCart = await userDb.findOneAndUpdate(userFindCriteria, updateCriteria, { new: true })
                return commonFunction.actionCompleteResponse(res, updatedCart)
            } else {
                let updCri = {
                    _id: mongoose.Types.ObjectId(user_obj_id),
                    "cart.poster_details": mongoose.Types.ObjectId(poster_obj_id),
                }
                let updateObjCart = {
                    $set: {
                        "cart.$.quantity": insertObj.quantity,
                        "cart.$.total": insertObj.total,
                        "cart.$.materialDimension": insertObj.materialDimension,
                    }
                }
                let updatedCart = await userDb.findOneAndUpdate(updCri, updateObjCart, { new: true })
                return commonFunction.actionCompleteResponse(res, updatedCart)
            }
        } else {
            let updateCriteria = {
                $addToSet: {
                    cart: insertObj
                }
            }
            let updatedCart = await userDb.findOneAndUpdate(userFindCriteria, updateCriteria, { new: true })
            return commonFunction.actionCompleteResponse(res, updatedCart)
        }

    } catch (err) {
        console.log(err)
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}

exports.signUpNew = async(req, res, next) => {
    try {
        let payload = req.body;
        let userName = payload.userName;
        if (!userName) {
            throw new Error("Please Provide userName")
        }
        if (payload.email) {
            let email = payload.email;
            let password = payload.password;
            let passwordHash = await bcrypt.hash(password, saltRounds)
            console.log(passwordHash, "pass- hash")
            let findCriteria = {
                emailid: email,

            }
            let userFound = await userDb.find(findCriteria).limit(1).exec()
            if (userFound && Array.isArray(userFound) && userFound.length) {
                if (userFound[0].is_account_activated) {
                    throw new Error("Account Aldready Activated")
                }
                if (!userFound[0].is_otp_verified) {
                    throw new Error("Please verify Otp tp Sign Up")
                }
                let updateCriteria = {
                    password: passwordHash,
                    is_account_activated: 1,
                    name: userName
                }
                let userAdded = await userDb.findOneAndUpdate(findCriteria, updateCriteria, { new: true })
                let response = {
                    info: "user successfully Created , Please Login"
                }
                return commonFunction.actionCompleteResponse(res, response)

            } else {
                throw new Error("Please Verify Otp and Sign Up")
            }
        } else if (payload.phone) {
            let phonenumber = payload.phone;
            let password = payload.password;
            let passwordHash = await bcrypt.hash(password, saltRounds)
            let findCriteria = {
                phonenumber: payload.phone,
            }
            let userFound = await userDb.find(findCriteria).limit(1).exec()
            if (userFound && Array.isArray(userFound) && userFound.length) {
                if (userFound[0].is_account_activated) {
                    throw new Error("Account Aldready Activated")
                }
                if (!userFound[0].is_otp_verified) {
                    throw new Error("Please verify Otp tp Sign Up")
                }
                let updateCriteria = {
                    password: passwordHash,
                    is_account_activated: 1,
                    name: userName
                }
                let userAdded = await userDb.findOneAndUpdate(findCriteria, updateCriteria, { new: true })
                let response = {
                    info: "user successfully Created , Please Login"
                }
                return commonFunction.actionCompleteResponse(res, response)

            } else {
                throw new Error("Please Verify Otp and Sign Up")
            }
        } else {
            throw new Error("No Valid Details Provided")

        }
    } catch (error) {
        console.log(error)
        commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}

exports.requestOtpNew = async(req, res, next) => {
    try {
        let payload = req.body;
        if (payload.email) {
            let otpDetails = commonFunction.getOtpCreation();
            let mailOptions = {
                from: "hello@ehs.com",
                to: payload.email,
                subject: "EHS prints - Email OTP Verification",
                html: `<p>Your OTP is </p> <h3>${otpDetails.otp}</h3>`,
            };
            let findCriteria = {
                emailid: payload.email,
                is_account_activated: 1
            }
            let userDetails = await userDb.find(findCriteria)
            if (userDetails && Array.isArray(userDetails) && userDetails.length) {
                throw new Error("Account Aldready Exists , Please Login")
            }
            let deleteCriteria = {
                emailid: payload.email,
            }
            await userDb.deleteMany(deleteCriteria)
            let insertObj = {
                emailid: payload.email,
                otp: otpDetails.otp,
                otp_expires_in: otpDetails.expires_in,
            }
            await userDb(insertObj).save()
            let info = await transporter.sendMail(mailOptions);
            let result = {
                message_id: info.messageId,
                info: "Please verify the otp , Check Your mail",
                otp_expires_in: otpDetails.expires_in,
            }
            return commonFunction.actionCompleteResponse(res, result)

        } else if (payload.phone) {

            let otpDetails = commonFunction.getOtpCreation();
            let findCriteria = {
                phonenumber: payload.phone,
                is_account_activated: 1
            }
            let userDetails = await userDb.find(findCriteria)
            if (userDetails && Array.isArray(userDetails) && userDetails.length) {
                throw new Error("Account Aldready Exists , Please Login")
            }
            let deleteCriteria = {
                phonenumber: payload.phone,
            }
            await userDb.deleteMany(deleteCriteria)
            let successResponse = await client.messages.create({ body: `Your otp for EHS is ${otpDetails.otp}`, from: '+14076342637', to: payload.phone })
            let insertObj = {
                phonenumber: payload.phone,
                otp: otpDetails.otp,
                otp_expires_in: otpDetails.expires_in,
            }
            await userDb(insertObj).save()
            let reponse = {
                status: successResponse.status,
                info: "Please verify the otp , Check Your Phone",
                otp_expires_in: otpDetails.expires_in,
            }
            return commonFunction.actionCompleteResponse(res, reponse)

        } else {
            throw new Error("No Valid Details Provided")
        }
    } catch (err) {
        console.log(err)
        commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}

exports.verifyOTPNew = async(req, res, next) => {
    try {
        let payload = req.body
        if (payload.phone) {
            let otp = payload.otp;
            let presentDate = Date.now();
            let findCriteria = {
                otp: otp,
                otp_expires_in: {
                    $gte: presentDate
                },
                phonenumber: payload.phone,
                is_otp_verified: 0,
                is_account_activated: 0
            }
            let userFound = await userDb.find(findCriteria).limit(1)
            if (!(userFound && Array.isArray(userFound) && userFound.length)) {
                throw new Error("Wrong Otp Please check")
            }
            await userDb.findOneAndUpdate(findCriteria, { is_otp_verified: 1 }, { new: true })
            let response = {
                info: "Otp Verified"
            }
            return commonFunction.actionCompleteResponse(res, response)

        } else if (payload.email) {
            let otp = payload.otp;
            let presentDate = Date.now();
            let findCriteria = {
                otp: otp,
                otp_expires_in: {
                    $gte: presentDate
                },
                emailid: payload.email,
                is_otp_verified: 0,
                is_account_activated: 0
            }
            let userFound = await userDb.find(findCriteria).limit(1)
            if (!(userFound && Array.isArray(userFound) && userFound.length)) {
                throw new Error("Wrong Otp Please check")
            }
            await userDb.findOneAndUpdate(findCriteria, { is_otp_verified: 1 }, { new: true })
            let response = {
                info: "Otp Verified"
            }
            return commonFunction.actionCompleteResponse(res, response)

        } else {
            throw new Error("No Valid Details Provided")

        }
    } catch (err) {
        commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}

exports.LoginNew = async(req, res, next) => {
    try {
        let payload = req.body;
        if (payload.phone) {
            let findCriteria = {
                phonenumber: payload.phone,
                is_otp_verified: 1,
                is_account_activated: 1
            }
            let userFound = await userDb.find(findCriteria).limit(1)
            if (!(userFound && Array.isArray(userFound) && userFound.length)) {
                throw new Error("Please Sign Up Before Login")
            }
            let userDetails = userFound[0]
            let password = userDetails.password
            let isMatched = await bcrypt.compare(payload.password, userDetails.password)
            if (!isMatched) {
                throw new Error(" Password is Incorrect")
            }
            const token = jwt.sign({ _id: userDetails._id }, commonFunction.tokenDetails.TOKENSECRET, { expiresIn: 3600000 });
            let updatedUserDetails = await userDb.findOneAndUpdate(findCriteria, { session_token: token }, { new: true })
            let response = {
                session_token: token,
                user_details: updatedUserDetails
            }
            return commonFunction.actionCompleteResponse(res, response)

        } else if (payload.email) {
            let findCriteria = {
                emailid: payload.email,
                is_otp_verified: 1,
                is_account_activated: 1
            }
            let userFound = await userDb.find(findCriteria).limit(1)
            if (!(userFound && Array.isArray(userFound) && userFound.length)) {
                throw new Error("Please Sign Up Before Login")
            }
            let userDetails = userFound[0]
            let password = userDetails.password
            let isMatched = await bcrypt.compare(payload.password, userDetails.password)
            if (!isMatched) {
                throw new Error(" Password is Incorrect")
            }
            const token = jwt.sign({ _id: userDetails._id }, commonFunction.tokenDetails.TOKENSECRET, { expiresIn: 3600000 });
            let updatedUserDetails = await userDb.findOneAndUpdate(findCriteria, { session_token: token }, { new: true })
            let response = {
                session_token: token,
                user_details: updatedUserDetails
            }
            return commonFunction.actionCompleteResponse(res, response)

        } else {
            throw new Error("No Valid Details Provided")

        }
    } catch (err) {
        commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}


exports.getUpdateUserDetails = (req, res, next) => {
    req.updateObj = {};

    const payload = req.body;
    const { emailid } = req.body;

    payload.firstname ? (req.updateObj.firstname = payload.firstname) : null;
    payload.lastname ? (req.updateObj.lastname = payload.lastname) : null;
    payload.phonenumber ?
        (req.updateObj.phonenumber = payload.phonenumber) :
        null;
    payload.address ? (req.updateObj.address = payload.address) : null;
    payload.isAccountActive ?
        (req.updateObj.isAccountActive = payload.isAccountActive) :
        null;
    payload.cart ? (req.updateObj.cart = payload.cart) : null;
    payload.wishList ? (req.updateObj.wishList = payload.wishList) : null;

    if (payload.oldpassword) {
        userDb
            .findOne({ emailid })
            .then((userRes) => {
                if (!userRes) {
                    res.status(400).json({ message: "user not found" });
                } else {
                    bcrypt.compare(
                        payload.oldpassword,
                        userRes.password,
                        (err, isSame) => {
                            if (!isSame) {
                                res.status(400).json({ message: "password not match" });
                            } else {
                                bcrypt.hash(payload.password, saltRounds, (err, hash) => {
                                    req.updateObj.password = hash;
                                    next();
                                });
                            }
                        }
                    );
                }
            })
            .catch((err) => {
                res.status(400).json({ error: `${err}` });
            });
    } else {
        next();
    }
};

exports.updateUserDetails = async(req, res, next) => {
    const { emailid, phonenumber, address } = req.body;

    if (emailid) {
        try {
            let result = await userDb
                .updateOne({ emailid: emailid }, { address: address })
                .exec();
            res.status(200).json({ updated: true });
        } catch (err) {
            res.status(400).json({ updated: false, error: `${err}` });
        }
    } else if (phonenumber) {
        try {
            let result = await userDb
                .updateOne({ phonenumber: phonenumber }, { address: address })
                .exec();
            res.status(200).json({ updated: true });
        } catch (err) {
            res.status(400).json({ updated: false, error: `${err}` });
        }
    } else {
        console.log("No Details Provided");
    }

};

exports.resetPassword = async(req, res, next) => {
    var { emailid, phonenumber, password } = req.body;
    //console.log(req.body)
    if (emailid) {
        const user = await userDb.findOne({ emailid })
        if (!user) {
            res.json({ message: "You have not registered yet!!!" });
        } else {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if (err) {
                    console.log("Error hashing password for user", emailid);
                } else {
                    console.log(user.password);
                    userDb.updateOne({ emailid }, { password: hash }).exec();
                    res.status(200).json({ message: "Password Changed Successfully!!!" });
                }
            });
        }
    } else if (phonenumber) {
        const user = await userDb.findOne({ phonenumber })
        if (!user) {
            res.json({ message: "You have not registered yet!!!" });
        } else {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if (err) {
                    console.log("Error hashing password for user", phonenumber);
                } else {
                    console.log(user.password);
                    console.log(password)
                    console.log(hash);
                    userDb.updateOne({ phonenumber }, { password: hash }).exec();
                    res.status(200).json({ message: "Password Changed Successfully!!!" });
                }
            });


        }
    } else {
        console.log("No Details Provided");
    }
}