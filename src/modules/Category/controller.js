const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utility/common');
const categoryService = require('./service');


const {
    HEAD_OFFICE,
    BRANCH_ADMIN,
    CUSTOMER
} = require('../../config/constants');




// create Category
const createCategoryHandler = asyncHandler(async (req, res) => {
    const category = await categoryService.addCategory(req.body);
    res.status(200).json({
        message: "Category added successfully",
        category
    });
});




// getAllSubcatgories

const getAllCategoriesHandler = asyncHandler(async (req, res) => {
    const allCategories = await categoryService.getAllCategory();
    res.status(200).json({
        message: "GetAll Categories Fetched Successfully!",
        categories: allCategories
    });
});





// Update CategoryBy ID

const updateCategoryHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateCategory = await categoryService.updateCategoryById(id, req.body);
    res.status(200).json({
        message: "Update Category Successfully",
        updateCategory
    })
})


// deleteCategoryHandlerbyId

const deleteCategoryHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleteCategory = await categoryService.deleteCategoryById(id, req.body);
    res.status(200).json({
        message: "Delete Category Successfully!",
        deleteCategory
    })
})




const getSubcategoriesHandler = asyncHandler(async (req, res) => {
    const { parentCategory } = req.params;

    console.log('Received parentCategory:', parentCategory); // Debugging
    const subcategories = await categoryService.getSubcategories(parentCategory);
    res.status(200).json({
        message: 'Get All Sub Categories Data!',
        subcategories
    });

})
const getCategoryByIdHandler = asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    const { success, data, error } = await categoryService.getCategoryById(categoryId);
    if (success) {
        res.status(200).json({
            message: "Category by id successful",
            category: data
        });
    } else {
        res.status(400).json({
            error
        });
    }
});

const getProductByCategorySlugHandler = asyncHandler(async (req, res) => {
    const { slug } = req.params;  // or req.body if you prefer
    try {
      const products = await categoryService.getProductByCategorySlug(slug);
  
      if (!products || products.length === 0) {
        return res.status(404).json({
          message: "No products found for the specified category slug",
        });
      }
  
      res.status(200).json({
        message: "Success",
        products
      });
    } catch (err) {
      res.status(500).json({
        message: "An error occurred",
        error: err.message
      });
    }
  });
  


  const getCategoryBySlugHandler = asyncHandler(async (req, res) => {
    try {
      const { slug } = req.params;
      const categoryData = await categoryService.getCategoryBySlug(slug);
      res.status(200).json({
        message: "Category fetched successfully!",
        category: categoryData.category,
        subCategories: categoryData.subCategories,
        products: categoryData.products
      });
    } catch (error) {
      res.status(500).json({
        message: error.message || "Failed to fetch category",
      });
    }
  });



router.post('/addCategory', authMiddleware, roleMiddleware([HEAD_OFFICE]), createCategoryHandler);
router.get('/getAllCat', getAllCategoriesHandler);
router.put('/updateCategory/:id', authMiddleware, roleMiddleware([HEAD_OFFICE]), updateCategoryHandler);
router.delete('/deleteCategory/:id', authMiddleware, roleMiddleware([HEAD_OFFICE]), deleteCategoryHandler);
router.get('/:parentCategory', getSubcategoriesHandler);
router.get('/getCategoryById/:id', getCategoryByIdHandler);
router.get('/getProductByCatSlug/:slug',getProductByCategorySlugHandler);
router.get('/categories/:slug', getCategoryBySlugHandler);

module.exports = router;