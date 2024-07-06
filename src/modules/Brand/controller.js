const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../utility/common');


const brandService = require('./service');

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

const getBrandByIdHandler = asyncHandler(async (req, res) => { 
    const { id } = req.params;
    const brand = await brandService.getBrandById(id);
    res.status(200).json({
        message: "Get Brand by ID Successfully!",
        brand
    });
})

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