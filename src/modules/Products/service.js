const Product = require('../Products/model');
const { generateSlug } = require('../../utility/slug');

const { BadRequest } = require('../../utility/errors');


// addProduct
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

    const newProduct = await Product.create({ ...productData, productCode, productSlug });

    if (!newProduct) {
      throw new BadRequest('Could not create product');
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

module.exports = {
  getProductByCategoryId,
};




const getProductByproductStatus = async () => {
  try {
    const products = await Product.find({ productStatus: "Published" });
    if (!products || products.length === 0) {
      console.log('No products found for productStatus:', productStatus);
      return [];
    }
    else {
      console.log('Products found:', products.length);
      return products;
    }
  }
  catch (error) {
    console.error('Error in getProductByproductStatus:', error);
    throw new Error('Failed to retrieve products by productStatus');
  }
  //issue reolved
}





const getProductBySlug = async(productSlug)=>{
  try{
  const product = await Product.findOne({productSlug:productSlug});
  if(!product){
    console.log('No products found by slug :',productSlug)
  }
  return product;
  }
  catch(err){
    console.error('Error finding product by slug',err.message);
  }
}




module.exports = {
  addProduct,
  updateProductById,
  getAllProducts,
  deleteProductById,
  getProductByIdService,
  getProductByCategoryId,
  getProductByproductStatus,
  getProductBySlug
}
