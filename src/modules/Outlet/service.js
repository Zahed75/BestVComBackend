const OutletModel = require("./model");
const userModel = require("../User/model");
const { passEmailForOutlet } = require('../../utility/email');
const InventoryModel = require('../Inventory/model');
const ProductModel = require('../Products/model');



const outletCreateService = async (outletName, cityName, outletLocation, outletImage, outletManager, outletManagerEmail, outletManagerPhone, areaName) => {
  try {
    if (!outletName || !outletLocation || !outletManager || !outletImage) {
      throw new Error('Outlet name, location, manager, and image are required');
    }

    const managerInfo = await userModel.findById(outletManager);

    if (!managerInfo) {
      throw new Error('Outlet manager not found');
    }
    if (managerInfo.email !== outletManagerEmail || managerInfo.phoneNumber !== outletManagerPhone) {
      throw new Error('Invalid outlet manager email or phone number');
    }

    const existingOutlet = await OutletModel.findOne({ outletName });
    if (existingOutlet) {
      throw new Error('Outlet with the same name already exists');
    }

    const newOutlet = await OutletModel.create({
      outletName,
      outletLocation,
      outletImage,
      outletManager,
      outletManagerEmail,
      outletManagerPhone,
      cityName,
      areaName,
    });

    return newOutlet;
  } catch (error) {
    console.error('Error in outletCreateService:', error.message);
    throw new Error('Outlet creation failed: ' + error.message);
  }
};







// const getAllOutlet = async () => {
//   try {
//     const users = await OutletModel.find();
//     return users;
//   } catch (error) {
//     console.error('Error in getAllUsers:', error.message);
//     throw new Error('Failed to retrieve users: ' + error.message);
//   }
// };


const getAllOutlet = async (productIds) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('productIds array is required.');
    }

    // Get all outlets
    const outlets = await OutletModel.find({}, '_id outletName outletLocation');

    if (!outlets.length) {
      throw new Error('No outlets found');
    }

    const availability = [];

    // Loop through each outlet and check for the products in its inventory
    for (const outlet of outlets) {
      const inventory = await InventoryModel.findOne({ outletId: outlet._id })
          .populate({
            path: 'products._id',
            select: '-__v', // Exclude unneeded fields
          });

      if (inventory) {
        const outletProductAvailability = productIds.map((productId) => {
          const product = inventory.products.find(
              (p) => p._id._id.toString() === productId
          );

          if (!product) {
            return {
              outletName: outlet.outletName,
              outletLocation: outlet.outletLocation,
              productId,
              available: false,
              message: 'Product not found in inventory',
            };
          }

          const isAvailable = product.quantity > 0;

          return {
            outletName: outlet.outletName,
            outletLocation: outlet.outletLocation,
            productId: product._id._id,
            productName: product._id.productName,
            available: isAvailable,
            quantity: product.quantity,
            message: isAvailable
                ? 'Product is available'
                : 'Product is out of stock',
          };
        });

        // Push availability of current outlet to overall result
        availability.push(...outletProductAvailability);
      }
    }

    return availability;
  } catch (error) {
    throw new Error(error.message);
  }
};



const updateOutlet = async (userId, updatedInfo) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!updatedInfo || Object.keys(updatedInfo).length === 0) {
      throw new Error('Outlet info to update is required');
    }

    const updatedResult = await OutletModel.findByIdAndUpdate(
      userId,
      updatedInfo,
      { new: true }
    );

    if (!updatedResult) {
      throw new Error('Outlet not found');
    }

    return updatedResult;
  } catch (error) {
    console.error('Error in updateOutlet:', error.message);
    throw new Error('Failed to update outlet: ' + error.message);
  }
};




const deleteOutlet = async (id) => {
  try {
    if (!id) {
      throw new Error('Outlet ID is required');
    }
    const deletedResult = await OutletModel.findByIdAndDelete(id);
    if (!deletedResult) {
      throw new Error('Outlet not found for deletion');
    }
    return deletedResult;
  } catch (error) {
    console.error('Error in deleteOutlet:', error.message);
    throw new Error('Failed to delete outlet: ' + error.message);
  }
};




const searchOutlet = async (outletName) => {
  try {
    if (!outletName) {
      throw new Error('Outlet name is required');
    }
    const searchedOutlet = await OutletModel.find({ outletName: { $in: outletName } });
    if (searchedOutlet.length === 0) {
      throw new Error('No outlets found matching the search criteria');
    }
    return searchedOutlet;
  } catch (error) {
    console.error('Error in searchOutlet:', error.message);
    throw new Error('Search failed: ' + error.message);
  }
};




const getOutletManagerByIdService = async (id) => {
  try {
    if (!id) {
      throw new Error('Manager ID is required');
    }
    const managerInfo = await userModel.findById(id);
    if (!managerInfo) {
      throw new Error('Outlet manager not found');
    }
    return managerInfo;
  } catch (error) {
    console.error('Error in getOutletManagerByIdService:', error.message);
    throw new Error('Failed to retrieve outlet manager: ' + error.message);
  }
};
  




const getOutletById = async (id) => {
  try {
    if (!id) {
      throw new Error('Outlet ID is required');
    }
    console.log('Fetching outlet with ID:', id);
    const outlet = await OutletModel.findById(id)
    .populate('outletManager', 'firstName lastName email phoneNumber');
    if (!outlet) {
      throw new Error('Outlet not found');
    }
    return outlet;
  } catch (error) {
    console.error('Error in getOutletById:', error.message);
    throw new Error('Failed to retrieve outlet: ' + error.message);
  }
}




module.exports = {
  outletCreateService,
  getAllOutlet,
  updateOutlet,
  deleteOutlet,
  searchOutlet,
  getOutletManagerByIdService,
  getOutletById

}


