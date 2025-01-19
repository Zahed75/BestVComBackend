const mongoose = require('mongoose');
const OrderModel = require('../Order/model'); // Adjust the path if needed
const CouponModel = require('../Discount/model'); // Adjust the path if needed







const getOrdersWithFilters = async (filters) => {
  try {
    const { orderStatus, paymentMethod, startDate, endDate, promoCode, outlet } = filters;

    const query = {}; // Initialize the query object

    // Add orderStatus filter
    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    // Add paymentMethod filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

   
  // Add date range filter
  if (startDate && endDate) {
    // Check if endDate is today's date
    const now = new Date(); // Current date and time
    const isToday = new Date(endDate).toDateString() === now.toDateString();
  
    // Set endDate to the end of the current day (23:59:59) if it's today
    const adjustedEndDate = isToday
      ? new Date(now.setHours(23, 59, 59, 999))
      : new Date(endDate);
  
    query.createdAt = {
      $gte: new Date(startDate), // Records created on or after startDate
      $lte: adjustedEndDate,    // Records created on or before adjusted endDate
    };
  }
  


    // Add promoCode filter
    if (promoCode) {
      const coupon = await CouponModel.findOne({ "general.couponName": promoCode });
      if (coupon) {
        query["coupon"] = coupon._id; // Match coupon ID
      } else {
        return { message: `Promo code "${promoCode}" not found`, orders: [] };
      }
    }

    // Add outlet filter
    if (outlet) {
      query.outlet = outlet;
    }

    console.log("Query:", JSON.stringify(query, null, 2)); // Debugging query

    // Fetch orders from the database
    const orders = await OrderModel.find(query)
      .populate("outlet")
      .populate("customer")
      .populate("products._id");

    if (!orders || orders.length === 0) {
      return { message: "No orders found", orders: [] };
    }

    return { message: "Orders retrieved successfully", orders };
  } catch (error) {
    console.error("Error in getOrdersWithFilters:", error);
    return { message: "An error occurred while retrieving orders", error: error.message };
  }
};


module.exports = { getOrdersWithFilters };
