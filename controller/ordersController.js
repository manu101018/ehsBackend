const ordersDb = require("../model/ordersModel");
const transporter = require("../helpers/mail");
const Razorpay = require("razorpay");
const comonRespnses = require("../common/common")
const verifyJwt = require("../middleware/jwt");
const materialDimensionDb = require("../model/materialDimensionModel");
const posterDb = require("../model/posterModel");
const mongoose = require("mongoose");
const shortid = require("shortid");
const userDb = require("../model/userModel");
const jwt = require('jsonwebtoken')
const crypto = require("crypto");
const configs = require("../configs");
const client = require("twilio")(configs.accountSID, configs.authToken);
const couponsDb = require("../model/couponsModel");


const razorpay = new Razorpay({
    key_id: comonRespnses.razorPayKey.key_id,
    key_secret: comonRespnses.razorPayKey.key_secret,
});

exports.createOrderNew = async(req, res, next) => {
    try {
        let payload = req.body;
        let user_obj_id = payload.user_obj_id;
        let cart_item = payload.cart_item;
        let delivery_address = payload.delivery_address
        let discountValueFIxed = 0;
        let discountTypeFixed = 6 // random value to check if exists
        let couponDetails = null
        if (payload.coupon_code) {
            let findCriteria = {
                isActive: 1
            }
            findCriteria.coupon_code = payload.coupon_code
            findCriteria.end_time = {
                $gt: Date.now()
            }
            let resultCoupon = await couponsDb.find(findCriteria)
            if (resultCoupon && Array.isArray(resultCoupon) && resultCoupon.length) {
                discountTypeFixed = resultCoupon[0].coupon_discount_type
                discountValueFIxed = resultCoupon[0].discountValue
                couponDetails = resultCoupon[0]
            }
        }
        if (!(cart_item && Array.isArray(cart_item) && cart_item.length)) {
            throw new Error("Cart is empty");
        }
        if (Object.keys(delivery_address).length < 0) {
            throw new Error("Please Provide an Valid Address");
        }
        let user_type = payload.user_type
        if (user_type === comonRespnses.userType.REGISTERED_USER) {

            //verify token
            let token = req.headers["x-access-token"];
            if (!token) {
                throw new Error("Permission denied")
            }
            let decoded = await jwt.verify(token, comonRespnses.tokenDetails.TOKENSECRET)
            req.userId = decoded._id
            if (req.userId) {
                let findCriteria = {
                    _id: mongoose.Types.ObjectId(req.userId),
                    is_account_activated: 1
                }
                let userFound = await userDb.find(findCriteria)
                if (!(userFound && Array.isArray(userFound) && userFound.length)) {
                    throw new Error("User not found")
                }
            } else {
                throw new Error("Token is invalid")
            }

            //create payment order
            let user_obj_id = req.userId
            let sumPriceToPay = 0;
            let findCriteriaUser = {
                _id: mongoose.Types.ObjectId(user_obj_id),
                is_account_activated: 1
            }
            let userFound = await userDb.find(findCriteriaUser)
            if (!(userFound && Array.isArray(userFound) && userFound.length)) {
                throw new Error("User not found")
            }

            let totalItemsArray = []
            for (let i = 0; i < cart_item.length; i++) {
                let posterFindCriteria = {
                    _id: mongoose.Types.ObjectId(cart_item[i].poster_obj_id),
                    isActive: 1
                }
                let posterFound = await posterDb.find(posterFindCriteria)
                    .populate("category")
                    .populate("subCategory")
                    .limit(1).exec();
                if (!(posterFound && Array.isArray(posterFound) && posterFound.length)) {
                    throw new Error("poster id is wrong or poster Not Found")
                }
                let findMaterialDimesn = {
                    isActive: 1,
                    _id: mongoose.Types.ObjectId(cart_item[i].material_obj_id)
                }
                let materialFind = await materialDimensionDb.find(findMaterialDimesn)
                if (!(materialFind && Array.isArray(materialFind) && materialFind.length)) {
                    throw new Error("poster id is wrong or poster Not Found")
                }


                let materialJsonDetails = materialFind[0]
                let posterJsonDetails = posterFound[0]
                let totalPrice = materialJsonDetails.price * cart_item[i].quantity;


                //catergory based Discount ---------------------------------------------------------------------
                let discountsAvailable = []
                let realPrice = totalPrice
                let category = posterFound[0].category
                let subCat = posterFound[0].subCategory
                if (category && Array.isArray(category) && category.length) {
                    let catPassTHri = posterFound[0].category[0]
                    if (catPassTHri.use_discount) {
                        let pushDis = {
                            discountType: catPassTHri.cat_discount_type,
                            discountValue: catPassTHri.discountValue
                        }
                        discountsAvailable.push(pushDis)
                    }
                }

                if (subCat && Array.isArray(subCat) && subCat.length) {
                    let subCatArrayToMap = posterFound[0].subCategory
                    for (let i = 0; i < subCatArrayToMap.length; i++) {
                        if (subCatArrayToMap[i].use_discount == 1) {
                            let pushDis = {
                                discountType: subCatArrayToMap[i].sub_cat_discount_type,
                                discountValue: subCatArrayToMap[i].discountValue
                            }
                            discountsAvailable.push(pushDis)
                        }
                    }
                }

                if (discountsAvailable && Array.isArray(discountsAvailable) && discountsAvailable.length) {
                    for (let dis = 0; dis < discountsAvailable.length; dis++) {
                        if (discountsAvailable[dis].discountType == comonRespnses.discountType.FLAT) {
                            totalPrice = totalPrice - discountsAvailable[dis].discountValue
                        }
                        if (discountsAvailable[dis].discountType == comonRespnses.discountType.PERCENTAGE) {
                            let totalCostToFindAfterDiscount = 100 - parseInt(discountsAvailable[dis].discountValue)
                            totalPrice = (totalPrice * totalCostToFindAfterDiscount) / 100
                        }
                    }
                }


                //+++++++++++++++++++++++++++++++++++ending of cat based discount_______________________________________

                sumPriceToPay += totalPrice;
                let insertObj = {
                    poster_details: mongoose.Types.ObjectId(cart_item[i].poster_obj_id),
                    materialDimension: mongoose.Types.ObjectId(cart_item[i].material_obj_id),
                    quantity: cart_item[i].quantity,
                    originalPriceBeforeDiscount: realPrice,
                    total: totalPrice
                }
                totalItemsArray.push(insertObj)
            }



            let insertOrderObj = {
                userId: user_obj_id,
                user_type_order: comonRespnses.userType.REGISTERED_USER,
                itemDetails: totalItemsArray,
                sumPriceToPay: sumPriceToPay,
                address: {
                    houseDetails: delivery_address.houseDetails,
                    pincode: delivery_address.pincode,
                    lat: delivery_address.lat,
                    lon: delivery_address.lon,
                    state: delivery_address.state,
                    country: delivery_address.country
                },
                paymentStatus: comonRespnses.paymentStatus.INITIATED,
                orderStatus: comonRespnses.orderStatus.INITIATED
            }

            //discountpart

            if (discountTypeFixed != 6) {
                if (discountTypeFixed == comonRespnses.discountType.FLAT) {
                    sumPriceToPay = sumPriceToPay - parseInt(discountValueFIxed)
                    insertOrderObj.sumPriceToPay = sumPriceToPay
                    insertOrderObj.is_coupon_applied = 1
                    insertOrderObj.couponDetails = {
                        coupon_obj_id: couponDetails._id,
                        coupon_code: couponDetails.coupon_code,
                        couponDiscountType: comonRespnses.discountType.FLAT,
                        coupon_discount_value: discountValueFIxed
                    }
                    insertOrderObj.price_before_discount = sumPriceToPay
                }
                if (discountTypeFixed == comonRespnses.discountType.PERCENTAGE) {
                    let totalCostToFindAfterDiscount = 100 - parseInt(discountValueFIxed)
                    sumPriceToPay = (sumPriceToPay * totalCostToFindAfterDiscount) / 100
                    sumPriceToPay = parseInt(sumPriceToPay)
                    insertOrderObj.sumPriceToPay = sumPriceToPay
                    insertOrderObj.is_coupon_applied = 1
                    insertOrderObj.couponDetails = {
                        coupon_obj_id: couponDetails._id,
                        coupon_code: couponDetails.coupon_code,
                        couponDiscountType: comonRespnses.discountType.FLAT,
                        coupon_discount_value: discountValueFIxed
                    }
                    insertOrderObj.price_before_discount = sumPriceToPay
                }
            }
            const options = {
                amount: sumPriceToPay * 100,
                currency: "INR",
                receipt: "ehs_prints" + shortid.generate(),
                payment_capture: 1,
            };
            const response = await razorpay.orders.create(options);
            insertOrderObj.orderId = response.id
            await new ordersDb(insertOrderObj).save()

            let responseObj = {
                email: userFound[0].emailid || "",
                phoneNumber: userFound[0].phonenumber || "",
                userName: userFound[0].name || "",
                order_id: response.id,
                amount: sumPriceToPay * 100,
                currency: 'INR',
                receipt: options.receipt,
                address: delivery_address
            }
            comonRespnses.actionCompleteResponse(res, responseObj)
            return;
        } else if (user_type === comonRespnses.userType.NEW_USER) {
            let sumPriceToPay = 0;
            if (!(payload.phonenumber || payload.email)) {
                throw new Error("Cannt create with any details")
            }

            let totalItemsArray = []
            for (let i = 0; i < cart_item.length; i++) {
                let posterFindCriteria = {
                    _id: mongoose.Types.ObjectId(cart_item[i].poster_obj_id),
                    isActive: 1
                }
                let posterFound = await posterDb.find(posterFindCriteria).limit(1).exec();
                if (!(posterFound && Array.isArray(posterFound) && posterFound.length)) {
                    throw new Error("poster id is wrong or poster Not Found")
                }
                let findMaterialDimesn = {
                    isActive: 1,
                    _id: mongoose.Types.ObjectId(cart_item[i].material_obj_id)
                }
                let materialFind = await materialDimensionDb.find(findMaterialDimesn)
                if (!(materialFind && Array.isArray(materialFind) && materialFind.length)) {
                    throw new Error("poster id is wrong or poster Not Found")
                }
                let materialJsonDetails = materialFind[0]
                let posterJsonDetails = posterFound[0]
                let totalPrice = materialJsonDetails.price * cart_item[i].quantity;

                //catergory based Discount ---------------------------------------------------------------------
                let discountsAvailable = []
                let realPrice = totalPrice
                let category = posterFound[0].category
                let subCat = posterFound[0].subCategory
                if (category && Array.isArray(category) && category.length) {
                    let catPassTHri = result[0].category[0]
                    if (catPassTHri.use_discount) {
                        let pushDis = {
                            discountType: catPassTHri.cat_discount_type,
                            discountValue: catPassTHri.discountValue
                        }
                        discountsAvailable.push(pushDis)
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
                    }
                }

                if (discountsAvailable && Array.isArray(discountsAvailable) && discountsAvailable.length) {
                    for (let dis = 0; dis < discountsAvailable.length; dis++) {
                        if (discountsAvailable[dis].discountType == comonRespnses.discountType.FLAT) {
                            totalPrice = totalPrice - discountsAvailable[dis].discountValue
                        }
                        if (discountsAvailable[dis].discountType == comonRespnses.discountType.PERCENTAGE) {
                            let totalCostToFindAfterDiscount = 100 - parseInt(discountsAvailable[dis].discountValue)
                            totalPrice = (totalPrice * totalCostToFindAfterDiscount) / 100
                        }
                    }
                }


                //+++++++++++++++++++++++++++++++++++ending of cat based discount_______________________________________

                sumPriceToPay += totalPrice;
                let insertObj = {
                    poster_details: mongoose.Types.ObjectId(cart_item[i].poster_obj_id),
                    materialDimension: mongoose.Types.ObjectId(cart_item[i].material_obj_id),
                    quantity: cart_item[i].quantity,
                    originalPriceBeforeDiscount: realPrice,
                    total: totalPrice
                }
                totalItemsArray.push(insertObj)
            }
            let insertOrderObj = {
                user_type_order: comonRespnses.userType.NEW_USER,
                itemDetails: totalItemsArray,
                sumPriceToPay: sumPriceToPay,
                address: {
                    houseDetails: delivery_address.houseDetails,
                    pincode: delivery_address.pincode,
                    lat: delivery_address.lat,
                    lon: delivery_address.lon,
                    state: delivery_address.state,
                    country: delivery_address.country
                },
                paymentStatus: comonRespnses.paymentStatus.INITIATED,
                orderStatus: comonRespnses.orderStatus.INITIATED
            }
            payload.phonenumber ? insertOrderObj.phonenumber = payload.phonenumber : ""
            payload.email ? insertOrderObj.emailid = payload.email : ""
            payload.name ? insertOrderObj.Name = payload.name : ""
                //discountpart

            if (discountTypeFixed != 6) {
                if (discountTypeFixed == comonRespnses.discountType.FLAT) {
                    sumPriceToPay = sumPriceToPay - parseInt(discountValueFIxed)
                    insertOrderObj.sumPriceToPay = sumPriceToPay
                    insertOrderObj.is_coupon_applied = 1
                    insertOrderObj.couponDetails = {
                        coupon_obj_id: couponDetails._id,
                        coupon_code: couponDetails.coupon_code,
                        couponDiscountType: comonRespnses.discountType.FLAT,
                        coupon_discount_value: discountValueFIxed
                    }
                    insertOrderObj.price_before_discount = sumPriceToPay
                }
                if (discountTypeFixed == comonRespnses.discountType.PERCENTAGE) {
                    let totalCostToFindAfterDiscount = 100 - parseInt(discountValueFIxed)
                    sumPriceToPay = (sumPriceToPay * totalCostToFindAfterDiscount) / 100
                    sumPriceToPay = parseInt(sumPriceToPay)
                    insertOrderObj.sumPriceToPay = sumPriceToPay
                    insertOrderObj.is_coupon_applied = 1
                    insertOrderObj.couponDetails = {
                        coupon_obj_id: couponDetails._id,
                        coupon_code: couponDetails.coupon_code,
                        couponDiscountType: comonRespnses.discountType.FLAT,
                        coupon_discount_value: discountValueFIxed
                    }
                    insertOrderObj.price_before_discount = sumPriceToPay
                }
            }

            const options = {
                amount: sumPriceToPay * 100,
                currency: "INR",
                receipt: "ehs_prints" + shortid.generate(),
                payment_capture: 1,
            };
            const response = await razorpay.orders.create(options);
            insertOrderObj.orderId = response.id
            await new ordersDb(insertOrderObj).save()

            let responseObj = {
                email: insertOrderObj.emailid || "",
                phoneNumber: insertOrderObj.phonenumber || "",
                userName: insertOrderObj.Name || "",
                order_id: response.id,
                amount: sumPriceToPay * 100,
                currency: 'INR',
                receipt: options.receipt,
                address: delivery_address
            }
            comonRespnses.actionCompleteResponse(res, responseObj)
            return;
        } else {
            throw new Error("Please mention User Type")
        }
    } catch (err) {
        console.log(err);
        return comonRespnses.sendActionFailedResponse(res, null, err.message)

    }
}

