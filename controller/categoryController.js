const categoryDb = require("../model/categoryModel");
const commonFunction = require("../common/common")
const mongoose = require("mongoose");


exports.getCategory = async(req, res, next) => {
    try {
        let payload = req.query
        let skip = parseInt(payload.skip) || 0;
        let limit = parseInt(payload.limit) || 30;

        let findCriteria = {
            isActive: 1
        }
        payload.cat_slug ? findCriteria.cat_slug = payload.cat_slug : ""
        payload.use_discount == 0 || payload.use_discount ? findCriteria.use_discount = payload.use_discount : ""
        payload.show_description == 0 || payload.show_description ? findCriteria.show_description = payload.show_description : ""

        let result = await categoryDb.find(findCriteria).skip(skip).limit(limit)
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
};

exports.getCategoryById = async(req, res, next) => {
    try {
        let payload = req.query
        let criteria = { isActive: 1 }
        payload.cat_obj_id ? criteria._id = mongoose.Types.ObjectId(payload.cat_obj_id) : ""
        payload.cat_slug ? criteria.cat_slug = payload.cat_slug : ""
        let agg = [{
                '$match': criteria
            },
            {
                $lookup: {
                    from: "subcategories",
                    let: { workflowId: "$_id", isActiveCheck: 1 },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$categoryId", "$$workflowId"] },
                                    { $eq: ["$isActive", "$$isActiveCheck"] }
                                ]
                            }
                        }
                    }, ],
                    as: "sub_category"
                }
            }
        ]
        let result = await categoryDb.aggregate(agg)

        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }

};

exports.createCategory = async(req, res, next) => {
    try {
        let payload = req.body;
        let title = payload.title;
        let cat_slug = commonFunction.autoCreateSlug(title);
        let imgUrl = payload.imgUrl
        let cat_description = payload.cat_description
        let show_description = payload.show_description
        let cat_discount_type = payload.cat_discount_type
        let discountValue = payload.discountValue
        let use_discount = payload.use_discount

        let insertObj = {
            title,
            cat_slug,
            imgUrl,
            discountValue: discountValue,
            cat_description,
            show_description,
            cat_discount_type,
            use_discount
        }
        let findCriteria = {
            isActive: 1,
            cat_slug
        }
        let ifCatFound = await categoryDb.find(findCriteria)
        if (ifCatFound && Array.isArray(ifCatFound) && ifCatFound.length) {
            throw new Error("Category already exists with this name")
        }

        let result = await new categoryDb(insertObj).save();
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
};

exports.updateCategory = async(req, res, next) => {
    try {
        let payload = req.body;
        let cat_obj_id = payload.cat_obj_id;
        let updateObj = {};
        if (payload.title) {
            updateObj.title = payload.title;
            updateObj.cat_slug = commonFunction.autoCreateSlug(updateObj.title);
            let findCriteria = {
                isActive: 1,
                cat_slug: updateObj.cat_slug
            }
            let ifCatFound = await categoryDb.find(findCriteria)
            if (ifCatFound && Array.isArray(ifCatFound) && ifCatFound.length) {
                throw new Error("Category already exists with this name , Update Failed")
            }

        }
        payload.imgUrl ? updateObj.imgUrl = payload.imgUrl : ""
        payload.isActive == 0 || updateObj.isActive ? updateObj.isActive = payload.isActive : ""
        payload.discountValue ? updateObj.discountValue = payload.discountValue : ""
        payload.cat_discount_type == 0 || payload.cat_discount_type ? updateObj.cat_discount_type = payload.cat_discount_type : ""
        payload.cat_description ? updateObj.cat_description = payload.cat_description : ""
        payload.use_discount == 0 || payload.use_discount ? updateObj.use_discount = payload.use_discount : ""
        payload.show_description == 0 || payload.show_description ? updateObj.show_description = payload.show_description : ""

        if (!cat_obj_id) {
            throw new Error("Sub Cat obj not found")
        }
        let result = await categoryDb.findOneAndUpdate({ _id: cat_obj_id }, updateObj, { new: true })
        return commonFunction.actionCompleteResponse(res, result)
    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
};