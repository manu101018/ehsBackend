const express = require('express');
const subCategoryControl = require('../controller/subcategoryController');
const storageUrl = require("../helpers/storageImg");
const verifyJwt = require("../middleware/jwt");

const router = express.Router();

router.get('/getSubCategory', subCategoryControl.getSubCategory);

router.post('/createSubCategory', subCategoryControl.createSubCategory);

router.post('/updateSubCategory', subCategoryControl.updateSubCategory);


module.exports = router;