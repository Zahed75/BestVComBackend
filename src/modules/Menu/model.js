const mongoose = require('mongoose');

// Define the submenu schema
const SubMenuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: false, // Icon is optional
    },
    subMenu: [
        {
            type: mongoose.Schema.Types.Mixed, // Mixed to allow further nesting
        }
    ]
});

const MenuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: false, // Icon is optional
    },
    subMenu: [SubMenuSchema] // Embedding the SubMenuSchema for nested submenus
});

// Create the Menu model
const Menu = mongoose.model('Menu', MenuSchema);

module.exports = Menu;
