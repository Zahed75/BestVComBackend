const GridModel = require('../ProductsGrid/model');
const CategoryModel = require('../Category/model'); // Import Category model
const ProductModel = require('../Products/model');
const { BadRequest } = require('../../utility/errors');
// const tempGridModel = require('../tempEvent/model');
const mongoose = require('mongoose');





const createProductGrid = async (data) => {
    try {
      const newGrid = new GridModel(data);
      await newGrid.save();
  
      const populatedGrid = await GridModel.findById(newGrid._id)
        .populate({
          path: 'filterCategories',
          select: 'categoryName'
        })
        .populate({
          path: 'selectProducts',
          select: 'productName'
        });
  
      return populatedGrid;
    } catch (error) {
      throw new Error('Failed to create product grid: ' + error.message);
    }
  };
  





// ProductsInfo by Product Grid
const getProductGridById = async (gridId) => {
  try {
    // Fetch the grid and populate filterCategories and selectProducts
    const grid = await GridModel.findById(gridId)
      .populate({
        path: 'filterCategories',
        select: 'categoryName'
      })
      .populate({
        path: 'selectProducts',
        select: 'productName productSlug productBrand productCode productImage productGallery productVideos productStatus productDescription productSpecification seo productShortDescription general inventory shipping',
        populate: {
          path: 'categoryId',
          select: 'categoryName'
        }
      })
      .exec();

    if (!grid) {
      throw new Error('Grid not found');
    }

    // Ensure that selectProducts is an array
    if (!Array.isArray(grid.selectProducts)) {
      grid.selectProducts = [];
    }

    return grid;
  } catch (error) {
    throw new Error('Failed to retrieve product grid: ' + error.message);
  }
};



  
 

  

  const getAllProductGrids = async () => {
    try {
      const grids = await GridModel.find()
        .populate({
          path: 'filterCategories',
          select: 'categoryName'
        })
        .populate({
          path: 'selectProducts',
          populate: {
            path: 'categoryId', // Populate the category information within the product
            select: 'categoryName'
          },
          select: 'productName productImage productStatus inventory general', // Select the fields you need from the Product model
        });
  
      return grids;
    } catch (error) {
      throw new Error('Failed to retrieve product grids: ' + error.message);
    }
  };
  



  const updateProductGridById = async (gridId, updateData) => {

      const updatedGrid = await GridModel.findByIdAndUpdate(
        gridId,
        { $set: updateData },
        { new: true }
      )
      .populate({
        path: 'filterCategories',
        select: 'categoryName'
      })
      .populate({
        path: 'selectProducts',
        select: 'productName'
      });
  
      if (!updatedGrid) {
        throw new Error('Product grid not found');
      }
  
      return updatedGrid;
   
  };



const deleteProductGridById = async (gridId) => {
    try {
      const deletedGrid = await GridModel.findByIdAndDelete(gridId);
      if (!deletedGrid) {
        throw new Error('Product grid not found');
      }
      return deletedGrid;
    } catch (error) {
      throw new Error('Failed to delete product grid: ' + error.message);
    }
  };



module.exports = {
  createProductGrid,
  getProductGridById,
  getAllProductGrids,
  updateProductGridById,
  deleteProductGridById

}
