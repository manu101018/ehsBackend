const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'laurence95@ethereal.email',
        pass: 'vkEq1fGvGzWZYvhAEb'
    }
});

module.exports = transporter;