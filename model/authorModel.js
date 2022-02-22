const mongoose = require("mongoose");

const schema = mongoose.Schema;

const auhorModel = new schema({
    author_name: {
        type: String,
        default: ""
    },
    author_slug: {
        type: String,
        default: ""
    },
    author_description: {
        type: String,
        default: ""
    },
    author_designation: {
        type: String,
        default: ""
    },
    auth_image: {
        type: String,
        default: ""
    },
    auth_email: {
        type: String,
        default: ""
    },
    isActive: {
        type: Number,
        default: 1,
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("authors", auhorModel);