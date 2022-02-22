const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const commonFunction = require("../common/common")

const vendorAssign = mongoose.Schema({
    vendor_obj_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "vendorSchema",
    },
    user_obj_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    order_obj_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders",
    },
    user_email_id: {
        type: String,
    },
    user_phone_number: {
        type: String,
    },
    delivery_address: {
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
    poster_obj_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PosterModel",
    },
    material_obj_id: {
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
    vendor_accept_status: {
        type: Number,
        default: commonFunction.vendor_status.NOT_ACCEPTED
    },
    order_status: {
        type: Number,
        default: commonFunction.orderStatus.INITIATED,
    }

}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("vendorAssign", vendorAssign);