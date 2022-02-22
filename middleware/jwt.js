const jwt = require('jsonwebtoken')
require('dotenv').config()
const commonFunction = require("../common/common")
const userDb = require("../model/userModel");
const mongoose = require("mongoose");

exports.verifyJwtToken = async(req, res, next) => {
    let token = req.headers["x-access-token"];
    try {
        if (!token) {
            throw new Error("Permission denied")
        }
        let decoded = await jwt.verify(token, commonFunction.tokenDetails.TOKENSECRET)
        req.userId = decoded._id
        if (req.userId) {
            let findCriteria = {
                _id: mongoose.Types.ObjectId(req.userId),
                is_account_activated: 1
            }
            let userFound = await userDb.find(findCriteria)
            if (userFound && Array.isArray(userFound) && userFound.length) {
                next();
            } else {
                throw new Error("User not found")
            }
        } else {
            throw new Error("Token is invalid")
        }

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }

}