const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utility/common');
const productGridService = require('./service');
const { HEAD_OFFICE, BRANCH_ADMIN } = require('../../config/constants');






const createProductGrid = asyncHandler(async (req, res) => {
  try {
    const gridData = req.body;
    const createdGrid = await productGridService.createProductGrid(gridData);

    res.status(201).json({
      message: 'Product grid created successfully',
      grid: createdGrid
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create product grid',
      error: error.message
    });
  }
});



  const getProductGridById = asyncHandler(async (req, res) => {
    try {
      const { gridId } = req.params;
      const grid = await productGridService.getProductGridById(gridId);
  
      res.status(200).json({
        message: 'Product grid retrieved successfully',
        grid: grid
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to retrieve product grid',
        error: error.message
      });
    }
  });
  


  
  

const getAllProductGrids = asyncHandler(async (req, res) => {
  try {
    const grids = await productGridService.getAllProductGrids();

    res.status(200).json({
      message: 'Product grids retrieved successfully',
      grids: grids.map(grid => ({
        ...grid.toObject(),
        selectProducts: grid.selectProducts.map(product => ({
          seo: {
            productTitle: product.seo?.productTitle || '',
            prodDescription: product.seo?.prodDescription || '',
            productTags: product.seo?.productTags || [],
            productNotes: product.seo?.productNotes || ''
          },
          general: product.general || {},
          inventory: product.inventory || {},
          shipping: product.shipping || {},
          _id: product._id,
          categoryId: product.categoryId.map(cat => cat._id),
          productName: product.productName,
          productSlug: product.productSlug,
          productBrand: product.productBrand,
          productCode: product.productCode,
          productImage: product.productImage,
          productGallery: product.productGallery,
          productVideos: product.productVideos,
          productStatus: product.productStatus,
          productSpecification: product.productSpecification || [],
          productShortDescription: product.productShortDescription,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }))
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve product grids',
      error: error.message
    });
  }
});

  



  const updateProductGridById = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
  
      const updatedGrid = await productGridService.updateProductGridById(id, updateData);
  
      res.status(200).json({
        message: 'Product grid updated successfully',
        grid: updatedGrid
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update product grid',
        error: error.message
      });
    }
  });


  
  







  const deleteProductGridById = asyncHandler(async (req, res) => {
 
      const { id } = req.params;
  
      const deletedGrid = await productGridService.deleteProductGridById(id);
  
      res.status(200).json({
        message: 'Product grid deleted successfully',
        grid: deletedGrid
      });
  
  });





router.patch('/productGrids/:id',updateProductGridById);

router.post('/createGrid', createProductGrid);
router.get('/productGrid/:gridId',getProductGridById);
router.get('/allProductGrids',getAllProductGrids);
router.delete('/deleteGrids/:id',deleteProductGridById);


module.exports = router;