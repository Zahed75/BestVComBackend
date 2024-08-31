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
        populate: [
          {
            path: 'categoryId',
            select: 'categoryName'
          },
          {
            path: 'productSpecification'
          }
        ],
        select: 'productName productSlug productBrand productCode productImage productGallery productVideos productStatus seo general inventory shipping productShortDescription createdAt updatedAt'
      });

    return grids;
  } catch (error) {
    throw new Error('Failed to retrieve product grids: ' + error.message);
  }
};





  const updateProductGridById = async (gridId, updateData) => {

      // Find the grid to be updated
      const gridToUpdate = await GridModel.findById(gridId);
  
      if (!gridToUpdate) {
        throw new Error('Product grid not found');
      }
  
      // Check if the ordersBy field is being updated
      if (updateData.ordersBy !== undefined && updateData.ordersBy !== gridToUpdate.ordersBy) {
        const newOrder = updateData.ordersBy;
        const oldOrder = gridToUpdate.ordersBy;
  
        // Update ordersBy for other grids accordingly
        if (oldOrder < newOrder) {
          // Decrement the order of grids between oldOrder and newOrder
          await GridModel.updateMany(
            { ordersBy: { $gt: oldOrder, $lte: newOrder } },
            { $inc: { ordersBy: -1 } }
          );
        } else if (oldOrder > newOrder) {
          // Increment the order of grids between newOrder and oldOrder
          await GridModel.updateMany(
            { ordersBy: { $gte: newOrder, $lt: oldOrder } },
            { $inc: { ordersBy: 1 } }
          );
        }
  
        // Apply the new ordersBy value to the grid being updated
        gridToUpdate.ordersBy = newOrder;
      }
  
      // Apply other updates in the updateData object
      Object.keys(updateData).forEach((key) => {
        if (key !== 'ordersBy') {
          gridToUpdate[key] = updateData[key];
        }
      });
  
      // Save the updated grid
      const updatedGrid = await gridToUpdate.save();
  
      // Re-fetch and populate the grid to return the updated object
      const populatedGrid = await GridModel.findById(gridId)
        .populate({
          path: 'filterCategories',
          select: 'categoryName',
        })
        .populate({
          path: 'selectProducts',
          select: 'productName',
        });
  
      return populatedGrid;
  
   
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
