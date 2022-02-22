const mongoose = require("mongoose");
const commonFunction = require("../common/common")
const schema = mongoose.Schema;

const couponsModel = new schema({
    coupon_name: {
        type: String
    },
    coupon_code: {
        type: String,
    },
    coupon_image: {
        type: String,
    },
    coupon_discount_type: {
        type: Number,
        default: commonFunction.discountType.FLAT
    },
    discountValue: {
        type: String,
        default: ""
    },
    start_time: {
        type: Number,
        default: 0
    },
    end_time: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Number,
        default: 1,
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } })

module.exports = mongoose.model("coupons", couponsModel);