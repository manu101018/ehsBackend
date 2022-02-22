const mongoose = require("mongoose");
const commonFunction = require("../common/common")

const schema = mongoose.Schema;

const subcategoryModel = new schema({
    title: {
        type: String
    },
    sub_cat_slug: {
        type: String,
    },
    imgUrl: {
        type: String,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
    },
    sub_cat_description: {
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
    sub_cat_discount_type: {
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

module.exports = mongoose.model("subcategory", subcategoryModel);