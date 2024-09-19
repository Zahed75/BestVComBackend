const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../utility/common');
const brandService = require('./service');
const Brand = require('../Brand/model')
const Product = require('../Products/model');



// create Brand
const createBrandHandler = asyncHandler(async (req, res) => {
    const brand = await brandService.addBrand(req.body);
    res.status(200).json({
        message: "Brand added successfully",
        brand
    });
});




const getAllBrandsHandler = async (req, res) => {
    try {
        // Find all brands
        const brands = await Brand.find({});

        // Use Promise.all to count products for each brand asynchronously
        const brandData = await Promise.all(
            brands.map(async (brand) => {
                // Count the products associated with each brand
                const productCount = await Product.countDocuments({
                    productBrand: brand._id,
                    productStatus: 'Published'  // Count only published products
                });

                // Return the brand along with the product count
                return {
                    brand,
                    productCount
                };
            })
        );

        // Return the result
        return res.status(200).json({
            success: true,
            data: brandData
        });
    } catch (error) {
        console.error('Error in getAllBrandsWithProductCount controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};







const getBrandByIdHandler = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Brand ID is required' });
        }

        // Fetch brand from database
        const brand = await Brand.findById(id);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Fetch all products associated with this brand
        const products = await Product.find({ productBrand: id });

        // Prepare the response
        return res.status(200).json({
            success: true,
            data: {
                brand,
                products,
                productCount: products.length  // Count the number of products
            }
        });
    } catch (error) {
        console.error('Error in getBrandById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};





const updateBrandHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateBrand = await brandService.updateBrandById(id, req.body); 
    res.status(200).json({
        message: "Update Brand Successfully",
        updateBrand
    })
})


router.post('/create', createBrandHandler);
router.get('/getAll', getAllBrandsHandler);
router.get('/getBrandId/:id', getBrandByIdHandler);
router.put('/update/:id', updateBrandHandler);
module.exports = router;