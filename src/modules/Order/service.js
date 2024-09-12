const OrderModel = require('../Order/model');
const ProductModel = require('../Products/model');
const CouponModel = require('../Discount/model');
const { BadRequest, NotFound } = require('../../utility/errors');
const CustomerModel = require('../Customer/model');
const { generateCustomOrderId, formatOrderTime } = require('../../utility/customOrder');
const sendSMS = require('../../utility/aamarPayOTP');
const { getSMSText } = require('../../utility/getSMS');
const { sendOrderInvoiceEmail } = require('../../utility/email');
const UserModel = require('../User/model');



function calculateOrderValue(products, orderProducts, couponId) {
  return orderProducts.reduce((total, orderProduct) => {
    const product = products.find(p => p._id.equals(orderProduct._id));
    if (product && product.general && orderProduct.quantity && typeof orderProduct.quantity === 'number') {
      const price = couponId
        ? product.general.regularPrice // Use regular price if coupon is applied
        : product.general.salePrice || product.general.regularPrice; // Use sale price if available, else regular price

      if (isNaN(price)) {
        console.warn('Invalid price for product:', product);
        return total;
      }

      return total + (price * orderProduct.quantity);
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
    const orderId = await generateCustomOrderId();
    const { email, orderType, deliveryAddress, deliveryCharge = 0, district, phoneNumber, paymentMethod, transactionId, products, couponName, firstName, lastName, customerIp, channel, outlet } = orderData;

    // Find customer by email or phone number
    const customer = await CustomerModel.findOne({ $or: [{ email: email || null }, { phoneNumber }] }).lean().exec();

    if (!customer) throw new Error('Customer not found');

    const customerFirstName = firstName || customer.firstName;
    const customerLastName = lastName || customer.lastName;
    const customerPhoneNumber = phoneNumber || customer.phoneNumber;

    if (!Array.isArray(products) || products.length === 0) throw new Error('No products provided');

    const productIds = products.map(product => product._id);
    const validProducts = await ProductModel.find({ _id: { $in: productIds } }).lean().exec();

    if (validProducts.length !== products.length) throw new Error('Invalid product IDs');

    const totalPrice = calculateOrderValue(validProducts, products, couponName);
    if (!totalPrice || isNaN(totalPrice)) throw new Error('Invalid total price');

    let discountAmount = 0;
    let coupon = null;
    if (couponName) {
      coupon = await CouponModel.findOne({ 'general.couponName': couponName }).lean().exec();
      if (!coupon) throw new Error('Invalid coupon name');
      discountAmount = calculateDiscount(coupon, totalPrice);
    }

    const vatRate = 5;
    const vat = (vatRate / 100) * totalPrice;

    const finalTotalPrice = totalPrice - discountAmount + (isNaN(deliveryCharge) ? 0 : deliveryCharge);

    const newOrder = new OrderModel({
      orderId,
      customer: customer._id,
      firstName: customerFirstName,
      lastName: customerLastName,
      orderType,
      deliveryAddress,
      district,
      phoneNumber: customerPhoneNumber,
      email: email || customer.email,
      paymentMethod,
      transactionId,
      products,
      coupon: coupon ? coupon._id : null,
      discountAmount,
      totalPrice: finalTotalPrice,
      deliveryCharge,
      customerIp,
      channel,
      outlet
    });

    const savedOrder = await newOrder.save();

    const productInfoForSMS = savedOrder.products.map(product => {
      const validProduct = validProducts.find(p => p._id.equals(product._id));
      return { name: validProduct ? validProduct.productName : 'Unknown', quantity: product.quantity, price: validProduct ? validProduct.general.regularPrice : 0 };
    });

    const smsText = `Order ${savedOrder.orderId} confirmed. Products: ${productInfoForSMS.map(p => `${p.quantity} x ${p.name} - ${p.price}`).join(', ')}`;

    // Validate and send SMS
    if (typeof customerPhoneNumber === 'string' && customerPhoneNumber.trim()) {
      await sendSMS(customerPhoneNumber, smsText);
    }

    // Validate and send email
    if (typeof savedOrder.email === 'string' && savedOrder.email.trim()) {
      await sendOrderInvoiceEmail(savedOrder.email, {
        orderId: savedOrder.orderId,
        customerName: `${savedOrder.firstName} ${savedOrder.lastName}`,
        products: productInfoForSMS,
        totalPrice: savedOrder.totalPrice,
        deliveryCharge: savedOrder.deliveryCharge,
        discountAmount: savedOrder.discountAmount,
        paymentMethod: savedOrder.paymentMethod
      });
    }

    return savedOrder;
  } catch (error) {
    console.error('Error creating order:', error.message);
    throw new Error(error.message);
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
  // Find and update the order, and populate the products field
  const order = await OrderModel.findByIdAndUpdate(
    id,
    { orderStatus },
    { new: true }
  ).populate({
    path: 'products._id',
    select: 'productName general.salePrice', // Select appropriate fields
  });

  // Check if the order was found
  if (!order) {
    throw new Error('Order not found');
  }

  // Prepare SMS details
  const customerName = `${order.firstName} ${order.lastName}`;
  const customerPhone = order.phoneNumber;
  const message = getSMSText(orderStatus, customerName, order);


  // Send SMS to customer
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
 
}
