const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

const userschema = mongoose.Schema({
    name: {
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
    isAdmin: {
        type: Number,
        default: 0,
    },
    wishList: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "PosterModel",
        }],
    },
    cart: {
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
            total: {
                type: String,
            },
        }],
        default: []
    },
    session_token: {
        type: String
    }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("User", userschema);