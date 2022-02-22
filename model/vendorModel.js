const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

const vendorSchema = mongoose.Schema({
    venor_name: {
        type: String,
        default: ""
    },
    emailid: {
        type: String,
        default: ""
    },
    password: {
        type: String,
    },
    phonenumber: {
        type: String,
        default: ""
    },
    address: [{
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
    }],
    otp: {
        type: Number,
    },
    otp_expires_in: {
        type: Number
    },
    is_otp_verified: {
        type: Number,
        default: 0
    },
    is_account_activated: {
        type: Number,
        default: 0
    },
    session_token: {
        type: String
    }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("vendorSchema", vendorSchema);