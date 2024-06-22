const OutletModel = require("./model");
const userModel = require("../User/model");
const { passEmailForOutlet } = require('../../utility/email');

const outletCreateService = async (outletName, outletLocation, outletImage, branchAdmin) => {
  try {
    if (!outletName || !outletLocation || !branchAdmin || !outletImage) {
      throw new Error('Outlet name, location, and branch admin with image are required');
    }
    const newOutlet = await OutletModel.create({
      outletName,
      outletLocation,
      outletImage,
      branchAdmin
    });
    return newOutlet;
  } catch (error) {
    console.error('Error in outletCreateService:', error.message);
    throw new Error('Outlet creation failed: ' + error.message);
  }
};

const getAllUsers = async () => {
  try {
    const users = await OutletModel.find();
    return users;
  } catch (error) {
    console.error('Error in getAllUsers:', error.message);
    throw new Error('Failed to retrieve users: ' + error.message);
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
    const searchedOutlet = await OutletModel.find({ outletName: { $in: outletName }});
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

module.exports = {
  outletCreateService,
  getAllUsers,
  updateOutlet,
  deleteOutlet,
  searchOutlet,
  getOutletManagerByIdService
};
