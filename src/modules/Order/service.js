const OrderModel = require('../Order/model');
const ProductModel = require('../Products/model');
const CouponModel = require('../Discount/model');
const { BadRequest, NotFound } = require('../../utility/errors');

const { v4: uuidv4 } = require('uuid');

const { generateCustomOrderId, formatOrderTime } = require('../../utility/customOrder');

function calculateOrderValue(products, orderProducts) {
  return orderProducts.reduce((total, orderProduct) => {
    const product = products.find(p => p._id.equals(orderProduct._id));
    if (product && product.general && typeof product.general.regularPrice === 'number' && orderProduct.quantity && typeof orderProduct.quantity === 'number') {
      return total + (product.general.regularPrice * orderProduct.quantity);
    } else {
      console.warn('Invalid product or quantity:', orderProduct);
      return total;
    }
  }, 0);
}




// Define calculateDiscount function
function calculateDiscount(coupon, totalPrice) {
  if (!coupon) {
    return 0; // No coupon, so no discount
  }

  if (coupon.discountType === 'percentage') {
    return (coupon.couponAmount / 100) * totalPrice;
  } else if (coupon.discountType === 'fixed') {
    return coupon.couponAmount;
  } else {
    return 0; // Unknown discount type, so no discount
  }
}


const createOrder = async (orderData) => {
  try {
    // Generate custom orderId
    const orderId = generateCustomOrderId();
    const orderTime = formatOrderTime(new Date());

    const { customer, orderType, deliveryAddress, deliveryCharge = 0, district, phoneNumber, paymentMethod, transactionId, products, couponId, vatRate } = orderData;

    // Validate request body
    if (!customer || !orderType || !deliveryAddress || !district || !phoneNumber || !paymentMethod || !products) {
      throw new Error('Please provide all required fields');
    }

    // Validate product IDs and quantities
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('No products provided');
    }

    // Check if all products have a quantity field
    for (const product of products) {
      if (!product.quantity || typeof product.quantity !== 'number') {
        throw new Error('Each product must have a valid quantity');
      }
    }

    const productIds = products.map(product => product._id);
    const validProducts = await ProductModel.find({ _id: { $in: productIds } });

    if (validProducts.length !== products.length) {
      throw new Error('Invalid product IDs');
    }

    // Log valid products to debug
    console.log('Valid Products:', validProducts);

    // Calculate total price using the quantity of each product
    let totalPrice = calculateOrderValue(validProducts, products);

    // Log totalPrice to debug
    console.log('Total Price:', totalPrice);

    // Apply discount if coupon provided
    let discountAmount = 0;
    if (couponId) {
      const coupon = await CouponModel.findById(couponId);
      if (!coupon) {
        throw new Error('Invalid coupon ID');
      }
      discountAmount = calculateDiscount(coupon, totalPrice);
      // Log discountAmount to debug
      console.log('Discount Amount:', discountAmount);
    }

    // Check if discountAmount is valid
    if (isNaN(discountAmount) || discountAmount < 0 || discountAmount > totalPrice) {
      throw new Error('Invalid discount amount');
    }

    // Calculate VAT
    const vat = (vatRate / 100) * totalPrice;

    // Log VAT to debug
    console.log('VAT:', vat);
    console.log(discountAmount, deliveryCharge);

    // Calculate final total price including discount and VAT
    const finalTotalPrice = totalPrice - discountAmount + vat + deliveryCharge;

    // Log finalTotalPrice to debug
    console.log('Final Total Price:', finalTotalPrice);

    // Create new order
    const newOrder = new OrderModel({
      orderId,
      customer,
      orderType,
      orderTime,
      deliveryAddress,
      orderStatus: 'Order Received', // Assign the correct status string
      district,
      phoneNumber,
      paymentMethod,
      transactionId,
      products,
      coupon: couponId ? couponId : null,
      discountAmount,
      totalPrice: finalTotalPrice, // Assign final total price
      vatRate,
      deliveryCharge
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    return {
      message: "Order created successfully",
      createdOrder: {
        order: savedOrder,
        totalOrderValue: finalTotalPrice // Include final total order value in the response
      }
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};





//updateOrderByOrder ID

const updateOrder = async (orderId, orderData) => {
  try {
    // Find the order by OrderId and update it with the provided data
    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, orderData, { new: true });
    return updatedOrder;
  } catch (error) {
    throw error;
  }
};

// delete OrderBy ID

const deleteOrder = async (orderId) => {
  try {
    // Find the order by OrderId and delete it
    await OrderModel.findByIdAndDelete(orderId);
  } catch (error) {
    throw error;
  }
};


const getAllOrders = async () => {
  try {
    // Find all orders
    const orders = await OrderModel.find();
    return orders;
  } catch (error) {
    throw error;
  }
};


// Update Order Status
const updateOrderStatus = async (id, updateOrder) => {
  const { orderStatus } = updateOrder;

  const order = await OrderModel.findByIdAndUpdate({ _id: id }, updateOrder, {
    new: true,
  });

  if (!order) throw new NotFound("Order not found");

  const isLogged = order.orderLogs.find(
    (log) => log.status === Number(orderStatus)
  );

  if (!isLogged) {
    order.orderLogs.push({
      status: Number(orderStatus),
      createdAt: new Date(),
    });

    await order.save();

  }
}


const getOrderById = async (id) => {
  try {
    const orderInfo = await OrderModel.findById({ _id: id });
    if (!orderInfo) {
      throw new NotFound("Order not found");
    }
    return { success: true, order: orderInfo };
  } catch (error) {
    console.error('Error in getOrderById:', error.message);
    return { success: false, error: error.message };

  }
}

const getCustomerHistory = async (customerId) => {
  try {
    const orderInfo = await OrderModel.find({ customer: customerId });
    const totalOrders = orderInfo.length;
    let totalOrderValue = 0;
    for (const order of orderInfo) {
      totalOrderValue += order.totalPrice;
    }
    const averageOrderValue = totalOrderValue / totalOrders;
    return { totalOrders, averageOrderValue };
  } catch (error) {
    console.error('Error in getCustomerHistory:', error.message);
    throw error;
  }
}







module.exports = {
  createOrder,
  updateOrder,
  deleteOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  getCustomerHistory
};
