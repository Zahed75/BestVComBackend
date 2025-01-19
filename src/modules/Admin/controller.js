const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../utility/common');
const adminService = require('../Admin/service');



const getOrderByFilter = async (req, res) => {
  try {
    const filters = req.query; // All query params are received here
    const orders = await adminService.getOrdersWithFilters(filters);
  

    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: "No orders found", orders: [] });
    }

    res.status(200).json({ message: "Orders retrieved successfully", orders });
    console.log("Filters applied:", filters);
  } catch (error) {
    console.error("Error in getOrderByFilter:", error.message);
    res.status(500).json({
      message: "Error retrieving orders with filters",
      error: error.message,
    });
  }
};






// GET request to filter orders
router.get('/orders/filters', getOrderByFilter);


module.exports = router;