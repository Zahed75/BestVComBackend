const OrderModel = require('../Order/model');
const ProductModel = require('../Products/model');
const CouponModel = require('../Discount/model');
const { BadRequest, NotFound } = require('../../utility/errors');
const CustomerModel = require('../Customer/model');
const { generateCustomOrderId, formatOrderTime } = require('../../utility/customOrder');
const sendSMS = require('../../utility/aamarPayOTP');
const { getSMSText } = require('../../utility/getSMS');
const { sendOrderInvoiceEmail } = require('../../utility/email');






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



function calculateDiscount(coupon, totalPrice) {
  if (!coupon) {
    return 0;
  }

  if (coupon.discountType === 'percentage') {
    return (coupon.couponAmount / 100) * totalPrice;
  } else if (coupon.discountType === 'fixed') {
    return coupon.couponAmount;
  } else {
    return 0;
  }
}




const createOrder = async (orderData) => {
  try {
    // Generate custom orderId and orderTime
    const orderId = await generateCustomOrderId();
    const orderTime = formatOrderTime(new Date());

    // Destructure orderData
    const { 
      email, orderType, deliveryAddress, deliveryCharge = 0, 
      district, phoneNumber, paymentMethod, transactionId, 
      products, couponName, vatRate, firstName, lastName, customerIp,
      channel, outlet 
    } = orderData;

    // Find the customer by email
    const customer = await CustomerModel.findOne({ email }).lean().exec();
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Validate products
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('No products provided');
    }

    const productIds = products.map(product => product._id);
    const validProducts = await ProductModel.find({ _id: { $in: productIds } }).lean().exec();

    if (validProducts.length !== products.length) {
      throw new Error('Invalid product IDs');
    }

    // Calculate total price and apply discount if coupon provided
    let discountAmount = 0;
    let coupon = null;

    if (couponName) {
      coupon = await CouponModel.findOne({ 'general.couponName': couponName }).lean().exec();
      if (!coupon) throw new Error('Invalid coupon name');
    }

    const useMRP = coupon !== null;
    const totalPrice = calculateOrderValue(validProducts, products, useMRP);

    if (isNaN(totalPrice)) {
      throw new Error('Total price calculation resulted in NaN');
    }

    if (coupon) {
      discountAmount = calculateDiscount(coupon, totalPrice);
    }

    // Calculate VAT
    const vat = (vatRate / 100) * totalPrice;

    if (isNaN(vat)) {
      throw new Error('VAT calculation resulted in NaN');
    }

    // Calculate final total price including discount and VAT
    const finalTotalPrice = totalPrice - discountAmount + vat + deliveryCharge;

    if (isNaN(finalTotalPrice)) {
      throw new Error('Final total price calculation resulted in NaN');
    }

    // Create new order
    const newOrder = new OrderModel({
      orderId,
      customer: customer._id,
      firstName,
      lastName,
      orderType,
      orderTime,
      deliveryAddress,
      orderStatus: 'Received',
      district,
      phoneNumber,
      paymentMethod,
      transactionId,
      products,
      coupon: coupon ? coupon._id : null,
      discountAmount,
      totalPrice: finalTotalPrice,
      vatRate,
      deliveryCharge,
      customerIp,
      channel,
      outlet
    });

    // Save the order to the database
    const savedOrder = await newOrder.save();

    if (!savedOrder.orderId) {
      console.error('orderId is missing from savedOrder:', savedOrder);
      throw new Error('Order creation failed: orderId is missing');
    }

    // Prepare products info for SMS
    const productInfoForSMS = savedOrder.products.map(product => {
      const validProduct = validProducts.find(p => p._id.equals(product._id));
      return {
        name: validProduct ? validProduct.productName : 'Unknown',
        quantity: product.quantity,
        price: validProduct ? (useMRP ? validProduct.general.regularPrice : validProduct.general.salePrice) : 0
      };
    });

    // Send SMS to customer
    const smsText = getSMSText('Received', `${firstName} ${lastName}`, {
      orderId: savedOrder.orderId,
      products: productInfoForSMS,
      totalPrice: savedOrder.totalPrice,
      discountAmount: savedOrder.discountAmount
    });

    console.log(smsText);
    await sendSMS(phoneNumber, smsText);

    // Send Email Invoice to customer in the background
    sendOrderInvoiceEmail(email, {
      orderId: savedOrder.orderId,
      firstName,
      lastName,
      email,
      deliveryAddress,
      phoneNumber,
      products: productInfoForSMS,
      totalPrice: finalTotalPrice,
      discountAmount,
      deliveryCharge,
      vatRate,
      vat
    }).catch(err => {
      console.error('Error sending order invoice email:', err);
    });

    return {
      message: "Order created successfully",
      createdOrder: {
        order: savedOrder,
        customerEmail: customer.email,
        totalOrderValue: finalTotalPrice,
        couponName: couponName || null
      }
    };

  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};











//updateOrderByOrder ID

