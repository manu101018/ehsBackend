const materialDimensionDb = require("../model/materialDimensionModel");
const base64_encode = require("../helpers/base64");
const fs = require("fs");
const storageImg = require("../helpers/storageImg");
const comonRespnses = require("../common/common")
const mongoose = require("mongoose");


exports.getMaterial = async(req, res, next) => {
    try {
        let result = await materialDimensionDb.find({ isActive: 1 })
        comonRespnses.actionCompleteResponse(res, result)
    } catch (error) {
        comonRespnses.sendActionFailedResponse(res, null, error.message)
    }
};

exports.createMaterial = async(req, res, next) => {
    const payload = req.body;
    let material_title = payload.material_title;
    let material_imgUrl = payload.material_imgUrl;
    let dimension_title = payload.dimension_title;
    let dimension_imgUrl = payload.dimension_imgUrl;
    let price = payload.price

    try {
        let insertObj = {
            material_title,
            material_imgUrl,
            dimension_title,
            dimension_imgUrl,
            price
        }
        let result = await new materialDimensionDb(insertObj).save();
        comonRespnses.actionCompleteResponse(res, result)
    } catch (error) {
        comonRespnses.sendActionFailedResponse(res, null, error.message)
    }

};

exports.updateMaterial = async(req, res, next) => {
    try {
        const payload = req.body;
        let material_title = payload.material_title;
        let material_imgUrl = payload.material_imgUrl;
        let dimension_title = payload.dimension_title;
        let dimension_imgUrl = payload.dimension_imgUrl;
        let price = payload.price
        let material_obj_id = payload.material_obj_id
        if (!material_obj_id) {
            throw new Error("Material obj not found")
        }
        let updateObj = {};
        material_title ? updateObj.material_title = material_title : ""
        material_imgUrl ? updateObj.material_img_url = material_imgUrl : ""
        dimension_title ? updateObj.dimension_title = dimension_title : ""
        dimension_imgUrl ? updateObj.dimension_img_url = dimension_imgUrl : ""
        payload.isActive == 0 || payload.isActive ? updateObj.isActive = payload.isActive : ""
        price ? updateObj.price = price : ""
        let result = await materialDimensionDb.update({ _id: material_obj_id }, updateObj, { new: false })
        comonRespnses.actionCompleteResponse(res, result)
    } catch (err) {
        comonRespnses.sendActionFailedResponse(res, null, err.message)
    }

};