exports.onSuccessPaymentNew = async(req, res, next) => {
    try {
        let payload = req.body
        let razorpay_payment_id = payload.razorpay_payment_id
        let razorpay_order_id = payload.razorpay_order_id
        let razorpay_signature = payload.razorpay_signature
        const shasum = crypto.createHmac('sha256', comonRespnses.razorPayKey.key_secret);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');
        if (digest == razorpay_signature) {
            console.log("payment is successfully")
            let findCriteria = {
                orderId: razorpay_order_id
            }
            let updateCriteria = {
                paymentStatus: comonRespnses.paymentStatus.SUCCESSFUL
            }
            let userOrderFound = await ordersDb.find(findCriteria)
            if (!(userOrderFound && Array.isArray(userOrderFound) && userOrderFound.length)) {
                throw new Error("Order Id not Found: ")
            }

            let updatedOrderStatus = await ordersDb.findOneAndUpdate(findCriteria, updateCriteria, { new: true })
            console.log(updatedOrderStatus)
            if (updatedOrderStatus.user_type_order == comonRespnses.userType.REGISTERED_USER) {
                let findCriteriaUser = {
                    _id: mongoose.Types.ObjectId(updatedOrderStatus.userId),
                    is_account_activated: 1
                }
                let updarteNewUser = {
                    cart: []
                }
                let userFound = await userDb.findOneAndUpdate(findCriteriaUser, updarteNewUser, { new: true })
                if (userFound.phonenumber) {
                    let successResponse = await client.messages.create({
                        body: `<p>Your Order is </p> <h3>SuccessFully Placed</h3> Visit your dashboard for tracking`,
                        from: '+14076342637',
                        to: userFound.phonenumber
                    })

                }
                if (userFound.emailid) {
                    let mailOptions = {
                        from: "hello@ehs.com",
                        to: userFound.emailid,
                        subject: "EHS prints - Order Placement",
                        html: `<p>Your Order is </p> <h3>SuccessFully Placed</h3> Visit your dashboard for tracking`,
                    };
                    let info = await transporter.sendMail(mailOptions);

                }
                let responseObj = {
                    info: "Order SuccessFully Placed",
                    orderDetails: updatedOrderStatus

                }
                return comonRespnses.actionCompleteResponse(res, responseObj)
            } else if (updatedOrderStatus.user_type_order == comonRespnses.userType.NEW_USER) {
                if (updatedOrderStatus.phonenumber) {
                    let successResponse = await client.messages.create({
                        body: `<p>Your Order is </p> <h3>SuccessFully Placed</h3> Visit your dashboard for tracking`,
                        from: '+14076342637',
                        to: updatedOrderStatus.phonenumber
                    })

                }
                if (updatedOrderStatus.emailid) {
                    let mailOptions = {
                        from: "hello@ehs.com",
                        to: updatedOrderStatus.emailid,
                        subject: "EHS prints - Order Placement",
                        html: `<p>Your Order is </p> <h3>SuccessFully Placed</h3> Visit your dashboard for tracking`,
                    };
                    let info = await transporter.sendMail(mailOptions);

                }
                let responseObj = {
                    info: "Order SuccessFully Placed",
                    orderDetails: updatedOrderStatus

                }
                return comonRespnses.actionCompleteResponse(res, responseObj)
            } else {
                throw new Error("Invalid User Type")
            }


        } else {
            throw new Error('Payment Not Valid Please Pay Again')
        }
    } catch (err) {
        console.log(err);
        return comonRespnses.sendActionFailedResponse(res, null, err.message)
    }
}

