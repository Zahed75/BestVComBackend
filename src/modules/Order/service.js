const OrderModel = require('../Order/model');
const ProductModel = require('../Products/model');
const CouponModel = require('../Discount/model');
const { BadRequest, NotFound } = require('../../utility/errors');
const CustomerModel = require('../Customer/model');
const { generateCustomOrderId, formatOrderTime } = require('../../utility/customOrder');
const sendSMS = require('../../utility/aamarPayOTP');
const { getSMSText } = require('../../utility/getSMS');
const { sendOrderInvoiceEmail } = require('../../utility/email');
const { generateInvoicePDF } = require('../../utility/invoice');



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

const calculateDiscount = (coupon, totalPrice) => {
  if (coupon.general.discountType === 'percentage') {
    return (coupon.general.couponAmount / 100) * totalPrice;
  }
  return 0;
};

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
      throw new NotFound('Customer not found');
    }

    // Validate products
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequest('No products provided');
    }

    const productIds = products.map(product => product._id);
    const validProducts = await ProductModel.find({ _id: { $in: productIds } }).lean().exec();

    if (validProducts.length !== products.length) {
      throw new BadRequest('Invalid product IDs');
    }

    // Calculate total price based on MRP
    const totalPrice = calculateOrderValue(validProducts, products);

    if (isNaN(totalPrice)) {
      throw new BadRequest('Total price calculation resulted in NaN');
    }

    let discountAmount = 0;
    let coupon = null;
    if (couponName) {
      coupon = await CouponModel.findOne({ 'general.couponName': couponName }).lean().exec();
      if (!coupon) throw new BadRequest('Invalid coupon name');
      
      // Validate coupon expiration
      if (new Date() > new Date(coupon.general.couponExpiry)) {
        throw new BadRequest('Coupon has expired');
      }
      
      // Calculate discount
      discountAmount = calculateDiscount(coupon, totalPrice);
    }

    // Calculate VAT (5% fixed rate)
    const vat = (5 / 100) * totalPrice;

    if (isNaN(vat)) {
      throw new BadRequest('VAT calculation resulted in NaN');
    }

    // Calculate final total price including discount and delivery charge
    const finalTotalPrice = totalPrice - discountAmount + deliveryCharge;

    if (isNaN(finalTotalPrice)) {
      throw new BadRequest('Final total price calculation resulted in NaN');
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
      vatRate: 5, // Fixed VAT rate
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
        price: validProduct ? validProduct.general.regularPrice : 0
      };
    });

    // Send SMS to customer
    // const smsText = getSMSText('Received', `${firstName} ${lastName}`, {
    //   orderId: savedOrder.orderId,
    //   products: productInfoForSMS,
    //   totalPrice: savedOrder.totalPrice,
    //   discountAmount: savedOrder.discountAmount
    // });

    // console.log(smsText);
    // await sendSMS(phoneNumber, smsText);

    // Generate PDF invoice
    const pdfPath = await generateInvoicePDF({
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
      vatRate: 5, // Fixed VAT rate
      vat
    }, customer);

    // Send Email Invoice to customer with PDF attachment
    await sendOrderInvoiceEmail(email, {
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
      vatRate: 5, // Fixed VAT rate
      vat
    }, pdfPath);

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
      select: 'firstName lastName email phoneNumber district address' // Add firstName and lastName here
    });

    const formattedOrders = orders.map(order => {
      return {
        ...order.toObject(),
        customerFirstName: order.customer?.firstName || "", // Handle potential null
        customerLastName: order.customer?.lastName || "", // Handle potential null
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

    const billingInfo = customer.billingInfo;

    const orderHistory = orders.map(order => {
      const products = order.products.map(product => {
        if (product._id) {
          const regularPrice = product._id.general.regularPrice || 0;
          const productPrice = product._id.general.salePrice || regularPrice;
          return {
            productName: product._id.productName,
            productImage: product._id.productImage,
            quantity: product.quantity,
            productPrice: productPrice * product.quantity,
            regularPrice: regularPrice * product.quantity,
          };
        }
        return {
          productName: 'Product not found',
          productImage: 'image not available',
          quantity: product.quantity,
          productPrice: 0,
          regularPrice: 0,
        };
      });

      const total = products.reduce((acc, product) => acc + product.productPrice, 0);
      const regularTotal = products.reduce((acc, product) => acc + product.regularPrice, 0);
      const discount = regularTotal - total;
      const VAT = (total * 0.15); // Assuming VAT is 15%
      const subtotal = total + VAT;

      return {
        orderId: order.orderId,
        date: order.createdAt,
        status: order.orderStatus,
        total,
        subtotal,
        discount,
        VAT,
        products,
        paymentMethod: order.paymentMethod,
        billingDetails: billingInfo ? {
          firstName: billingInfo.firstName,
          lastName: billingInfo.lastName,
          fullAddress: billingInfo.fullAddress,
          phoneNumber: billingInfo.phoneNumber,
          email: billingInfo.email,
          zipCode: billingInfo.zipCode,
          district: billingInfo.district,
        } : null,
      };
    });

    return orderHistory;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getOrderHistoryByCustomerId,
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
