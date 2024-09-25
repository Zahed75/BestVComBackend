const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utility/common');
const productService = require('./service');
const { HEAD_OFFICE, BRANCH_ADMIN,ADMIN,CUSTOMER } = require('../../config/constants');





// addProducts

const addProductHandler = asyncHandler(async (req, res) => {
    const product = await productService.addProduct(req.body);
    res.status(200).json({
        message: "Product added successfully!",
        product
    });
});




// editProducts

const updateProductByIdHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const editProducts = await productService.updateProductById(id, req.body);
    res.status(200).json({
        message: "Product Updated Successfully!",
        editProducts
    });

});


// getAllProducts

const getAllProductsHandler = asyncHandler(async (req, res) => {
    const products = await productService.getAllProducts();
    res.status(200).json({
        message: "Get AllProducts Fetched Successfully!",
        products
    })
})




const deleteProductHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleteProduct = await productService.deleteProductById(id, req.body);
    res.status(200).json({
        message: "Delete Category Successfully!",
        deleteProduct
    })
})





const getProductByIdHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { success, data, error } = await productService.getProductByIdService(id);
    if (success) {
        res.status(200).json({ message: "Product found success", data: data })
    }
    else {
        res.status(500).json({ message: "fetchin product error", error: error })
    }
})





const getProductByCategoryIdHandler = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const products = await productService.getProductByCategoryId(categoryId);
    if (products.length === 0) {
        return res.status(404).json({
            message: "No products found for the specified category ID",
        });
    }

    res.status(200).json({
        message: "Get All Products Fetched Successfully!",
        products
    });
});



const getProductByproductStatusHandler = asyncHandler(async (req, res) => {
    const products = await productService.getProductByproductStatus();
    if (products.length === 0) {
      return res.status(404).json({
        message: "No products found for the specified product status",
      });
    }
  
    res.status(200).json({
      message: "Products retrieved successfully!",
      products
    });
  });
  





const getProductBySlugHandler = asyncHandler(async (req, res) => {
    const { productSlug } = req.params;
    const product = await productService.getProductBySlug(productSlug);

    if (!product) {
        return res.status(404).json({
            message: "No products found for the specified slug",
        });
    }

    res.status(200).json({
        message: "Success",
        product
    });
});




const updateProductSpecificationHandler = asyncHandler(async (req, res) => {
  const { productId, specId } = req.params;
  const { key, value } = req.body;

  try {
    const updatedProduct = await productService.updateProductSpecification(
      productId, 
      specId, 
      { key, value }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product or specification not found' });
    }

    return res.status(200).json({
      message: 'Product specification updated successfully!',
      product: updatedProduct,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});






  const deleteProductSpecificationHandler = asyncHandler(async (req, res) => {
    const { productId, specificationId } = req.params;
  
    const updatedProduct = await productService.deleteProductSpecification(productId, specificationId);
  
    res.status(200).json({
      message: "Product specification deleted successfully!",
      updatedProduct
    });
  });
  
  
  
  
  const addProductSpecificationsHandler = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { productSpecification } = req.body;
  
    const updatedProduct = await productService.addProductSpecifications(productId, productSpecification);
  
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
  
    res.status(200).json({
      message: 'Product specifications added successfully!',
      product: updatedProduct,
    });
  })




  const changeProductSpecificationsHandler = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { productSpecification } = req.body;
  
    const updatedProduct = await productService.changeProductSpecifications(productId, productSpecification);
  
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
  
    res.status(200).json({
      message: 'Product specifications updated successfully!',
      product: updatedProduct,
    });
  });
  




  const filterProducts = async (req, res) => {
    try {
      // Extract query parameters and handle defaults
      const filterOptions = {
        categories: req.query.categories ? req.query.categories.split(',') : [],
        minPrice: req.query.minPrice || null,
        maxPrice: req.query.maxPrice || null,
        brand: req.query.brand || null
      };
  
      console.log("Filter Options:", filterOptions); // Debugging line
  
      const result = await productService.getFilteredProducts(filterOptions);
  
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error("Error in filterProducts:", error);
      res.status(500).json({ success: false, message: "Error fetching filtered products" });
    }
  };









const getAllProductsByAllowedCategoryIdsController = asyncHandler(async (req, res) => {
    try {
        const products = await productService.getAllProductsByAllowedCategoryIdsService();

        res.status(200).json({
            message: `Products retrieved successfully.`,
            products
        });
    } catch (error) {
        res.status(400).json({
            message: error.message || "Failed to retrieve products",
        });
    }
});








router.get('/getProductByproductStatus', getProductByproductStatusHandler);
router.post('/addProduct', authMiddleware, roleMiddleware([HEAD_OFFICE, BRANCH_ADMIN]), addProductHandler);
router.put('/updateProduct/:id',updateProductByIdHandler);
router.get('/getAllProducts', getAllProductsHandler)
router.delete('/deleteProduct/:id', authMiddleware, roleMiddleware([HEAD_OFFICE, BRANCH_ADMIN]), deleteProductHandler);
router.get('/getProductById/:id', getProductByIdHandler);
router.get('/getProductByCategoryId/:categoryId', getProductByCategoryIdHandler);
router.get('/getProductBySlugHandler/:productSlug', getProductBySlugHandler);
router.patch('/:productId/specification/:specId', updateProductSpecificationHandler);
router.delete('/:productId/specification/:specificationId', deleteProductSpecificationHandler);
router.post('/:productId/addSpecifications', addProductSpecificationsHandler);

router.put('/:productId/changeSpecifications', changeProductSpecificationsHandler);


router.get('/Productfilters', filterProducts);

router.get('/get-AllProductsSlug',getAllProductsByAllowedCategoryIdsController)
module.exports = router;

