const brandModel = require('./model');
const { BadRequest } = require('../../utility/errors');



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
     
      const allBrands = await brandModel.aggregate([
        {
          $lookup: {
            from: 'products', 
            localField: '_id', 
            foreignField: 'productBrand', 
            as: 'products'
          }
        },
        {
          $project: {
            name: 1,
            title: 1,
            description: 1,
            productCount: { $size: '$products' } // Count the number of products
          }
        }
      ]);
  
      return allBrands;
    } catch (err) {
      console.log(err);
      throw new Error('Failed to retrieve brands: ' + err.message);
    }
  };
  




const getBrandById = async (brandId) => {
    try {
        const brand = await brandModel.findById(brandId).lean();
        if (brand) {
            return { success: true, data: brand };
        } else {
            return { success: false, error: 'Brand not found' };
        }
    } catch (error) {
        console.error('Error in getting brand by id:', error.message);
        return { success: false, error: 'Failed to retrieve brand' };
    }

}



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

