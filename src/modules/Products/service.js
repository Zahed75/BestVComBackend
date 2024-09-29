const Product = require('../Products/model');
const { generateSlug } = require('../../utility/slug');

const { BadRequest } = require('../../utility/errors');

const CategoryModel = require('../Category/model');

// addProducts


const addProduct = async (productData) => {
  try {
    const { productName } = productData;
    let productSlug = generateSlug(productName);
    const existingProduct = await Product.findOne({ productSlug });

    if (existingProduct) {
      let counter = 2;
      let newSlug;
      do {
        newSlug = `${productSlug}-${counter}`;
        counter++;
      } while (await Product.findOne({ productSlug: newSlug }));

      productSlug = newSlug;
    }

    const productCode = await generateProductCode(Product);

    // Create the product with Mongoose, `createdAt` will be automatically set
    const newProduct = await Product.create({ ...productData, productCode, productSlug });

    if (!newProduct) {
      throw new Error('Could not create product');
    }
    return newProduct;
  } catch (error) {
    console.error("Error adding product:", error);
    throw new Error('Failed to add product');
  }
};







//Edit Product

const updateProductById = async (id, value) => {
  const products = await Product.findByIdAndUpdate({ _id: id }, value, {
    new: true,
  })

  if (!products) {
    throw new BadRequest('Could Not Update the Product');
  }
  return products
}



// getAllProducts

const getAllProducts = async () => {
  const products = await Product.find();
  return products;

}





const deleteProductById = async (id) => {
  const product = await Product.findByIdAndDelete({ _id: id });
  if (!product) {
    throw new BadRequest('Could not delete product');
  }
  return product;
}





// generate Product Codes
async function generateProductCode(Product) {
  try {

    const productCount = await Product.countDocuments();

    const productNumber = productCount + 1;

    // Format the product number with leading zeros
    const formattedProductNumber = String(productNumber).padStart(4, '0');

    // Get the current date in the format YYYYMMDD
    const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Construct the product code
    const productCode = `BEL-${formattedProductNumber}-${currentDate}`;

    return productCode;
  } catch (error) {
    console.error('Error generating product code:', error);
    throw new Error('Failed to generate product code');
  }
}



const getProductByIdService = async (id) => {
  try {
    const product = await Product.findById({ _id: id });
    return { success: true, data: product };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to retreive products by code' };
  }
}




const getProductByCategoryId = async (categoryIds) => {
  try {
    // Check if categoryIds is an array, if not, convert it to an array
    if (!Array.isArray(categoryIds)) {
      categoryIds = [categoryIds];
    }

    // Use the $in operator to find products with any of the specified categoryIds
    const products = await Product.find({ categoryId: { $in: categoryIds } });

    if (!products || products.length === 0) {
      console.log('No products found for categoryIds:', categoryIds);
      return [];
    }

    console.log('Products found:', products.length);
    return products;
  } catch (error) {
    console.error('Error in getProductByCategoryId:', error);
    throw new Error('Failed to retrieve products by category');
  }
};





const getProductByproductStatus = async () => {
  try {
    const products = await Product.find({ productStatus: "Published" });
    if (!products || products.length === 0) {
      console.log('No products found for productStatus: Published');
      return [];
    } else {
      console.log('Products found:', products.length);
      return products;
    }
  } catch (error) {
    console.error('Error in getProductByproductStatus:', error);
    throw new Error('Failed to retrieve products by productStatus');
  }
};






const getProductBySlug = async (productSlug) => {
  try {
    const product = await Product.findOne({ productSlug });
    if (!product) {
      console.log('No products found by slug:', productSlug);
    }
    return product;
  } catch (err) {
    console.error('Error finding product by slug', err.message);
    throw new Error('Failed to retrieve product');
  }
};




const updateProductSpecification = async (productId, specId, newKeyValue) => {
  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, 'productSpecification._id': specId },
      {
        $set: {
          'productSpecification.$.key': newKeyValue.key,
          'productSpecification.$.value': newKeyValue.value,
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error('Product or specification not found');
    }

    return updatedProduct;
  } catch (error) {
    console.error('Error updating product specification:', error);
    throw new Error('Failed to update product specification');
  }
};





const deleteProductSpecification = async (productId, specificationId) => {
  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $pull: { productSpecification: { _id: specificationId } } },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      throw new Error('Product or Specification not found');
    }

    return updatedProduct;
  } catch (error) {
    console.error("Error deleting product specification:", error);
    throw new Error('Failed to delete product specification');
  }
};




const addProductSpecifications = async (productId, newSpecifications) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $push: { productSpecification: { $each: newSpecifications } } },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error('Product not found');
    }

    return updatedProduct;
  } catch (error) {
    console.error('Error adding product specifications:', error);
    throw new Error('Failed to add product specifications');
  }
};




const changeProductSpecifications = async (productId, newSpecifications) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { productSpecification: newSpecifications }, // Replace the entire specification array
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error('Product not found');
    }

    return updatedProduct;
  } catch (error) {
    console.error('Error updating product specifications:', error);
    throw new Error('Failed to update product specifications');
  }
};






