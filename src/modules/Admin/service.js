const mongoose = require('mongoose');
const OrderModel = require('../Order/model'); // Adjust the path if needed
const CouponModel = require('../Discount/model'); // Adjust the path if needed
const OutletModel = require('../Outlet/model'); // Adjust the path




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
      const now = new Date(); // Current date and time
      const isToday = new Date(endDate).toDateString() === now.toDateString();

      const adjustedEndDate = isToday
        ? new Date(now.setHours(23, 59, 59, 999))
        : new Date(endDate);

      query.createdAt = {
        $gte: new Date(startDate), // Records created on or after startDate
        $lte: adjustedEndDate,    // Records created on or before adjusted endDate
      };
    }

    // Add promoCode filter
    let matchedCoupon = null;
    if (promoCode) {
      matchedCoupon = await CouponModel.findOne({ "general.couponName": promoCode });
      if (matchedCoupon) {
        query["coupon"] = matchedCoupon._id; // Match coupon ID
      } else {
        return { message: `Promo code "${promoCode}" not found`, orders: [] };
      }
    }

    // Add outlet filter (supports ID or outletName)
    if (outlet) {
      const outletQuery = mongoose.isValidObjectId(outlet)
        ? { _id: outlet } // Match by outlet ID
        : { outletName: { $regex: new RegExp(outlet, "i") } }; // Match by outletName (case-insensitive)

      const outletDoc = await OutletModel.findOne(outletQuery);
      if (outletDoc) {
        query.outlet = outletDoc._id; // Use the matched outlet ID in the query
      } else {
        return { message: `Outlet "${outlet}" not found`, orders: [] };
      }
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

    // Add couponName to each order if a promoCode was used
    const enrichedOrders = orders.map((order) => {
      const orderData = order.toObject();
      if (matchedCoupon && orderData.coupon) {
        orderData.coupon = {
          _id: matchedCoupon._id,
          name: matchedCoupon.general.couponName,
        };
      }
      return orderData;
    });

    return { message: "Orders retrieved successfully", orders: enrichedOrders };
  } catch (error) {
    console.error("Error in getOrdersWithFilters:", error);
    return { message: "An error occurred while retrieving orders", error: error.message };
  }
};

module.exports = { getOrdersWithFilters };





