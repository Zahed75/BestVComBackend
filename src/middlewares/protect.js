const jwt = require('jsonwebtoken');
const User = require('../modules/User/model');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the user from the token to req.user
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed',
            });
        }
    } else {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token',
        });
    }
};

module.exports = { protect };
