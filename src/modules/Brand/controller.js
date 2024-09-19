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






const getAllBrandsHandler = asyncHandler(async (req, res) => {
        const allBrands = await brandService.getAllBrands();
        res.status(200).json({
            message: "GetAll Brands Fetched Successfully!",
            brands: allBrands
        });
    }
)










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