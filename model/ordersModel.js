const { json } = require("body-parser");
const mongoose = require("mongoose");
const schema = mongoose.Schema;
const comonRespnses = require("../common/common")

const ordersModel = new schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    Name: {
        type: String
    },
    user_type_order: {
        type: Number,
    },
    emailid: {
        type: String,
    },
    phonenumber: {
        type: String,
    },
    itemDetails: {
        type: [{
            poster_details: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PosterModel",
            },
            materialDimension: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MaterialDimension",
            },
            quantity: {
                type: Number,
            },
            originalPriceBeforeDiscount: {
                type: Number
            },
            total: {
                type: String,
            },
        }],
        default: []
    },
    is_coupon_applied: {
        type: Number,
        default: 0
    },
    price_before_discount: {
        type: Number,
        default: 0
    },
    couponDetails: {
        coupon_obj_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "coupons",
        },
        coupon_code: {
            type: String,
            default: ""
        },
        couponDiscountType: {
            type: Number
        },
        coupon_discount_value: {
            type: String
        }
    },
    sumPriceToPay: {
        type: String,
    },
    paymentId: {
        type: String,
    },
    orderId: {
        type: String,
        index: true
    },
    address: {
        houseDetails: {
            type: String,
        },
        pincode: {
            type: Number,
        },
        lat: {
            type: String,
        },
        lon: {
            type: String,
        },
        state: {
            type: String,
        },
        country: {
            type: String,
        }
    },
    paymentStatus: {
        type: Number,
        default: 0,
    },
    orderStatus: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Number,
        default: 1,
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("Orders", ordersModel);