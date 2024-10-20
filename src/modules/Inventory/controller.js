const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const {asyncHandler} = require('../../utility/common');
const InventoryService = require('../Inventory/service');
const {HEAD_OFFICE, BRANCH_ADMIN, ADMIN, CUSTOMER} = require('../../config/constants');




const addInventoryHandler = asyncHandler(async (req, res) => {
    const {outletId, productId, quantity} = req.body;

    // Check for missing fields
    if (!outletId || !productId || !quantity) {
        return res.status(400).json({message: 'outletId, productId, and quantity are required.'});
    }

    // Call the service function to add the product to the inventory
    const inventory = await InventoryService.addProductToInventory(outletId, productId, quantity);

    // Send the updated inventory as a response
    return res.status(200).json({message: 'Product added to inventory successfully', inventory});

})



const updateInventoryQuantityHandler = asyncHandler(async (req, res) => {
    const { outletId, productId, newQuantity } = req.body;

    // Check for missing fields
    if (!outletId || !productId || newQuantity == null) {
        return res.status(400).json({ message: 'outletId, productId, and newQuantity are required.' });
    }

    // Call the service function to update the product quantity in the inventory
    const inventory = await InventoryService.updateInventoryProductQuantity(outletId, productId, newQuantity);

    // Send the updated inventory as a response
    return res.status(200).json({ message: 'Inventory quantity updated successfully', inventory });
});


const deleteInventoryProductHandler = asyncHandler(async (req, res) => {
    const { outletId, productId } = req.body;

    // Check for missing fields
    if (!outletId || !productId) {
        return res.status(400).json({ message: 'outletId and productId are required.' });
    }

    // Call the service function to delete the product from the inventory
    const inventory = await InventoryService.deleteInventoryProductById(outletId, productId);

    // Send the updated inventory as a response
    return res.status(200).json({ message: 'Product removed from inventory successfully', inventory });
});



const getAllProductsByOutletIdHandler = asyncHandler(async (req, res) => {
    const { outletId } = req.params;

    // Check if outletId is provided
    if (!outletId) {
        return res.status(400).json({ message: 'outletId is required.' });
    }

    // Call the service function to get all products by outletId
    const inventory = await InventoryService.getAllProductsByOutletId(outletId);

    // Send the inventory as a response
    return res.status(200).json({ message: 'Inventory fetched successfully', inventory });
});




router.post('/add-Inventory', addInventoryHandler);
router.put('/update-inventory', updateInventoryQuantityHandler);
router.delete('/delete-inventory-product', deleteInventoryProductHandler);
router.get('/all-products-inventory/:outletId', getAllProductsByOutletIdHandler);
module.exports = router;
