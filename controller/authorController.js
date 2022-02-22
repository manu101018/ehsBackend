const authorDb = require("../model/authorModel");
const commonFunction = require("../common/common")
const mongoose = require("mongoose");


exports.getAuthor = async(req, res, next) => {
    try {
        let payload = req.query
        let skip = parseInt(payload.skip) || 0;
        let limit = parseInt(payload.limit) || 30;

        let findCriteria = {
            isActive: 1
        }
        payload.author_obj_id ? findCriteria._id = mongoose.Types.ObjectId(payload.author_obj_id) : ""
        payload.author_slug ? findCriteria.author_slug = payload.author_slug : ""

        let result = await authorDb.find(findCriteria).skip(skip).limit(limit)
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
};


exports.createAuthor = async(req, res, next) => {
    try {
        let payload = req.body;
        let author_name = payload.author_name;
        let author_slug = commonFunction.autoCreateSlug(author_name);
        let auth_image = payload.auth_image
        let author_description = payload.author_description
        let author_designation = payload.author_designation
        let auth_email = payload.auth_email
        let insertObj = {
            author_name,
            author_slug,
            auth_image,
            author_description,
            author_designation,
            auth_email
        }
        let findCriteria = {
            isActive: 1,
            author_slug
        }
        let ifAuthor = await authorDb.find(findCriteria)
        if (ifAuthor && Array.isArray(ifAuthor) && ifAuthor.length) {
            throw new Error("Author already exists with this name")
        }

        let result = await new authorDb(insertObj).save();
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
};

exports.updateAuthor = async(req, res, next) => {
    try {
        let payload = req.body;
        let author_obj_id = payload.author_obj_id;
        let updateObj = {};
        if (payload.author_name) {
            updateObj.author_name = payload.author_name;
            updateObj.author_slug = commonFunction.autoCreateSlug(updateObj.author_name);
            let findCriteria = {
                isActive: 1,
                author_slug: updateObj.author_slug
            }
            let ifauthorFound = await authorDb.find(findCriteria)
            if (ifauthorFound && Array.isArray(ifauthorFound) && ifauthorFound.length) {
                throw new Error("author already exists with this name , Update Failed")
            }

        }
        payload.author_description ? updateObj.author_description = payload.author_description : ""
        payload.isActive == 0 || updateObj.isActive ? updateObj.isActive = payload.isActive : ""
        payload.author_designation ? updateObj.author_designation = payload.author_designation : ""
        payload.auth_image ? updateObj.auth_image = payload.auth_image : ""
        payload.auth_email ? updateObj.auth_email = payload.auth_email : ""


        if (!author_obj_id) {
            throw new Error("author obj not found")
        }
        let result = await authorDb.findOneAndUpdate({ _id: author_obj_id }, updateObj, { new: true })
        return commonFunction.actionCompleteResponse(res, result)
    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
};