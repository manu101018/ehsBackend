const express = require("express");
const materialControl = require("../controller/materialController");
const storageUrl = require("../helpers/storageImg");
const verifyJwt = require("../middleware/jwt");

const router = express.Router();

router.get("/getMaterial", materialControl.getMaterial);

router.post(
    "/createMaterial",
    materialControl.createMaterial
);

router.post(
    "/updateMaterial",
    materialControl.updateMaterial
);


module.exports = router;