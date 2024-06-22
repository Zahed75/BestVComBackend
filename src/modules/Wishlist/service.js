const wishlistModel = require("./model");
const customerModel = require("../Customer/model");
const productModel = require("../Products/model");  // Importing the product model

const {
    NoContent,
    BadRequest,
    Unauthorized,
    Forbidden,
} = require("../../utility/errors");


const addWishlist = async (wishlistData) => {
    try {
        const { customerId, productId } = wishlistData;

        // Validate input
        if (!customerId || !productId) {
            throw new BadRequest('Customer Id or Product Id not found');
        }

        // Check if customer exists
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            throw new BadRequest('Customer not found');
        }

        // Check if the product ID is valid
        const product = await productModel.findById(productId).select('_id');
        if (!product) {
            throw new BadRequest('Invalid product id');
        }

        // Find or create wishlist for the customer
        let wishlist = await wishlistModel.findOne({ customerId });
        if (!wishlist) {
            wishlist = new wishlistModel({ customerId, products: [] });
        }

        // Check if the product is already in the wishlist
        if (wishlist.products.includes(productId)) {
            throw new BadRequest('Product already in wishlist');
        }

        // Add product to the wishlist
        wishlist.products.push(productId);

        // Save the wishlist
        const updatedWishlist = await wishlist.save();
        if (!updatedWishlist) {
            throw new BadRequest('Could not update wishlist');
        }

        return updatedWishlist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update wishlist: " + error.message);
    }
};
const getWishlistByCustomerId = async (customerId) => {
    try {

        // Find wishlist by customer ID
        const wishlist = await wishlistModel.findOne().populate('products');
        if (!wishlist) {
            throw new BadRequest('Wishlist not found');
        }

        return wishlist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve wishlist: " + error.message);
    }
};

const removeWishlistItem = async (customerId, productId) => {
    try {
        // Validate input
        if (!customerId || !productId) {
            throw new BadRequest('Customer Id or Product Id not provided');
        }

        // Find wishlist by customer ID
        const wishlist = await wishlistModel.findOne({ customerId });
        if (!wishlist) {
            throw new BadRequest('Wishlist not found');
        }

        // Remove the product from the wishlist
        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);

        // Save the updated wishlist
        const updatedWishlist = await wishlist.save();
        if (!updatedWishlist) {
            throw new BadRequest('Could not update wishlist');
        }

        return updatedWishlist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to remove item from wishlist: " + error.message);
    }
};

const removeWishlistByCustomerId = async (customerId) => {
    try {
        // Validate input
        if (!customerId) {
            throw new BadRequest('Customer Id not provided');
        }

        // Delete wishlist by customer ID
        const deletedWishlist = await wishlistModel.findOneAndDelete({ customerId });
        if (!deletedWishlist) {
            throw new BadRequest('Wishlist not found');
        }

        return deletedWishlist;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to remove wishlist: " + error.message);
    }
};



module.exports = {
    addWishlist,
    getWishlistByCustomerId,
    removeWishlistItem,
    removeWishlistByCustomerId,
};






