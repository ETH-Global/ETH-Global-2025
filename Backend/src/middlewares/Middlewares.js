const jwt = require("jsonwebtoken");
const controllers = require("../controllers/Controllers");
require("dotenv").config();

const unprotectedPaths = ["/"];

function authenticate_token(req, res, next) {
    // if (!(unprotectedPaths.includes(req.path))) {
    //     const authHeader = req.headers['authorization'];
    //     const token = authHeader && authHeader.split(' ')[1];
    //     if (token){
    //         try {
    //             const payload = jwt.verify(token, process.env.SECRET_KEY);
    //             req.user = payload.data;

    //         } catch (err) {
    //             return res.status(403)  // Invalid JWT token
    //         }
    //     }
    //     else {
    //         req.user = undefined;
    //     }
    // }

    next();
}

// verifies the jwt payload
// [TODO] fixxxxxxxxxx
function authorize_user(req, res, next) {
    // if (!(unprotectedPaths.includes(req.path))) {
    //     if (req.body && req. && req.user.email && req.user.name) {
    //         next();
    //     }
    //     else {
    //         res.clearCookie("token");
    //         res.user = undefined;
    //         return res.status(400);  // User not authenticated, Can't access route!
    //     }
    // } else {
    //     next();
    // }

    // [TODO]: remove
    next();
}

module.exports = {
    authenticate_token,
    authorize_user,
};
