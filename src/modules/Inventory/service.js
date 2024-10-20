const InventoryModel = require('../Inventory/model');
const { BadRequest } = require('../../utility/errors');
const ProductModel = require('../Products/model');
const OutletModel = require('../Outlet/model');





// Function to add product to inventory for a specific outlet
const addProductToInventory = async (outletId, productId, quantity) => {
    try {
        // Check if the product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        // Check if inventory exists for the outlet
        let inventory = await InventoryModel.findOne({ outletId });

        if (!inventory) {
            // Create a new inventory record if it doesn't exist for the outlet
            inventory = new InventoryModel({
                outletId,
                quantity: 0,
                products: []
            });
        }

        // Find if the product is already in the inventory
        const existingProductIndex = inventory.products.findIndex(p => p._id.toString() === productId);

        if (existingProductIndex !== -1) {
            // If product exists, replace its quantity with the new one
            inventory.products[existingProductIndex].quantity = quantity;
        } else {
            // Add new product to the inventory
            inventory.products.push({ _id: productId, quantity });
        }

        // Update total quantity for the inventory
        inventory.quantity = inventory.products.reduce((acc, item) => acc + item.quantity, 0);

        // Save the inventory
        await inventory.save();

        return inventory;
    } catch (error) {
        throw new Error(error.message);
    }
}




const updateInventoryProductQuantity = async (outletId, productId, newQuantity) => {
    try {
        // Check if inventory exists for the outlet
        const inventory = await InventoryModel.findOne({ outletId });
        if (!inventory) {
            throw new Error('Inventory not found for this outlet');
        }

        // Find if the product is in the inventory
        const existingProductIndex = inventory.products.findIndex(p => p._id.toString() === productId);

        if (existingProductIndex === -1) {
            throw new Error('Product not found in the inventory');
        }

        // Update the quantity of the product
        inventory.products[existingProductIndex].quantity = newQuantity;

        // Update total quantity for the inventory
        inventory.quantity = inventory.products.reduce((acc, item) => acc + item.quantity, 0);

        // Save the updated inventory
        await inventory.save();

        return inventory;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Function to delete a product from inventory by productId for a specific outlet
const deleteInventoryProductById = async (outletId, productId) => {
    try {
        // Check if inventory exists for the outlet
        const inventory = await InventoryModel.findOne({ outletId });
        if (!inventory) {
            throw new Error('Inventory not found for this outlet');
        }

        // Find if the product is in the inventory
        const productIndex = inventory.products.findIndex(p => p._id.toString() === productId);
        if (productIndex === -1) {
            throw new Error('Product not found in the inventory');
        }

        // Remove the product from the inventory
        inventory.products.splice(productIndex, 1);

        // Update total quantity for the inventory
        inventory.quantity = inventory.products.reduce((acc, item) => acc + item.quantity, 0);

        // Save the updated inventory
        await inventory.save();

        return inventory;
    } catch (error) {
        throw new Error(error.message);
    }
};










const getAllProductsByOutletId = async (outletId) => {
    try {
        // Find the inventory for the given outlet and populate products
        const inventory = await InventoryModel.findOne({ outletId })
            .populate({
                path: 'products._id',
                select: '-__v', // Exclude unnecessary fields like '__v'
            });

        if (!inventory) {
            throw new Error('No inventory found for this outlet');
        }

        // Format the products array to exclude the '_id'
        const formattedProducts = inventory.products.map(product => {
            return {
                seo: product._id.seo,
                general: product._id.general,
                inventory: product._id.inventory,
                shipping: product._id.shipping,
                categoryId: product._id.categoryId,
                productBrand: product._id.productBrand,
                productName: product._id.productName,
                productSlug: product._id.productSlug,
                productCode: product._id.productCode,
                productImage: product._id.productImage,
                productGallery: product._id.productGallery,
                productVideos: product._id.productVideos,
                productStatus: product._id.productStatus,
                productSpecification: product._id.productSpecification,
                productShortDescription: product._id.productShortDescription,
                createdAt: product._id.createdAt,
                updatedAt: product._id.updatedAt,
                quantity: product.quantity // Include the quantity from the products array
            };
        });

        // Return inventory with formatted products
        return {
            _id: inventory._id,
            outletId: inventory.outletId,
            quantity: inventory.quantity,
            products: formattedProducts
        };
    } catch (error) {
        throw new Error(error.message);
    }
};





module.exports = {
    addProductToInventory,
    updateInventoryProductQuantity,
    deleteInventoryProductById,
    getAllProductsByOutletId
}