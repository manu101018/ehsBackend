const mongoose = require("mongoose");

const schema = mongoose.Schema;

const materialDimensionModel = new schema({
    material_title: {
        type: String,
    },
    material_imgUrl: {
        type: String,
    },
    dimension_title: {
        type: String,
    },
    dimension_imgUrl: {
        type: String,
    },
    price: {
        type: Number,
    },
    isActive: {
        type: Number,
        default: 1,
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("MaterialDimension", materialDimensionModel);