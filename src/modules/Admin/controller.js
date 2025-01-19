const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../utility/common');
const adminService = require('../Admin/service');


const showOrdersByFilters = asyncHandler(async (req, res) => {
  const {
    outlet,
    orderStatus,
    promoCode,
    paymentMethod,
    startDate,
    endDate,
  } = req.query;

  const filters = {
    outlet,
    orderStatus,
    promoCode,
    paymentMethod,
    startDate,
    endDate,
  };
  console.log(filters);
  try {
    const orders = await adminService.showOrdersByFilters(filters);
    res.status(200).json({
      message: "Successfully retrieved orders with filters",
      orders,
    });
    console.log(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving orders with filters",
      error: error.message,
    });
  }
});




// GET request to filter orders
router.get('/orders/filters',showOrdersByFilters);


module.exports = router;