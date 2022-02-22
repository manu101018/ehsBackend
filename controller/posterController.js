const posterDb = require("../model/posterModel");
const subCategoryDb = require("../model/subCategoryModel");
const categoryDb = require("../model/categoryModel");
const base64_encode = require("../helpers/base64");
const fs = require("fs");
const commonFunction = require("../common/common")
const mongoose = require("mongoose");
const authorDb = require("../model/authorModel");
const Counters = require("../model/counterModel");



function getNextSequenceValue(sequenceName) {
    console.log("sequenceName", sequenceName)
    return new Promise((resolve, reject) => {

        // let collection = db.collection('counters');
        Counters.collection.findAndModify(
            { "_id": sequenceName },
            [],
            { "$inc": { sequence_value: 1 } },
            { upsert: true, new: true },
            function (err, result) {
                if (result && result.value && result.value.sequence_value) {
                    return resolve(parseInt(result.value.sequence_value));
                } else {
                    return reject(err || "Something went wrong")
                }

            }
        );

    });
}
exports.getPosterByAuthor = async (req, res, next) => {
    try {
        let payload = req.query

        let skip = parseInt(payload.skip) || 0
        let limit = parseInt(payload.limit) || 20
        let author_slug = payload.author_slug

        if (!author_slug) {
            throw new Error("Passs author_Slug")
        }
        let authFindCri = {
            isActive: 1,
            author_slug
        }
        let authorFound = await authorDb.find(authFindCri)
        if (!(authorFound && Array.isArray(authorFound) && authorFound.length)) {
            throw new Error("Author not Found Enter Proper author Slug")
        }

        let author_obj_id = authorFound[0]._id
        let findCriteria = {
            isActive: 1,
            authors: {
                $in: [mongoose.Types.ObjectId(author_obj_id)]
            }
        }

        let result = await posterDb.find(findCriteria)
            .populate("category")
            .populate("subCategory")
            .populate("materialDimension").skip(skip).limit(limit)
        let count = 0
        count = await posterDb.countDocuments(findCriteria)

        let respoSeRSend = {
            authorDetails: authorFound[0],
            postersOfAuthor: result,
            count: count
        }
        return commonFunction.actionCompleteResponse(res, respoSeRSend)
    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
}

exports.insertUpdateRating = async (req, res, next) => {
    try {
        let payload = req.body
        let userObjId = req.userId;
        let ratingUserGiven = payload.rating;
        let feedBack = payload.feedback;
        let findCriteria = {
            isActive: 1
        }
        payload.poster_obj_id ? findCriteria._id = mongoose.Types.ObjectId(payload.poster_obj_id) : null
        payload.poster_slug ? findCriteria.slug = payload.poster_slug : null

        if (userObjId && findCriteria._id) {
            let posterDbDataFound = await posterDb.find(findCriteria).exec();
            if (posterDbDataFound && Array.isArray(posterDbDataFound) && posterDbDataFound.length) {
                let rating = posterDbDataFound[0].rating;
                let existingRatingObject = rating.find(
                    (ele) => ele.userId.toString() === userObjId.toString()
                );
                if (existingRatingObject === undefined) {
                    let updateCri = {
                        $push: {
                            rating: {
                                rating: ratingUserGiven,
                                userId: userObjId,
                                feedback: feedBack
                            }
                        },
                    }
                    let ratingAdded = await posterDb.findByIdAndUpdate(findCriteria, updateCri, { new: true }).exec();
                    let updateCriNew = [{
                        $set: {
                            average_rating: {
                                $avg: "$rating.rating"
                            }
                        }
                    }];
                    await posterDb.update(findCriteria, updateCriNew).exec()
                    return commonFunction.actionCompleteResponse(res, ratingAdded)
                } else {
                    let updateCri = {
                        $set: {
                            "rating.$.rating": ratingUserGiven,
                            "rating.$.feedback": feedBack
                        }
                    }

                    let updateCriNew = [{
                        $set: {
                            average_rating: {
                                $avg: "$rating.rating"
                            }
                        }
                    }];
                    let findCri = findCriteria
                    findCriteria = {
                        ...findCriteria,
                        "rating.userId": userObjId
                    };
                    const ratingUpdated = await posterDb.updateOne(findCriteria, updateCri, { new: true }).exec();
                    await posterDb.update(findCri, updateCriNew).exec()

                    return commonFunction.actionCompleteResponse(res, ratingUpdated)
                }
            } else {
                throw new Error("poster id is wrong")
            }

        } else {
            throw new Error("Proper Details Not Found")
        }
    } catch (err) {
        console.log(err);
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}

exports.createPoster = async (req, res, next) => {
    try {
        let payload = req.body;
        let insertObj = {
            name: payload.name,
            category: payload.category,
            subCategory: payload.subCategory || [],
            language: payload.language,
            creator: payload.creator,
            imgUrl: payload.imgUrl,
            description: payload.description,
            discountValue: payload.discountValue,
            stocks: payload.stocks,
            materialDimension: payload.materialDimension,
            tags: payload.tags,
            link: payload.link,
            // sku: payload.sku,
            weight: payload.weight,
            additionalDetails: payload.additionalDetails,
            bestSeller: payload.bestSeller,
            originalPrice: payload.originalPrice,
            discount_type: payload.discount_type,
            authors: payload.authors,
            orginal_one_drive_link: payload.orginal_one_drive_link,
            poster_language_connector: payload.poster_language_connector
        };
        if (!(insertObj.category && Array.isArray(insertObj.category) && insertObj.category.length)) {
            throw new Error("Please Select the Category")
        }

        let nameToAppend = "";
        let catIds = []

        //to get the cateogry name and append it
        for (let i = 0; i < insertObj.category.length; i++) {
            let findCr = {
                isActive: 1,
                _id: mongoose.Types.ObjectId(insertObj.category[i])
            }
            catIds.push(mongoose.Types.ObjectId(insertObj.category[i]))
            let catF = await categoryDb.find(findCr).limit(1)
            if (catF && Array.isArray(catF) && catF.length) {
                nameToAppend = catF[0].title
            } else {
                throw new Error("Invalaid Categeory Id")
            }
        }

        //sub category name
        let subCatNameToAppend = ""
        for (let i = 0; i < insertObj.subCategory.length; i++) {
            let findCr = {
                isActive: 1,
                _id: mongoose.Types.ObjectId(insertObj.subCategory[i])
            }
            let catF = await subCategoryDb.find(findCr).limit(1)
            if (catF && Array.isArray(catF) && catF.length) {
                subCatNameToAppend = subCatNameToAppend + " | " + catF[0].title
            } else {
                throw new Error("Invalaid Categeory Id")
            }
        }

        if (!insertObj.name) {
            throw new Error("Name required for insert");
        }

        // let count = await getNextSequenceValue("posters")
        // console.log(count)

        let count = insertObj.name
    
        insertObj.name = nameToAppend + " | " + nameToAppend[0] + "_" + insertObj.name
        if (subCatNameToAppend !== "") {
            console.log("Inside sub cat name")
            insertObj.name = nameToAppend + subCatNameToAppend + " | " + nameToAppend[0] + "_" + count
        }
        console.log("insertObj.name", insertObj.name)
        insertObj.slug = commonFunction.autoCreateSlugPosters(insertObj.name, count)
        insertObj.sku = commonFunction.autoCreateSlugPosters(insertObj.name, count)

        let posterAldreadyFound = await posterDb.find({ slug: insertObj.slug, isActive: 1 }).limit(1).exec()
        if (posterAldreadyFound && Array.isArray(posterAldreadyFound) && posterAldreadyFound.length) {
            throw new Error("Poster name already exists")
        }

        let result = await new posterDb(insertObj).save();
        commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        commonFunction.sendActionFailedResponse(res, null, err.message)

    }
};

exports.getPosterById = async (req, res, next) => {
    try {
        let payload = req.query;
        let findCriteria = {
            isActive: 1
        }
        payload.slug ? findCriteria.slug = payload.slug : ""
        payload.poster_obj_id ? findCriteria._id = mongoose.Types.ObjectId(payload.poster_obj_id) : ""
        console.log(findCriteria)
        let posterResult = await posterDb.find(findCriteria)
        let result = await posterDb.find(findCriteria)
            .populate("category")
            .populate("subCategory")
            .populate("authors")
            .populate("materialDimension")
        if (!(result && Array.isArray(result) && result.length)) {
            throw new Error("Poster Not Found with the given Data")
        }
        let parsedPoster = JSON.parse(JSON.stringify(posterResult))
        let category = parsedPoster[0].category
        let subCat = parsedPoster[0].subCategory
        let discountsAvailable = []
        let descriptionText = []

        if (category && Array.isArray(category) && category.length) {
            let catPassTHri = result[0].category[0]
            if (catPassTHri.use_discount) {
                let pushDis = {
                    discountType: catPassTHri.cat_discount_type,
                    discountValue: catPassTHri.discountValue
                }
                discountsAvailable.push(pushDis)
            }
            if (catPassTHri.show_description) {
                descriptionText.push(catPassTHri.cat_description)
            }
        }

        if (subCat && Array.isArray(subCat) && subCat.length) {
            let subCatArrayToMap = result[0].subCategory
            for (let i = 0; i < subCatArrayToMap.length; i++) {
                if (subCatArrayToMap[i].use_discount == 1) {
                    let pushDis = {
                        discountType: subCatArrayToMap[i].sub_cat_discount_type,
                        discountValue: subCatArrayToMap[i].discountValue
                    }
                    discountsAvailable.push(pushDis)
                }
                if (subCatArrayToMap[i].show_description == 1) {
                    descriptionText.push(subCatArrayToMap[i].sub_cat_description)
                }
            }
        }

        let findRealtedPosters = {
            isActive: 1,
            category: {
                $in: category
            }
        }
        let relatedProd = await posterDb.find(findRealtedPosters)
            .populate("category")
            .populate("authors")
            .populate("subCategory")
            .populate('materialDimension')
            .limit(10).exec()
        let bestSellerFindCriteria = {
            isActive: 1,
            bestSeller: 1
        }
        let aggreg = [{
            $match: findCriteria
        }, {
            "$project": {
                rating: {
                    "$size": "$rating"
                }
            }
        }]

        let arrRatings = [{
            "$match": findCriteria
        },
        {
            "$unwind": "$rating"
        },
        {
            $group: {
                _id: "$rating.rating",
                "sumvalues": {
                    "$sum": 1
                }
            }
        },
        {
            "$project": {
                _id: 0,
                rating: "$_id",
                count: "$sumvalues",

            }
        }
        ]
        let posterRating = await posterDb.aggregate(aggreg)
        let ratingWiseMembers = await posterDb.aggregate(arrRatings)
        let bestSellarposter = await posterDb.find(bestSellerFindCriteria)
            .populate("category")
            .populate("subCategory")
            .populate("authors")
            .populate('materialDimension')
            .limit(10).exec()
        let responsetoSend = {
            posterDetails: result,
            realtedPosters: relatedProd,
            youMayAlsoLike: bestSellarposter,
            totalNoOfRating: posterRating[0].rating,
            ratingTotalWise: ratingWiseMembers,
            discountsAvailable,
            descriptionText
        }

        return commonFunction.actionCompleteResponse(res, responsetoSend)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)
    }
};

exports.getPosterBySubCategory = async (req, res, next) => {
    try {
        let payload = req.query
        let findCriteria = {
            isActive: 1
        }
        let skip = parseInt(payload.skip) || 0
        let limit = parseInt(payload.limit) || 20
        payload.category_slug ? findCriteria.cat_slug = payload.category_slug : ""
        payload.cat_obj_id ? findCriteria._id = mongoose.Types.ObjectId(payload.cat_obj_id) : ""
        payload.subCategorySlug ? findCriteria.sub_cat_slug = payload.subCategorySlug : ""
        payload.sub_cat_obj_id ? findCriteria._id = mongoose.Types.ObjectId(payload.sub_cat_obj_id) : ""

        if (findCriteria.cat_slug || findCriteria._id) {
            let catResult = await categoryDb.find(findCriteria).limit(1).exec()
            if (!(catResult && Array.isArray(catResult) && catResult.length)) {
                throw new Error("Category Not Found")
            }
            let posterFindCriteria = {
                isActive: 1,
                category: {
                    $in: catResult[0]._id
                }
            }
            payload.bestseller ? posterFindCriteria.bestSeller = payload.bestseller : ""
            let postersExists = await posterDb.find(posterFindCriteria)
                .populate("category")
                .populate("subCategory")
                .populate("authors")
                .populate("materialDimension").skip(skip).limit(limit)
            let count = 0
            count = await posterDb.countDocuments(posterFindCriteria)
            let resu = {
                postersExists: postersExists,
                count: count
            }
            return commonFunction.actionCompleteResponse(res, resu)

        } else if (findCriteria._id || findCriteria.sub_cat_slug) {
            let subcatResult = await subCategoryDb.find(findCriteria).limit(1).exec()
            if (!(subcatResult && Array.isArray(subcatResult) && subcatResult.length)) {
                throw new Error("sub Category Not Found")
            }
            let posterFindCriteria = {
                isActive: 1,
                subCategory: {
                    $in: subcatResult[0]._id
                }
            }
            payload.bestseller ? posterFindCriteria.bestSeller = payload.bestseller : ""
            let postersExists = await posterDb.find(posterFindCriteria)
                .populate("category")
                .populate("subCategory")
                .populate("authors")
                .populate("materialDimension").skip(skip).limit(limit)
            let count = 0
            count = await posterDb.countDocuments(posterFindCriteria)
            let resu = {
                postersExists: postersExists,
                count: count
            }
            return commonFunction.actionCompleteResponse(res, resu)

        } else {
            throw new Error("Not Data Available, Enter Proper Data")
        }
    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
};

exports.getPosterByLanguage = async (req, res, next) => {
    try {
        let payload = req.query
        let findCriteria = {
            isActive: 1
        }
        let skip = parseInt(payload.skip) || 0
        let limit = parseInt(payload.limit) || 20
        let language = payload.language
        if (!language) {
            throw new Error("Pass in the language key")
        }
        findCriteria.language = parseInt(language)
        let result = await posterDb.find(findCriteria)
            .populate("category")
            .populate("subCategory")
            .populate("authors")
            .populate("materialDimension").skip(skip).limit(limit)
        let count = 0
        count = await posterDb.countDocuments(findCriteria)
        let resu = {
            postersExists: result,
            count: count
        }
        return commonFunction.actionCompleteResponse(res, resu)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}

exports.getPoster = async (req, res, next) => {

    try {
        let payload = req.query
        let findCriteria = {
            isActive: 1
        }
        let skip = parseInt(payload.skip) || 0
        let limit = parseInt(payload.limit) || 20
        let result = await posterDb.find(findCriteria)
            .populate("category")
            .populate("subCategory")
            .populate("authors")
            .populate("materialDimension").skip(skip).limit(limit)

        let count = 0;
        count = await posterDb.countDocuments(findCriteria)
        let resu = {
            postersExists: result,
            count: count
        }
        return commonFunction.actionCompleteResponse(res, resu)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
};

exports.updatePoster = async (req, res, next) => {
    try {
        let payload = req.body;
        let poster_obj_id = payload.poster_obj_id;

        let updateObj = {};
        if (payload.name) {
            updateObj.name = payload.name;
            updateObj.slug = commonFunction.autoCreateSlug(payload.name)
            let posterAldreadyFound = await posterDb.find({ slug: updateObj.slug, isActive: 1 }).limit(1).exec()
            if (posterAldreadyFound && Array.isArray(posterAldreadyFound) && posterAldreadyFound.length) {
                throw new Error("Poster name already exists")
            }
        }
        payload.language ? updateObj.language = payload.language : ""
        payload.creator ? updateObj.creator = payload.creator : ""
        payload.imgUrl ? updateObj.imgUrl = payload.imgUrl : ""
        payload.description ? updateObj.description = payload.description : ""
        payload.discountValue ? updateObj.discountValue = payload.discountValue : ""
        payload.discount_type == 0 || payload.discount_type ? updateObj.discount_type = payload.discount_type : ""

        payload.stocks ? updateObj.stocks = payload.stocks : ""
        payload.link ? updateObj.link = payload.link : ""
        payload.sku ? updateObj.sku = payload.sku : ""
        payload.weight ? updateObj.weight = payload.weight : ""
        payload.orginal_one_drive_link ? updateObj.orginal_one_drive_link = payload.orginal_one_drive_link : ""
        payload.additionalDetails ? updateObj.additionalDetails = payload.additionalDetails : ""
        payload.originalPrice ? updateObj.originalPrice = payload.originalPrice : ""
        payload.bestSeller == 0 || payload.bestSeller ? updateObj.bestSeller = payload.bestSeller : ""
        payload.isActive == 0 || payload.isActive ? updateObj.isActive = payload.isActive : ""
        if (payload.operationType) {
            switch (payload.operationType) {
                case commonFunction.operationType.PUSH:
                    {
                        payload.category ? updateObj.$addToSet = { ...updateObj.$addToSet, category: payload.category } : ""
                        payload.subCategory ? updateObj.$addToSet = { ...updateObj.$addToSet, subCategory: payload.subCategory } : ""
                        payload.tags ? updateObj.$addToSet = { ...updateObj.$addToSet, tags: payload.tags } : ""
                        payload.materialDimension ? updateObj.$addToSet = { ...updateObj.$addToSet, materialDimension: payload.materialDimension } : ""
                        payload.imgUrl ? updateObj.$addToSet = { ...updateObj.$addToSet, imgUrl: payload.imgUrl } : ""
                        payload.poster_language_connector ? updateObj.$addToSet = { ...updateObj.$addToSet, poster_language_connector: payload.poster_language_connector } : ""
                    }
                    break;
                case commonFunction.operationType.PULL:
                    {
                        payload.category ? updateObj.$pull = { ...updateObj.$pull, category: payload.category } : ""
                        payload.subCategory ? updateObj.$pull = { ...updateObj.$pull, subCategory: payload.subCategory } : ""
                        payload.tags ? updateObj.$pull = { ...updateObj.$pull, tags: payload.tags } : ""
                        payload.materialDimension ? updateObj.$pull = { ...updateObj.$pull, materialDimension: payload.materialDimension } : ""
                        payload.imgUrl ? updateObj.$pull = { ...updateObj.$pull, imgUrl: payload.imgUrl } : ""
                        payload.poster_language_connector ? updateObj.$pull = { ...updateObj.$pull, poster_language_connector: payload.poster_language_connector } : ""

                    }
                    break;
                case commonFunction.operationType.REPLACE:
                    {
                        payload.category ? updateObj.category = payload.category : ""
                        payload.subCategory ? updateObj.subCategory = payload.subCategory : ""
                        payload.tags ? updateObj.tags = payload.tags : ""
                        payload.materialDimension ? updateObj.materialDimension = payload.materialDimension : ""
                        payload.imgUrl ? updateObj.imgUrl = payload.imgUrl : ""
                        payload.poster_language_connector ? updateObj.poster_language_connector = payload.poster_language_connector : ""
                        payload.authors ? updateObj.authors = payload.authors : ""
                    }
                    break;
                default:
                    break;

            }
        }
        console.log(updateObj , "updateObj")
        let result = await posterDb.findOneAndUpdate({ _id: poster_obj_id }, updateObj, { new: true })
        return commonFunction.actionCompleteResponse(res, result)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
};

exports.uploadFile = async (req, res, next) => {
    try {
        console.log(req.file)

        // let imgUrl = `${req.protocol}://${req.get("host")}/${req.file.destination + req.file.filename}`;

        let responseObj = {
            fileSavedUrl: req.file.location,
            destination: req.file.location,
            fileName: req.file.originalname
        }
        return commonFunction.actionCompleteResponse(res, responseObj)

    } catch (err) {
        return commonFunction.sendActionFailedResponse(res, null, err.message)

    }
}