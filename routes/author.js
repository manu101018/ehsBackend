const express = require('express');
const authControll = require('../controller/authorController');
const storageUrl = require("../helpers/storageImg");
const router = express.Router();

const verifyJwt = require("../middleware/jwt");

router.get('/getAuthor', authControll.getAuthor);

router.post('/createAuthor', authControll.createAuthor);

router.post('/updateAuthor', authControll.updateAuthor);

module.exports = router;