const getFilteredProducts = async (filterOptions) => {
  try {
    let query = {};

    // Handle category filter
    if (filterOptions.CategoryModel && filterOptions.CategoryModel.length > 0) {
      const categoryIds = filterOptions.CategoryModel.map(id => mongoose.Types.ObjectId(id));
      query.categoryId = { $in: categoryIds };
    }

    // Handle price filter
    if (filterOptions.minPrice || filterOptions.maxPrice) {
      query['general.regularPrice'] = {};
      if (filterOptions.minPrice) {
        query['general.regularPrice'].$gte = parseFloat(filterOptions.minPrice);
      }
      if (filterOptions.maxPrice) {
        query['general.regularPrice'].$lte = parseFloat(filterOptions.maxPrice);
      }
    }

    // Handle brand filter
    if (filterOptions.brand) {
      query.productBrand = filterOptions.brand;
    }

    console.log("Executing MongoDB Query:", query); // Debugging line

    const products = await Product.find(query).exec();

    if (products.length > 0) {
      return { success: true, data: products };
    } else {
      return { success: false, message: "No products found matching the criteria" };
    }
  } catch (error) {
    console.error("Error in getFilteredProducts:", error);
    return { success: false, message: "Error fetching filtered products" };
  }
};




// const allowedCategoryIds = [
//   "66bad6ec5a4a8987716ee701",
//   "66e66d9344c7641816db25d4",
//   "66e50d06e39a0fec145142d3",
//   "66e50c8ae39a0fec145141a6",
//   "66defcc7b146be859e284ab0",
//   "66bc25165a4a8987716eed9e"
// ];
//
//
// const getAllProductsByAllowedCategoryIdsService = async () => {
//   try {
//     // Fetch all products with allowed categories
//     const products = await Product.find()
//         .populate({
//           path: 'categoryId',
//           select: 'categoryName slug',
//           match: { _id: { $in: allowedCategoryIds } }
//         })
//         .lean()
//         .exec();
//
//     // Function to recursively fetch subcategories
//     const fetchSubCategories = async (categoryId) => {
//       const subCategories = await CategoryModel.find({ parentCategory: categoryId })
//           .select('_id categoryName slug')
//           .lean()
//           .exec();
//
//       // Recursively fetch subcategories of each subcategory
//       const subCategoriesWithChildren = await Promise.all(
//           subCategories.map(async (subCat) => ({
//             _id: subCat._id,
//             categoryName: subCat.categoryName,
//             slug: subCat.slug,
//             subCategories: await fetchSubCategories(subCat._id) // Recursive call
//           }))
//       );
//
//       return subCategoriesWithChildren;
//     };
//
//     // For each product, fetch and append the subcategories associated with the parent category
//     const updatedProducts = await Promise.all(
//         products.map(async (product) => {
//           const updatedCategories = await Promise.all(
//               product.categoryId.map(async (category) => {
//                 // Fetch subcategories for the current category
//                 const subCategories = await fetchSubCategories(category._id);
//
//                 return {
//                   categoryId: category._id,
//                   categoryName: category.categoryName,
//                   subCategories: subCategories // Include subcategories with their own subcategories
//                 };
//               })
//           );
//
//           return {
//             ...product,
//             categoryId: updatedCategories // Replace the categoryId field with the enriched version
//           };
//         })
//     );
//
//     return updatedProducts;
//   } catch (error) {
//     throw error;
//   }
// };


const allowedCategoryIds = [
  "66bad6ec5a4a8987716ee701",
  "66e66d9344c7641816db25d4",
  "66e50d06e39a0fec145142d3",
  "66e50c8ae39a0fec145141a6",
  "66defcc7b146be859e284ab0",
  "66bc25165a4a8987716eed9e"
];

const getAllProductsByAllowedCategoryIdsService = async () => {
  try {
    // Fetch all products and populate categoryId
    const products = await Product.find()
        .populate({
          path: 'categoryId',
          select: 'categoryName slug',
          match: { _id: { $in: allowedCategoryIds } }
        })
        .lean()
        .exec();

    // For each product, fetch and append the subcategories associated with the parent category
    const updatedProducts = await Promise.all(
        products.map(async (product) => {
          // Check if categoryId exists and is an array
          if (!product.categoryId || !Array.isArray(product.categoryId)) {
            return product; // Return the product as is if there are no categories
          }

          const updatedCategories = await Promise.all(
              product.categoryId.map(async (category) => {
                // Find subcategories where parentCategory matches the current category's _id
                const subCategories = await CategoryModel.find({
                  parentCategory: category._id
                }).select('_id categoryName slug').lean();

                // Return the category with its subcategories
                return {
                  categoryId: category._id,
                  categoryName: category.categoryName,
                  subCategories: subCategories.map(subCat => ({
                    _id: subCat._id,
                    categoryName: subCat.categoryName,
                    slug: subCat.slug,
                  }))
                };
              })
          );

          return {
            ...product,
            categoryId: updatedCategories // Replace the categoryId field with the enriched version
          };
        })
    );

    return updatedProducts; // Return the enriched product list
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

module.exports = {
  getAllProductsByAllowedCategoryIdsService
};

