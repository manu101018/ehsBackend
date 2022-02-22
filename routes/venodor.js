const express = require('express');
const vendorCon = require('../controller/vendorController');
const storageUrl = require("../helpers/storageImg");
const router = express.Router();

const verifyJwt = require("../middleware/jwt");

router.get('/signup', vendorCon.signup);

router.post('/login', vendorCon.login);

router.get('/get_all_vendors', vendorCon.getAllVendor)


module.exports = router;