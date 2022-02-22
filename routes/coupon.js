const express = require('express');
const couponControll = require('../controller/couponController.js');
const storageUrl = require("../helpers/storageImg");
const router = express.Router();

const verifyJwt = require("../middleware/jwt");

router.get('/getCoupon', couponControll.getCoupon);

router.post('/createCoupon', couponControll.createCoupon);

router.post('/updateCoupon', couponControll.updateCoupon);

router.get('/applyCoupon', couponControll.applyCoupon);

module.exports = router;