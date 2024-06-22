const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../utility/common');
const wishlistService = require('./service');

const addWishlistHandler = asyncHandler(async (req, res) => {
    const { customerId, productId } = req.body;
    const wishlist = await wishlistService.addWishlist({ customerId, productId });
    res.status(200).json({
        message: "Wishlist updated successfully",
        wishlist
    });
});
const getWishlistByCustomerIdHandler = asyncHandler(async (req, res) => {
    
    const wishlist = await wishlistService.getWishlistByCustomerId();
    res.status(200).json({
        message: "Wishlist retrieved successfully",
        wishlist
    });
});
const removeWishlistItemHandler = asyncHandler(async (req, res) => {
    const { customerId, productId } = req.body;
    const wishlist = await wishlistService.removeWishlistItem(customerId, productId);
    res.status(200).json({
        message: "Wishlist item removed successfully",
        wishlist
    });
});
const removeWishlistByCustomerIdHandler = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const wishlist = await wishlistService.removeWishlistByCustomerId(customerId);
    res.status(200).json({
        message: "Wishlist removed successfully",
        wishlist
    });
});


router.post('/addWishList', addWishlistHandler);
router.get('/getWishlist', getWishlistByCustomerIdHandler);
router.delete('/removeItem', removeWishlistItemHandler);
router.delete('/deleteWishlist/:customerId', removeWishlistByCustomerIdHandler);

module.exports = router;