const Product = require('../Products/model');
const OutletModel = require('../Outlet/model');
const {generateSlug} = require('../../utility/slug');
const mongoose = require('mongoose');
const {BadRequest} = require('../../utility/errors');
const CategoryModel = require('../Category/model');
const InventoryModel = require('../Inventory/model');


// addProducts
// const addProduct = async (productData) => {
//     try {
//         const {productName} = productData;
//         let productSlug = generateSlug(productName);
//         const existingProduct = await Product.findOne({productSlug});

//         if (existingProduct) {
//             let counter = 2;
//             let newSlug;
//             do {
//                 newSlug = `${productSlug}-${counter}`;
//                 counter++;
//             } while (await Product.findOne({productSlug: newSlug}));

//             productSlug = newSlug;
//         }

//         const productCode = await generateProductCode(Product);

//         // Create the product with Mongoose, `createdAt` will be automatically set
//         const newProduct = await Product.create({...productData, productCode, productSlug});

//         if (!newProduct) {
//             throw new Error('Could not create product');
//         }
//         return newProduct;
//     } catch (error) {
//         console.error("Error adding product:", error);
//         throw new Error('Failed to add product');
//     }
// };


const addProduct = async (productData) => {
    try {
        // Required fields check with meaningful error messages
        const requiredFields = {
            productName: "Product Name is required.",
            productBrand: "Product Brand is required.",
            categoryId: "At least one Category ID is required.",
            productStatus: "Product Status (Published/Draft) is required.",
            "general.regularPrice": "Regular Price is required in the General section."
        };

        let missingFields = [];
        for (const [field, message] of Object.entries(requiredFields)) {
            const keys = field.split('.');
            let value = productData;
            for (const key of keys) {
                value = value?.[key];
                if (value === undefined || value === null) {
                    missingFields.push(message);
                    break;
                }
            }
        }

        if (missingFields.length > 0) {
            throw new Error(missingFields.join(" "));
        }

        // Check if productName is valid
        if (typeof productData.productName !== "string" || productData.productName.trim().length === 0) {
            throw new Error("Product Name must be a non-empty string.");
        }

        // Generate unique slug
        let productSlug = generateSlug(productData.productName);
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

        // Generate unique product code
        const productCode = await generateProductCode(Product);

        // Create product
        const newProduct = await Product.create({
            ...productData,
            productCode,
            productSlug
        });

        return newProduct;
    } catch (error) {
        console.error("Error adding product:", error);

        // Handle missing required fields
        if (error.message.includes("required")) {
            throw new Error(error.message);
        }

        // Handle Mongoose validation errors
        if (error.name === "ValidationError") {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
        }

        // Handle duplicate key errors (e.g., unique constraint violations)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            throw new Error(`Duplicate value error: ${field} must be unique.`);
        }

        // Return detailed error message
        throw new Error(`Unexpected error: ${error.message || "Failed to add product"}`);
    }
};






//Edit Product

const updateProductById = async (id, value) => {
    const products = await Product.findByIdAndUpdate({_id: id}, value, {
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
    const product = await Product.findByIdAndDelete({_id: id});
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
        const product = await Product.findById({_id: id});
        return {success: true, data: product};
    } catch (error) {
        console.error(error);
        return {success: false, error: 'Failed to retreive products by code'};
    }
}


const getProductByCategoryId = async (categoryIds) => {
    try {
        // Check if categoryIds is an array, if not, convert it to an array
        if (!Array.isArray(categoryIds)) {
            categoryIds = [categoryIds];
        }

        // Use the $in operator to find products with any of the specified categoryIds
        const products = await Product.find({categoryId: {$in: categoryIds}});

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
        const products = await Product.find({productStatus: "Published"});
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
        const product = await Product.findOne({productSlug});
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
            {_id: productId, 'productSpecification._id': specId},
            {
                $set: {
                    'productSpecification.$.key': newKeyValue.key,
                    'productSpecification.$.value': newKeyValue.value,
                }
            },
            {new: true, runValidators: true}
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
            {_id: productId},
            {$pull: {productSpecification: {_id: specificationId}}},
            {new: true} // Return the updated document
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
            {$push: {productSpecification: {$each: newSpecifications}}},
            {new: true, runValidators: true}
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
            {productSpecification: newSpecifications}, // Replace the entire specification array
            {new: true, runValidators: true}
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
            query.categoryId = {$in: categoryIds};
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
            return {success: true, data: products};
        } else {
            return {success: false, message: "No products found matching the criteria"};
        }
    } catch (error) {
        console.error("Error in getFilteredProducts:", error);
        return {success: false, message: "Error fetching filtered products"};
    }
};


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
        // Fetch all products that belong to any allowed categories
        const products = await Product.find({
            categoryId: {$in: allowedCategoryIds}
        }).lean().exec();

        // For each product, filter out categoryId entries that are not in the allowed list
        const filteredProducts = products.map((product) => {
            const filteredCategoryIds = product.categoryId.filter(catId =>
                allowedCategoryIds.includes(catId.toString())
            );

            // Return the product with only allowed category IDs
            return {
                ...product,
                categoryId: filteredCategoryIds // Include only matching allowed categories
            };
        });

        // Return the filtered products
        return filteredProducts;
    } catch (error) {
        console.error('Error fetching allowed categories and products:', error);
        throw error;
    }
};


const getProductWithOutletQuantities = async (id) => {
    // Fetch the product details using the productId
    const product = await Product.findById(id);


    // Fetch the quantity information for this product across all outlets
    const outletQuantities = await InventoryModel.aggregate([
        {
            $unwind: '$products', // Flatten the 'products' array
        },
        {
            $lookup: {
                from: 'outlets', // Lookup outlet data from the 'outlets' collection
                localField: 'outletId',
                foreignField: '_id',
                as: 'outletData',
            },
        },
        {
            $unwind: '$outletData', // Flatten outlet data
        },
        {
            $project: {
                outletName: '$outletData.outletName',
                outletLocation: '$outletData.outletLocation',
                quantity: '$products.quantity', // Show product quantity in each outlet
            },
        },
    ]);

    // Return product details and outlet quantities
    return {
        success: true,
        message: 'Product details fetched successfully',
        data: {
            product,
            outletQuantities,
        },
    };



}



const getProductOutlets = async (productId) => {
    try {
        // Convert productId to ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return { error: 'Invalid product ID' };
        }

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return { error: 'Product not found' };
        }

        // Find inventories that contain this product inside the products array
        const inventories = await InventoryModel.find({ "products._id": productId })
            .populate('outletId', 'outletName outletLocation');

        if (!inventories.length) {
            return { error: 'No inventory found for this product' };
        }

        // Transform the data
        const outletQuantities = inventories.map(inv => {
            // Find the specific product's quantity from the `products` array
            const productData = inv.products.find(p => p._id.toString() === productId);

            return {
                _id: inv.outletId._id,
                outletName: inv.outletId.outletName,
                outletLocation: inv.outletId.outletLocation,
                quantity: productData ? productData.quantity : 0
            };
        });

        return {
            product: product.productName,
            outletQuantities
        };

    } catch (error) {
        console.error(error);
        return { error: 'Internal server error' };
    }
};







module.exports = {
    addProduct,
    updateProductById,
    getAllProducts,
    deleteProductById,
    getProductByIdService,
    getProductByCategoryId,
    getProductByproductStatus,
    getProductBySlug,
    updateProductSpecification,
    deleteProductSpecification,
    addProductSpecifications,
    changeProductSpecifications,
    getFilteredProducts,
    getAllProductsByAllowedCategoryIdsService,
    getProductWithOutletQuantities,
    getProductOutlets


}
