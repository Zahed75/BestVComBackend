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
            type: new mongoose.Schema({
                name: { type: String, required: true },
                link: { type: String, required: true },
                icon: { type: String, required: false },
                subMenu: [
                    {
                        type: new mongoose.Schema({
                            name: { type: String, required: true },
                            link: { type: String, required: true },
                            icon: { type: String, required: false },
                        }, { _id: true }), // Generates _id for the third-level sub-menu items
                    }
                ],
            }, { _id: true }) // Generates _id for the second-level sub-menu items
        }
    ]
}, { _id: true }); // Generates _id for the first-level sub-menu items

// Define the main menu schema
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
    subMenu: [SubMenuSchema] // Nested submenu schema
}, { timestamps: true });

const Menu = mongoose.model('Menu', MenuSchema);

module.exports = Menu;
