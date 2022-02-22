const commonFunction = require("../common/common")
const mongoose = require("mongoose");
const vendorDb = require("../model/vendorModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;

exports.getAllVendor = async(req, res, next) => {
    try {
        let payload = req.query;
        let skip = payload.skip || 0
        let limit = payload.limit || 20
        let findCri = {
            isActive: 1
        }
        let vendorsAll = await vendorDb.find(findCri).skip(skip).limit(limit)
        let count = 0
        count = await vendorDb.countDocuments(findCri)
        let result = {
            total_docu: count,
            documents: vendorsAll
        }
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
}


exports.signup = async(req, res, next) => {
    try {
        let payload = req.body;
        let userName = payload.userName;
        let email = payload.email;
        let password = payload.password;
        let phoneNumber = payload.phoneNumber
        let passwordHash = await bcrypt.hash(password, saltRounds)
        let findCriteria = {
            emailid: email,
        }
        let vendorFound = await vendorDb.find(findCriteria).limit(1).exec()
        if (vendorFound && Array.isArray(vendorFound) && vendorFound.length) {
            throw new Error("Vendor Aldready Found")
        }
        let createObj = {
            venor_name: userName,
            emailid: email,
            password: passwordHash,
            phonenumber: phoneNumber,
        }
        await new vendorDb(createObj).save()
        let result = {
            info: "Vendor Created Please Login"
        }
        return commonFunction.actionCompleteResponse(res, result)


    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}

exports.login = async(req, res, next) => {
    try {
        let payload = req.body;
        let email = payload.email;
        let password = payload.password;
        let findCri = {
            emailid: email,
        }
        let vendorFound = await vendorDb.find(findCri).limit(1)
        if (!(vendorFound && Array.isArray(vendorFound) && vendorFound.length)) {
            throw new Error("Please Sign Up Before Login")
        }
        let vendorDetails = vendorFound[0]

        let isMatched = await bcrypt.compare(payload.password, vendorDetails.password)
        if (!isMatched) {
            throw new Error(" Password is Incorrect")
        }

        const token = jwt.sign({ _id: vendorDetails._id, is_vendor: 1 }, commonFunction.tokenDetails.TOKENSECRET, { expiresIn: 3600000 });
        let updatedUserDetails = await vendorDb.findOneAndUpdate(findCri, { session_token: token }, { new: true })
        let response = {
            session_token: token,
            vendor_details: updatedUserDetails
        }
        return commonFunction.actionCompleteResponse(res, response)


    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
}