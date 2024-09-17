const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utility/common');
const menuService = require('./service');






const createMenu = async (req, res) => {
    const menuData = req.body; // Get data from request body

    try {
        const newMenu = await menuService.createMenu(menuData); // Call service to create menu
        res.status(201).json({
            success: true,
            message: 'Menu created successfully',
            data: newMenu,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



const updateMenu = async (req, res) => {
    const menuId = req.params.id; // Extract the menu ID from the URL
    const menuData = req.body; // Get updated data from request body

    try {
        const updatedMenu = await menuService.updateMenuById(menuId, menuData); // Call service to update menu
        res.status(200).json({
            success: true,
            message: 'Menu updated successfully',
            data: updatedMenu,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



const deleteMenu = async (req, res) => {
    const menuId = req.params.id; // Extract menu ID from URL

    try {
        const deletedMenu = await menuService.deleteMenuById(menuId); // Call service to delete menu
        res.status(200).json({
            success: true,
            message: 'Menu deleted successfully',
            data: deletedMenu, // Optionally return the deleted menu details
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const getAllMenus = async (req, res) => {
    try {
        const menus = await menuService.getAllMenus(); // Call the service to fetch all menus
        res.status(200).json({
            success: true,
            message: 'Menus retrieved successfully',
            data: menus,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



router.post('/createMenu', createMenu);
router.put('/updateMenu/:id',updateMenu);
router.delete('/deleteMenu/:id',deleteMenu);
router.get('/getAllMenus',getAllMenus);
module.exports = router;