const InventoryModel = require('../Inventory/model');
const { BadRequest } = require('../../utility/errors');
const ProductModel = require('../Products/model');






// Function to add product to inventory for a specific outlet
const addProductToInventory = async (outletId, productId, quantity)=>{
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
            // If product exists, update its quantity
            inventory.products[existingProductIndex].quantity += quantity;
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






module.exports = {
    addProductToInventory,
    updateInventoryProductQuantity,
    deleteInventoryProductById
}