exports.getOrdersNew = async(req, res, next) => {
    try {
        let user_obj_id = req.userId
        let findCriteria = {
            userId: user_obj_id,
            paymentStatus: comonRespnses.paymentStatus.SUCCESSFUL
        }
        let payload = req.query
        let skip = payload.skip || 0
        let limit = payload.limit || 20
        let userOrderFound = await ordersDb.find(findCriteria)
            .populate('itemDetails.poster_details')
            .populate('itemDetails.materialDimension')
            .skip(skip).limit(limit).sort({ created_at: -1 })
        return comonRespnses.actionCompleteResponse(res, userOrderFound)

    } catch (err) {
        console.log(err);
        return comonRespnses.sendActionFailedResponse(res, null, err.message)
    }
}

exports.getAdminOrders = async(req, res, next) => {
    try {

        let findCriteria = {}
        let payload = req.query
        let skip = payload.skip || 0
        let limit = payload.limit || 20
        payload.paymentStatus ? findCriteria.paymentStatus = payload.paymentStatus : ""
        payload.orderStatus ? findCriteria.orderStatus = payload.orderStatus : ""
        payload.orderId ? findCriteria.orderId = payload.orderId : ""
        let OrderFound = await ordersDb.find(findCriteria)
            .populate('itemDetails.poster_details')
            .populate('itemDetails.materialDimension')
            .skip(skip).limit(limit).sort({ created_at: -1 })
        return comonRespnses.actionCompleteResponse(res, OrderFound)

    } catch (err) {
        console.log(err);
        return comonRespnses.sendActionFailedResponse(res, null, err.message)
    }
}
exports.updateOrderNew = async(req, res, next) => {
    try {
        let findCriteria = {}
        let updateCriteria = {}
        let payload = req.query
        payload.orderId ? findCriteria.orderId = payload.orderId : ""
        payload.orderStatus ? findCriteria.orderStatus = payload.orderStatus : ""
        let OrderFound = await ordersDb.findOneAndUpdate(findCriteria, updateCriteria, { new: true })
        return comonRespnses.actionCompleteResponse(res, OrderFound)
    } catch (err) {
        console.log(err);
        return comonRespnses.sendActionFailedResponse(res, null, err.message)
    }
}