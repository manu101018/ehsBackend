require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const poster = require("./routes/poster");
const material = require("./routes/material");
const category = require("./routes/category");
const subCategory = require("./routes/subCategory");
const auth = require("./routes/auth");
const orders = require("./routes/orders");
const cors = require("cors");
const helmet = require("helmet");
const shortid = require("shortid");
const Razorpay = require("razorpay");
const cookieParser = require("cookie-parser");
const app = express();
const authorController = require("./routes/author")
const couponController = require("./routes/coupon")
const vendorController = require("./routes/venodor")
const configs = require('./common/common')


app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(cors());
app.use(helmet());


app.use("/assets/uploads", express.static(__dirname + "/assets/uploads"));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, *");
    if (req.method === "OPTIONS") {
        res.header(
            "Access-Control-Allow-Methods",
            "GET, PUT, POST, PATCH, DELETE, OPTIONS"
        );
        res.setHeader("Access-Control-Allow-Credentials", true);
        return res.status(200).json({});
    }
    next();
});

app.use("/posters", poster);
app.use("/material", material);
app.use("/category", category);
app.use("/subCategory", subCategory);
app.use("/auth", auth);
app.use("/orders", orders);
app.use("/author", authorController)
app.use("/coupons", couponController)
app.use("/vendor", vendorController)

app.get("/", (req, res) => {
    res.status(200).json({
        message: "hellooo!!!",
        url: `${req.protocol}://${req.get("host")}`,
    });
});

mongoose
    .connect(
        // "mongodb://localhost:27017/ehsdb",
        configs.mongoUrl.NEW, { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => {
        console.log("DB Connected!!!")
        app.listen(process.env.PORT || 8000, () =>
            console.log(`Server started!!!`)
        );
    })
    .catch((err) => {
        console.log(err);
    });
