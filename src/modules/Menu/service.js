const MenuModel = require("../Menu/model");
const { BadRequest } = require("../../utility/errors");





const createMenu = async (menuData) => {
    try {
        const newMenu = await MenuModel.create(menuData); // Create the menu
        return newMenu; // Return the created menu
    } catch (error) {
        throw new Error('Error creating menu: ' + error.message); // Handle errors
    }
};



const updateMenuById = async (menuId, menuData) => {
    try {
        const updatedMenu = await MenuModel.findByIdAndUpdate(menuId, menuData, { new: true, runValidators: true }); // Find and update menu
        if (!updatedMenu) {
            throw new Error('Menu not found');
        }
        return updatedMenu;
    } catch (error) {
        throw new Error('Error updating menu: ' + error.message);
    }
};



const deleteMenuById = async (menuId) => {
    try {
        const deletedMenu = await MenuModel.findByIdAndDelete(menuId); // Find and delete menu by ID
        if (!deletedMenu) {
            throw new Error('Menu not found');
        }
        return deletedMenu;
    } catch (error) {
        throw new Error('Error deleting menu: ' + error.message);
    }
};


const getAllMenus = async () => {
    try {
        const menus = await MenuModel.find(); // Fetch all menus from the database
        return menus;
    } catch (error) {
        throw new Error('Error fetching menus: ' + error.message);
    }
};



module.exports = {
    createMenu,
    updateMenuById,
    deleteMenuById,
    getAllMenus
};