



let responseMessages = {
    PARAMETER_MISSING: "Insufficient information was supplied. Please check and try again.",
    ACTION_COMPLETE: "Successful",
    BAD_REQUEST: "Invalid Request",
    AUTHENTICATION_FAILED: "Authentication failed",
    ACTION_FAILED: "Something went wrong.Please try again",
    INCORRECT_PASSWORD: "Incorrect Password"

};

exports.mongoUrl = {
    OLD: "mongodb+srv://balu:mongopassword@cluster0.6ujrr.mongodb.net/example?retryWrites=true&w=majority",
    NEW: "mongodb+srv://ehs-admin:MDCyOxZz7WkyWK53@lab-1.xjs8i.mongodb.net/ehs-prints?retryWrites=true&w=majority"
}

exports.discountType = {
    FLAT: 1,
    PERCENTAGE: 2
}

exports.vendor_status = {
    ACCEPTED: 1,
    NOT_ACCEPTED: 2
}

exports.paymentStatus = {
    NOUSE: 0,
    INITIATED: 1,
    FAILED: 2,
    SUCCESSFUL: 3,
}

exports.orderStatus = {
    INITIATED: 1,
    TRANSIT: 2,
    OUT_OF_DELIVERY: 3,
    DELIVERED: 4,
}

exports.razorPayKey = {
    key_id: "rzp_test_ci9tXZyyHXxDTT",
    key_secret: "s1xu1IQ45jPtUBch6wbSkoQL"
}

exports.userType = {
    REGISTERED_USER: 1,
    NEW_USER: 2
}

exports.operationTypeInserUpda = {
    INSERT: 1,
    UPDATE: 2,
}

let responseFlags = {
    PARAMETER_MISSING: 100,
    ACTION_COMPLETE: 200,
    BAD_REQUEST: 400,
    AUTHENTICATION_FAILED: 401,
    ACTION_FAILED: 410,
    PERMISSION_NOT_ALLOWED: 403

};

exports.languagesPoster = {
    ENGLISH: 1,
    HINDI: 2,
    BILINGUAL: 3
}


exports.tokenDetails = {
    TOKENSECRET: "EHSPRINTSHELLO"

}

exports.getOtpCreation = function() {
    var otp = Math.floor(100000 + Math.random() * 900000);
    const ttl = 5 * 60 * 1000;
    const expires = Date.now() + ttl;
    return {
        otp: otp,
        expires_in: expires
    }
}

exports.autoCreateSlug = function(text) {
    text = "" + text // toString
    text = text.replace(/[^a-zA-Z ]/g, ""); // replace all special char 
    text = text.replace(/\s\s+/g, ' ');

    text = text.trim() //trim text
    text = text.replace(/ /g, "-"); // replace all special char 
    text = text.toLowerCase();
    if (!text) {
        text = 'slg-' + Math.floor(Math.random() * (999 - 100 + 1) + 100);
    }
    return text;
}

exports.autoCreateSlugPosters = function(text , count) {
    text = "" + text // toString
    text = text.replace(/[^a-zA-Z ]/g, ""); // replace all special char 
    text = text.replace(/\s\s+/g, ' ');

    text = text.trim() //trim text
    text = text.replace(/ /g, "-"); // replace all special char 
    text = text.toLowerCase();
    if (!text) {
        text = 'slg-' + Math.floor(Math.random() * (999 - 100 + 1) + 100);
    }
    return text + count;
}

exports.operationType = {
    PUSH: 1,
    PULL: 2,
    REPLACE: 3
}

exports.actionCompleteResponse = function(res, data, msg) {
    var response = {
        success: 1,
        message: msg || responseMessages.ACTION_COMPLETE,
        status: responseFlags.ACTION_COMPLETE,
        data: data || {}
    };
    res.status(responseFlags.ACTION_COMPLETE).send(JSON.stringify(response));
}

exports.authenticationFailed = function(res, msg, data) {
    var response = {
        success: 0,
        message: msg || 'Authentication Failed',
        status: responseFlags.AUTHENTICATION_FAILED,
        data: data || {}
    }
    res.status(responseFlags.AUTHENTICATION_FAILED).send(response);
}


exports.sendActionFailedResponse = function(res, data, msg) {
    var response = {
        success: 0,
        message: msg || responseMessages.ACTION_FAILED,
        status: responseFlags.ACTION_FAILED,
        data: data || {}
    }

    return res.status(responseFlags.ACTION_FAILED).send(response);
};