const express = require("express");
const orders = require("../controller/ordersController");
const router = express.Router();
const verifyJwt = require("../middleware/jwt");

router.get("/getOrdersAdmin", orders.getAdminOrders);

router.get("/getOrderUser", verifyJwt.verifyJwtToken, orders.getOrdersNew);

router.post("/updateOrder", orders.updateOrderNew);

router.post('/create_order', orders.createOrderNew);

router.post('/on_success_payment', orders.onSuccessPaymentNew)

module.exports = router;