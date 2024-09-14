const Category = require("../Category/model");
const { BadRequest } = require("../../utility/errors");
const productModel = require("../Products/model");
const { generateSlug } = require('../../utility/slug');
const categoryModel = require("../Category/model");
const ProductModel = require("../Products/model");






const addCategory = async (categoryData) => {
  const { parentCategory, ...restOfData } = categoryData;

  if (parentCategory) {
    const parentCategoryExist = await Category.findById(parentCategory);

    if (!parentCategoryExist) {
      throw new Error("Parent category does not exist");
    }
    const newSubcategory = await Category.create({
      ...restOfData,
      parentCategory,
      slug: generateSlug(categoryData.categoryName),
    });

    return newSubcategory;
  } else {
    // If no parentCategory is provided, create a new parent category
    const newParentCategory = await Category.create({
      ...restOfData,
      slug: generateSlug(categoryData.categoryName),
    });
    return newParentCategory;
  }
};




// const getAllCategory = async () => {
//   try {
//     const allCategories = await Category.find();
//     const allProducts = await productModel.find();
//     const categoryMap = {};

//     // Debug: Log all categories fetched
//     console.log('All Categories:', allCategories);

//     // Create a map of all categories by their _id and initialize subCategories array
//     allCategories.forEach((category) => {
//       categoryMap[category._id] = category.toObject();
//       categoryMap[category._id].subCategories = [];
//       categoryMap[category._id].productCount = 0; // Initialize product count
//     });

//     // Count products for each category
//     allProducts.forEach((product) => {
//       if (categoryMap[product.categoryId]) {
//         categoryMap[product.categoryId].productCount++;
//       }
//     });

//     // Populate subCategories for each category
//     allCategories.forEach((category) => {
//       if (category.parentCategory && category.parentCategory !== "") {
//         if (categoryMap[category.parentCategory]) {
//           categoryMap[category.parentCategory].subCategories.push(
//             categoryMap[category._id]
//           );
//         }
//       }
//     });

//     const rootCategories = allCategories.filter(
//       (category) => !category.parentCategory || category.parentCategory === ""
//     );

 
//     console.log('Root Categories:', rootCategories);

//     const result = rootCategories.map((category) => {
//       const { slug, ...rest } = categoryMap[category._id];
//       return { slug, ...rest };
//     });

//     // Debug: Log final result
//     console.log('Final Category Result:', result);

//     return result;
//   } catch (error) {
//     console.error('Error fetching categories:', error);
//     throw error;
//   }
// };


const getAllCategory = async () => {
  try {
    // Fetch all categories and only retrieve the categoryName field
    const allCategories = await Category.find({}, 'categoryName parentCategory').exec();

    const categoryMap = {};

    // Create a map of all categories by their _id and initialize subCategories array
    allCategories.forEach((category) => {
      categoryMap[category._id] = {
        categoryName: category.categoryName,
        parentCategory: category.parentCategory || null, // Handle parentCategory logic
        subCategories: []
      };
    });

    // Populate subCategories for each category
    allCategories.forEach((category) => {
      if (category.parentCategory && category.parentCategory !== "") {
        if (categoryMap[category.parentCategory]) {
          categoryMap[category.parentCategory].subCategories.push({
            categoryName: category.categoryName
          });
        }
      }
    });

    // Create root categories (those without a parentCategory or with an empty parentCategory)
    const rootCategories = allCategories.filter(
        (category) => !category.parentCategory || category.parentCategory === ""
    );

    // Prepare the result to only include categoryName and subCategories
    const result = rootCategories.map((category) => {
      return {
        categoryName: category.categoryName,
        subCategories: categoryMap[category._id].subCategories
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};








// update category by ID

const updateCategoryById = async (id, value) => {
  const category = await Category.findOneAndUpdate({ _id: id }, value, {
    new: true,
  });
  if (!category) {
    throw new BadRequest("Could not update the");
  }
  return category;
};



// delete category By ID
const deleteCategoryById = async (id) => {
  const category = await Category.findOneAndDelete({ _id: id });
  if (!category) {
    throw new BadRequest("Could not Delete category Behenchodh!");
  }
  return category;
};




const getSubcategories = async (parentCategoryId) => {
  try {
    console.log("Querying subcategories for parentCategory:", parentCategoryId); // Debugging
    const subcategories = await Category.find({
      parentCategory: parentCategoryId,
    });
    console.log("Subcategories found:", subcategories); // Debugging
    return subcategories;
  } catch (error) {
    console.error("Error while fetching subcategories:", error); // Debugging
    throw new Error("Error while fetching subcategories");
  }
};

const getCategoryById = async (categoryId) => {
  try {
    const category = await Category.findById(categoryId).lean();
    if (category) {
      const allProducts = await productModel.find({ categoryId: categoryId });
      const productCount = allProducts.length;

      const categoryWithProductCount = {
        ...category,
        productCount: productCount,
      };

      return { success: true, data: categoryWithProductCount };
    } else {
      return { success: false, error: "Category not found" };
    }
  } catch (error) {
    console.error("Error in getting category by id:", error.message);
    return { success: false, error: "Failed to retrieve category" };
  }
};


const getProductByCategorySlug = async (slug) => {
  try {
    // Find the category by slug
    const category = await Category.findOne({ slug: slug });
    if (!category) {
      console.error(`Couldn't find category by specified slug: ${slug}`);
      return null;
    }

    console.log('Category found:', category);
 
    // Find products under the found category and populate category details
    const products = await productModel.find({ categoryId: category._id }).populate('categoryId');
    console.log('Products found:', products);

    return products;
  } catch (err) {
    console.error('Error finding products by category slug:', err.message);
    throw err;
  }
};



const getCategoryBySlug = async (slug) => {
  try {
  
    const mainCategory = await Category.findOne({ slug }).exec();

    if (!mainCategory) {
      throw new Error(`Category with slug ${slug} not found`);
    }

    const subCategories = await Category.find({
      parentCategory: mainCategory._id
    }).exec();

   
    const mainCategoryProducts = await ProductModel.find({
      categoryId: mainCategory._id
    }).exec();

 
    const subCategoryProductsPromises = subCategories.map(subCategory =>
      ProductModel.find({ categoryId: subCategory._id }).exec()
    );
    const subCategoryProducts = await Promise.all(subCategoryProductsPromises);


    const allSubCategoryProducts = subCategoryProducts.flat();

 
    const allProducts = [...mainCategoryProducts, ...allSubCategoryProducts];

    return {
      message: "Category fetched successfully!",
      category: {
        ...mainCategory._doc,
        products: mainCategoryProducts,
        subCategories: subCategories.map((subCategory, index) => ({
          ...subCategory._doc,
          products: subCategoryProducts[index]
        }))
      },
      products: allProducts
    };
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    throw error;
  }
};







const getAllCategoriesName = async () => {
  try {
    const categories = await Category.find({}, 'categoryName parentCategory _id').exec();
    console.log('Categories fetched:', categories);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Unable to fetch categories');
  }
};









module.exports = {
  addCategory,
  getAllCategory,
  updateCategoryById,
  deleteCategoryById,
  getSubcategories,
  getCategoryById,
  getProductByCategorySlug,
  getCategoryBySlug,
  getAllCategoriesName

};
