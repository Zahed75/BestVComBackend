const brandModel = require('./model');
const { BadRequest } = require('../../utility/errors');
const mongoose = require('mongoose');
const Product = require('../Products/model');

const addBrand = async (brandData) => {
    try {
        const { name, title, description } = brandData;
        const brandExist = await brandModel.findOne({ name });
        if (brandExist) {
            throw new BadRequest('Brand already exists');
        }
        const newBrand = await brandModel.create({
            name,
            title,
            description
        });
        return newBrand;
    } catch (error) {
        console.log(error);
        throw new Error('Brand creation failed: ' + error.message);
    }
}



const getAllBrands = async () => {
  try {
      const brands = await brandModel.aggregate([
          {
              $lookup: {
                  from: "products",
                  localField: "name",
                  foreignField: "productBrand",
                  as: "products"
              }
          },
          {
              $addFields: {
                  productCount: { $size: "$products" }
              }
          }
      ]);

      return brands;
  } catch (error) {
      throw new Error(error.message);
  }
};





const getBrandById = async (brandId) => {
    try {
        const objectIdBrand = mongoose.Types.ObjectId(brandId); // Convert string to ObjectId

        // Count documents with matching productBrand and productStatus
        const productCount = await Product.countDocuments({
            productBrand: objectIdBrand,
            productStatus: 'Published'  // Ensure only 'Published' products are counted
        });

        return productCount;
    } catch (error) {
        console.error('Error in getProductCountByBrand service:', error);
        throw new Error('Failed to retrieve product count');
    }
};








const updateBrandById = async (id, value) => { 
    try{
    const brand = await brandModel.findOneAndUpdate({ _id: id }, value, {
        new: true,
    });
    if (!brand) {
        throw new BadRequest("Could not find the brand with the given id.");
    }
    return brand;
} catch (error) {
    console.log(error);
    throw new Error('Brand update failed: ' + error.message);
}}

module.exports = {
    addBrand,
    getAllBrands,
    getBrandById,
    updateBrandById

};

