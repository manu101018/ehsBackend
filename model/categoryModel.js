const mongoose = require("mongoose");
const commonFunction = require("../common/common")
const schema = mongoose.Schema;

const categoryModel = new schema({
    title: {
        type: String
    },
    cat_slug: {
        type: String,
    },
    imgUrl: {
        type: String,
    },
    cat_description: {
        type: String,
        default: ""
    },
    show_description: {
        type: Number,
        default: 0
    },
    use_discount: {
        type: Number,
        default: 0
    },
    cat_discount_type: {
        type: Number,
        default: commonFunction.discountType.FLAT
    },
    discountValue: {
        type: String,
        default: ""
    },
    isActive: {
        type: Number,
        default: 1,
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } })

module.exports = mongoose.model("category", categoryModel);