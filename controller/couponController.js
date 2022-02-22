const couponsDb = require("../model/couponsModel");
const commonFunction = require("../common/common")
const mongoose = require("mongoose");

exports.applyCoupon = async(req, res, next) => {
    try {
        let payload = req.query
        let findCriteria = {
            isActive: 1
        }
        if (!payload.couponCode) {
            throw new Error("Coupon code not entered")
        }
        findCriteria.coupon_code = payload.couponCode
        findCriteria.end_time = {
            $gt: Date.now()
        }
        let result = await couponsDb.find(findCriteria)
        return commonFunction.actionCompleteResponse(res, result)
    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}


exports.getCoupon = async(req, res, next) => {
    try {
        let payload = req.query
        let skip = parseInt(payload.skip) || 0;
        let limit = parseInt(payload.limit) || 30;

        let findCriteria = {
            isActive: 1
        }
        payload.coupon_obj_id ? findCriteria._id = mongoose.Types.ObjectId(payload.coupon_obj_id) : ""
        payload.coupon_code ? findCriteria.coupon_code = payload.coupon_code : ""

        let result = await couponsDb.find(findCriteria).skip(skip).limit(limit)
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
};


exports.createCoupon = async(req, res, next) => {
    try {
        let payload = req.body;
        let coupon_name = payload.coupon_name;
        let coupon_code = payload.coupon_code
        let coupon_image = payload.coupon_image
        let coupon_discount_type = payload.coupon_discount_type
        let discountValue = payload.discountValue
        let start_time = payload.start_time
        let end_time = payload.end_time
        let insertObj = {
            coupon_name,
            coupon_code,
            coupon_image,
            coupon_discount_type,
            discountValue,
            start_time,
            end_time
        }
        let findCriteria = {
            isActive: 1,
            coupon_code
        }
        let isCouponPresent = await couponsDb.find(findCriteria)
        if (isCouponPresent && Array.isArray(isCouponPresent) && isCouponPresent.length) {
            throw new Error("Coupon already exists with this code")
        }

        let result = await new couponsDb(insertObj).save();
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
};

exports.updateCoupon = async(req, res, next) => {
    try {
        let payload = req.body;
        let coupon_obj_id = payload.coupon_obj_id;
        let updateObj = {};
        if (payload.coupon_code) {
            updateObj.coupon_code = payload.coupon_code;

            let findCriteria = {
                isActive: 1,
                coupon_code: updateObj.coupon_code
            }
            let isCouponFound = await couponsDb.find(findCriteria)
            if (isCouponFound && Array.isArray(isCouponFound) && isCouponFound.length) {
                throw new Error("author already exists with this name , Update Failed")
            }

        }
        payload.coupon_name ? updateObj.coupon_name = payload.coupon_name : ""
        payload.isActive == 0 || updateObj.isActive ? updateObj.isActive = payload.isActive : ""
        payload.coupon_image ? updateObj.coupon_image = payload.coupon_image : ""
        payload.coupon_discount_type ? updateObj.coupon_discount_type = payload.coupon_discount_type : ""
        payload.end_time ? updateObj.end_time = payload.end_time : ""
        payload.start_time ? updateObj.start_time = payload.start_time : ""
        payload.discountValue ? updateObj.discountValue = payload.discountValue : ""
        if (!coupon_obj_id) {
            throw new Error("Coupon obj not found")
        }

        let result = await couponsDb.findOneAndUpdate({ _id: coupon_obj_id }, updateObj, { new: true })
        return commonFunction.actionCompleteResponse(res, result)
    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
};