const updateOrder = async (orderId, orderData) => {

  // Find the order by OrderId and update it with the provided data
  const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, orderData, { new: true });
  return updatedOrder;

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
    const orders = await OrderModel.find().populate({
      path: 'products._id',
      model: 'Product',
      select: 'productName productImage general.regularPrice inventory.sku general.salePrice'
    }).populate({
      path: 'customer',
      model: 'customer',
      select: 'email phoneNumber district address'
    });

    const formattedOrders = orders.map(order => {
      return {
        ...order.toObject(),
        customerFirstName: order.customer.firstName,
        customerLastName: order.customer.lastName,
        products: order.products.map(productItem => {
          const productDetails = productItem._id;
          return productDetails ? {
            _id: productDetails._id,
            productName: productDetails.productName,
            productImage: productDetails.productImage,
            sku: productDetails.inventory.sku,
            quantity: productItem.quantity,
            price: productDetails.general.regularPrice,
            offerPrice: productDetails.general.salePrice,
            totalPrice: productDetails.general.salePrice * productItem.quantity,
          } : null;
        }).filter(product => product !== null),
        customer: order.customer ? {
          _id: order.customer._id,
          email: order.customer.email,
          phoneNumber: order.customer.phoneNumber,
          district: order.customer.district,
          address: order.customer.address,
        } : null,
      };
    });

    return formattedOrders;
  } catch (error) {
    console.error("Error retrieving orders:", error);
    throw error;
  }
};










// Update Order Status
const updateOrderStatus = async (id, orderStatus) => {
  const order = await OrderModel.findByIdAndUpdate(
    { _id: id },
    { orderStatus },
    { new: true } // This option returns the updated document
  ).populate('products._id');

  if (!order) {
    throw new Error('Order not found');
  }

  const customerName = `${order.firstName} ${order.lastName}`;
  const customerPhone = order.phoneNumber;
  const message = getSMSText(orderStatus, customerName, order);

  await sendSMS(customerPhone, message);

  return order;
};





const getOrderById = async (id) => {
  try {

    const orderInfo = await OrderModel.findById(id)
      .populate({
        path: 'products._id',
        model: 'Product',
        select: 'productName productImage general.regularPrice inventory.sku general.salePrice'
      })
      .populate({
        path: 'customer',
        model: 'customer',
        select: 'firstName lastName email phoneNumber district address'
      });

    if (!orderInfo) {
      throw new NotFound("Order not found");
    }

    const formattedOrder = {
      ...orderInfo.toObject(),
      products: orderInfo.products.map(productItem => {
        const productDetails = productItem._id;
        if (!productDetails) {
          console.warn('Product not found:', productItem);
          return null;
          
        }
        return {
          _id: productDetails._id,
          productName: productDetails.productName,
          productImage: productDetails.productImage,
          sku: productDetails.inventory.sku,
          quantity: productItem.quantity,
          price: productDetails.general.regularPrice,
          offerPrice: productDetails.general.salePrice,
          totalPrice: productDetails.general.salePrice * productItem.quantity,
        };
      }),
      customer: orderInfo.customer ? {
        _id: orderInfo.customer._id,
        firstName: orderInfo.customer.firstName,
        lastName: orderInfo.customer.lastName,
        email: orderInfo.customer.email,
        phoneNumber: orderInfo.customer.phoneNumber,
        district: orderInfo.customer.district,
        address: orderInfo.customer.address,
      } : null,
    };

    return { success: true, order: formattedOrder };
  } catch (error) {
    console.error('Error in getOrderById:', error.message);
    return { success: false, error: error.message };
  }
};




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











// update OrderNoteStatus

const updateOrderNoteById = async (orderId, orderNote) => {

  const updatedOrder = await OrderModel.findOneAndUpdate(
    { _id: orderId },
    { $set: { orderNote } },
    { new: true } // To return the updated document
  );

  if (!updatedOrder) {
    throw new NotFound("Order not found");
  }
  
  return { success: true, order: updatedOrder };

};





// chnage outletByOrderId
const updateOutletByOrderId = async (orderId, outlet) => {
  try {
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { outlet },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error('Order not found');
    }

    return updatedOrder;
  } catch (error) {
    throw new Error(error.message);
  }
};





const getOrderHistoryByCustomerId = async (customerId) => {
  try {
    const orders = await OrderModel.find({ customer: customerId })
      .populate('products._id', 'productName productImage general') // Adjust the path based on your Product schema
      .exec();

    if (!orders || orders.length === 0) {
      throw new Error('No orders found for this customer');
    }

    const customer = await CustomerModel.findById(customerId).exec();
    if (!customer) {
      throw new Error('Customer not found');
    }

    const billingInfo = customer.billingInfo; // Access the billingInfo directly

    const orderHistory = orders.map(order => ({
      orderId: order.orderId,
      date: order.createdAt,
      status: order.orderStatus,
      total: order.totalPrice,
      subtotal: order.totalPrice - (order.discountAmount || 0),
      products: order.products.map(product => {
        if (product._id) {
          const productPrice = product._id.general.salePrice || product._id.general.regularPrice;
          return {
            productName: product._id.productName,
            productImage: product._id.productImage,
            quantity: product.quantity,
            productPrice: productPrice || 0,
            regularPrice: product._id.general.regularPrice || 0,
          };
        }
        return {
          productName: 'Product not found',
          productImage: 'image not available',
          quantity: product.quantity,
          productPrice: 0,
          regularPrice: 0,
        };
      }),
      paymentMethod: order.paymentMethod,
      billingDetails: billingInfo ? {
        firstName: billingInfo.firstName,
        lastName: billingInfo.lastName,
        fullAddress: billingInfo.fullAddress,
        phoneNumber: billingInfo.phoneNumber,
        email: billingInfo.email,
        zipCode: billingInfo.zipCode,
        district: billingInfo.district,
      } : null, // Include billing details if available, otherwise null
    }));

    return orderHistory;
  } catch (error) {
    throw error;
  }
};






























module.exports = {
  createOrder,
  updateOrder,
  deleteOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  getCustomerHistory,
  updateOrderNoteById,
  updateOutletByOrderId,
  getOrderHistoryByCustomerId,
 
};
