const OrderModel = require('../Order/model');
const CouponModel = require('../Discount/model');
const OutletModel = require('../Outlet/model');
const mongoose = require('mongoose');


const showOrdersByFilters = async (filters) => {
  try {
    const { outlet, orderStatus, promoCode, paymentMethod, startDate, endDate } = filters;
    const query = {};

    // Check and cast outlet to ObjectId if it is provided
    if (outlet) {
      // Ensure the outlet filter is cast to an ObjectId
      if (!mongoose.Types.ObjectId.isValid(outlet)) {
        throw new Error('Invalid outlet ID');
      }
      query.transferredToOutlet = new mongoose.Types.ObjectId(outlet);  // Correct casting
    }

    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    if (promoCode) {
      const coupon = await CouponModel.findOne({ couponCode: promoCode });
      if (coupon) {
        query.coupon = coupon._id;
      } else {
        query.coupon = null;
      }
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await OrderModel.find(query)
      .populate({
        path: "products._id",
        model: "Product",
        select: "productName productImage general.regularPrice inventory.sku general.salePrice",
      })
      .populate({
        path: "customer",
        model: "Customer",
        select: "firstName lastName email phoneNumber district address",
      });

    const formattedOrders = orders.map((order) => {
      return {
        ...order.toObject(),
        customerFirstName: order.customer?.firstName || "",
        customerLastName: order.customer?.lastName || "",
        products: order.products
          .map((productItem) => {
            const productDetails = productItem._id;
            return productDetails
              ? {
                  _id: productDetails._id,
                  productName: productDetails.productName,
                  productImage: productDetails.productImage,
                  sku: productDetails.inventory.sku,
                  quantity: productItem.quantity,
                  price: productDetails.general.regularPrice,
                  offerPrice: productDetails.general.salePrice,
                  totalPrice: productDetails.general.salePrice * productItem.quantity,
                }
              : null;
          })
          .filter((product) => product !== null),
        customer: order.customer
          ? {
              _id: order.customer._id,
              email: order.customer.email,
              phoneNumber: order.customer.phoneNumber,
              district: order.customer.district,
              address: order.customer.address,
            }
          : null,
      };
    });

    return formattedOrders;
  } catch (error) {
    console.error("Error retrieving orders with filters:", error);
    throw error;
  }
};



module.exports = { showOrdersByFilters };
