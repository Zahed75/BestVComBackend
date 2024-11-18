const OrderModel = require("../Order/model");
const ProductModel = require("../Products/model");
const CouponModel = require("../Discount/model");
const { BadRequest, NotFound } = require("../../utility/errors");
const CustomerModel = require("../Customer/model");
const {
  generateCustomOrderId,
  formatOrderTime,
} = require("../../utility/customOrder");
const sendSMS = require("../../utility/aamarPayOTP");
const { getSMSText } = require("../../utility/getSMS");
const { sendOrderInvoiceEmail } = require("../../utility/email");
const OutletModel = require("../Outlet/model");
const axios = require("axios");
const puppeteer = require("puppeteer");

const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const { Buffer } = require("buffer");


function calculateOrderValue(products, orderProducts, couponId) {
  return orderProducts.reduce((total, orderProduct) => {
    const product = products.find((p) => p._id.equals(orderProduct._id));
    if (
      product &&
      product.general &&
      orderProduct.quantity &&
      typeof orderProduct.quantity === "number"
    ) {
      const price = couponId
        ? product.general.regularPrice // Use regular price if coupon is applied
        : product.general.salePrice || product.general.regularPrice; // Use sale price if available, else regular price
      if (isNaN(price)) {
        console.warn("Invalid price for product:", product);
        return total;
      }
      console.log(price);
      return total + price * orderProduct.quantity;
    } else {
      console.warn("Invalid product or quantity:", orderProduct);
      return total;
    }
  }, 0);
}

// Define calculateDiscount function
function calculateDiscount(coupon, totalPrice, products, validProducts) {
  if (!coupon) {
    let disc = 0;

    validProducts.forEach((item) => {
      const { regularPrice, salePrice = 0 } = item.general;
      const productQuantity = products.find(
        (pr) => pr._id === item._id.toString()
      ).quantity;
      disc += (regularPrice - salePrice) * productQuantity;
    });

    console.log("Total Discount:", disc);
    return disc; // No coupon, so no discount
  }
  if (coupon?.general?.discountType === "percentage") {
    return (coupon.general.couponAmount / 100) * totalPrice;
  } else if (coupon.general?.discountType === "fixed") {
    return coupon.general.couponAmount;
  } else {
    return 0; // Unknown discount type, so no discount
  }
}

// const createOrder = async (orderData) => {
//   try {
//     // Generate custom orderId and orderTime
//     const orderId = await generateCustomOrderId();
//     const orderTime = formatOrderTime(new Date());
//
//     // Destructure orderData
//     const {
//       email, orderType, deliveryAddress, deliveryCharge = 0,
//       city, area, phoneNumber, paymentMethod, transactionId,
//       products, couponName, firstName, lastName, customerIp,
//       channel, outlet
//     } = orderData;
//
//     // Find the customer by phone number or email
//     const customer = await CustomerModel.findOne({
//       $or: [
//         { email: email || null },
//         { phoneNumber }
//       ]
//     }).lean().exec();
//
//     // If no customer found, throw an error
//     if (!customer) {
//       throw new NotFound('Customer not found');
//     }
//
//     // Try finding the outlet by ID, but proceed if not found
//     const outletData = outlet ? await OutletModel.findById(outlet) : null;
//
//     // Set firstName and lastName from customer if not provided in the request
//     const customerFirstName = firstName || customer.firstName;
//     const customerLastName = lastName || customer.lastName;
//
//     // Use phoneNumber from the request, or fallback to customer's phoneNumber
//     const customerPhoneNumber = phoneNumber || customer.phoneNumber;
//
//     // Validate products
//     if (!Array.isArray(products) || products.length === 0) {
//       throw new BadRequest('No products provided');
//     }
//
//     // Ensure each product has a valid price
//     const productIds = products.map(product => product._id);
//     const validProducts = await ProductModel.find({ _id: { $in: productIds } }).lean().exec();
//
//     if (validProducts.length !== products.length) {
//       throw new BadRequest('Invalid product IDs');
//     }
//
//     // Calculate total price based on valid products
//     const totalPrice = calculateOrderValue(validProducts, products);
//
//     if (!totalPrice || isNaN(totalPrice)) {
//       throw new BadRequest('Invalid total price');
//     }
//
//     // Initialize discount variables
//     let discountAmount = 0;
//     let coupon = null;
//
//     // Apply coupon logic if couponName is provided
//     if (couponName) {
//       coupon = await CouponModel.findOne({ 'general.couponName': couponName }).lean().exec();
//       if (!coupon) throw new BadRequest('Invalid coupon name');
//       if (new Date() > new Date(coupon.general.couponExpiry)) {
//         throw new BadRequest('Coupon has expired');
//       }
//       discountAmount = calculateDiscount(coupon, totalPrice);
//     }
//
//     const validDeliveryCharge = isNaN(deliveryCharge) ? 0 : deliveryCharge;
//     const vatRate = 5;
//     const vat = (vatRate / 100) * totalPrice;
//
//     const finalTotalPrice = totalPrice - discountAmount + validDeliveryCharge;
//
//     // Create new order
//     const newOrder = new OrderModel({
//       orderId,
//       customer: customer._id,
//       firstName: customerFirstName,
//       lastName: customerLastName,
//       orderType,
//       orderTime,
//       deliveryAddress,
//       orderStatus: 'Received',
//       city,
//       area,
//       phoneNumber: customerPhoneNumber,
//       email: email || customer.email,
//       paymentMethod,
//       transactionId,
//       products,
//       coupon: coupon ? coupon._id : null,
//       discountAmount,
//       totalPrice: finalTotalPrice,
//       deliveryCharge: validDeliveryCharge,
//       customerIp,
//       channel,
//       outlet: outletData ? outletData._id : null // Set to null if outlet is not found
//     });
//
//     const savedOrder = await newOrder.save();
//
//     const productInfoForSMS = savedOrder.products.map(product => {
//       const validProduct = validProducts.find(p => p._id.equals(product._id));
//       return {
//         _id: product._id,
//         quantity: product.quantity,
//         productName: validProduct ? validProduct.productName : 'Unnamed Product',
//         productImage: validProduct ? validProduct.productImage : null,
//         regularPrice: validProduct ? validProduct.general.regularPrice : 0,
//         salePrice: validProduct ? validProduct.general.salePrice : 0
//       };
//     });
//
//     const smsText = getSMSText('Received', `${customerFirstName} ${customerLastName}`, {
//       orderId: savedOrder.orderId,
//       products: productInfoForSMS,
//       totalPrice: savedOrder.totalPrice,
//       discountAmount: savedOrder.discountAmount
//     });
//
//     await sendSMS(customerPhoneNumber, smsText);
//
//     if (savedOrder.email) {
//       await sendOrderInvoiceEmail(savedOrder.email, {
//         orderId: savedOrder.orderId,
//         firstName: customerFirstName,
//         paymentMethod,
//         lastName: customerLastName,
//         email: savedOrder.email,
//         deliveryAddress,
//         phoneNumber: customerPhoneNumber,
//         products: productInfoForSMS,
//         totalPrice: totalPrice - discountAmount,
//         discountAmount,
//         deliveryCharge: validDeliveryCharge,
//         vatRate,
//         vat,
//         coupon
//       });
//     }
//
//     return {
//       message: "Order created successfully",
//       createdOrder: {
//         order: {
//           orderId: savedOrder.orderId,
//           customer: savedOrder.customer,
//           customerIp: savedOrder.customerIp,
//           orderType: savedOrder.orderType,
//           firstName: savedOrder.firstName,
//           lastName: savedOrder.lastName,
//           orderStatus: savedOrder.orderStatus,
//           deliveryAddress: savedOrder.deliveryAddress,
//           deliveryCharge: savedOrder.deliveryCharge,
//           email: savedOrder.email,
//           city: savedOrder.city,
//           area: savedOrder.area,
//           phoneNumber: savedOrder.phoneNumber,
//           paymentMethod: savedOrder.paymentMethod,
//           products: productInfoForSMS,
//           coupon: savedOrder.coupon ? savedOrder.coupon : null,
//           discountAmount: savedOrder.discountAmount,
//           totalPrice: savedOrder.totalPrice,
//           orderNote: savedOrder.orderNote,
//           channel: savedOrder.channel,
//           outlet: savedOrder.outlet,
//           orderLogs: savedOrder.orderLogs,
//           createdAt: savedOrder.createdAt,
//           updatedAt: savedOrder.updatedAt,
//           __v: savedOrder.__v
//         },
//         customerEmail: savedOrder.email,
//         totalOrderValue: savedOrder.totalPrice,
//         couponName: couponName || null
//       }
//     };
//
//   } catch (error) {
//     console.error("Error creating order:", error);
//     throw error;
//   }
// };





const generatePDFInvoice = (orderDetails) => {
  console.log(orderDetails);
  return new Promise(async (resolve, reject) => {
    try {
      // Launch a new browser instance
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],

    });
      const page = await browser.newPage();

      // Define the HTML content template with placeholders for order details
      const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 40px;
      }

      .text-4xl {
        font-size: 30px;
        line-height: 0px;
      }
      p {
        line-height: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 15px;
        text-align: left;
      }
      th,
      td {
        padding: 12px;
        border: 1px solid #ddd;
      }
      th {
        background-color: #f4f4f4;
        color: #333;
        font-weight: bold;
      }
      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
    </style>
  </head>
  <body>
    <div>
    		<img src="https://www.bestelectronics.com.bd/wp-content/uploads/2022/07/Best-Electronics-PNG.png" style="width: 200px;"></img>
        <p>Address: Level 16, 90/1, City Centre, 1000 Motijheel Rd, Dhaka 1000</p>
<hr></hr>
      <p>${orderDetails?.orderTime}</p>
      <p class="text-4xl"><strong>Order ID:</strong> #${
        orderDetails?.orderId || "N/A"
      }</p>
	  <p style="font-size: 18px;font-weight: 500; margin-top: 50px;">Customer Details:</p>
	  <div style="display: flex; flex-direction: column;; gap: 0px;">
		<div style="padding: 10px; border: 1px solid #ddd; background: #f4f4f4;">
			<p><strong>Name:</strong> ${
        orderDetails?.firstName + " " + orderDetails?.lastName || "N/A"
      }</p>
		<p><strong>Phone:</strong> ${orderDetails?.phoneNumber || "N/A"}</p>
		<p><strong>Address:</strong> ${orderDetails?.customerAddress || "N/A"}</p>
		<p><strong>City:</strong> ${orderDetails?.customerCity || "N/A"}</p>

	</div>
	<p style="font-size: 18px;font-weight: 500;">Order Summary:</p>

	  <div style="padding: 10px; border: 1px solid #ddd; background: #f4f4f4;">

    <p><strong>Order Status:</strong> ${
      `<span style="background-color: #D67229; padding:3px; border-radius: 5px; color: #ffffff">${orderDetails?.orderStatus}</span>` || "N/A"
    }</p>
		  <p><strong>Delivery Address:</strong> ${
        orderDetails?.deliveryAddress || "N/A"
      }</p>
		  <p><strong>Order Type:</strong> ${orderDetails?.orderType || "N/A"}</p>
		  <p><strong>Payment Method:</strong> ${
        orderDetails?.paymentMethod || "N/A"
      }</p>
		  <p><strong>Transaction Id:</strong> ${
        orderDetails?.transactionId || "N/A"
      }</p>
		</div>

	</div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Quantity</th>
            <th>Regular Price</th>
            <th>Sale Price</th>
          </tr>
        </thead>
        <tbody>
        ${
          orderDetails?.products
            ?.map(
              (item) => `
          <tr>
            <td>${item?.productName || "N/A"}</td>
            <td>${item?.sku || "N/A"}</td>
            <td>${item?.quantity || "N/A"}</td>
            <td>${item?.regularPrice || "N/A"}</td>
            <td>${item?.salePrice || "N/A"}</td>
          </tr>
        `
            )
            .join("") || '<tr><td colspan="4">No products available</td></tr>'
        }
        </tbody>
      </table>
      <div style="display: flex; justify-content: right">
        <div
          style="
            display: flex;
            gap: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
          "
        >
          <div>
            <p><strong>Delivery Charge:</strong></p>
            <p><strong>Discount Amount ${
              orderDetails?.couponCode && ` (${orderDetails?.couponCode})`
            }:</strong> </p>
            <p><strong>VAT:</strong></p>
            <p><strong>Total Price:</strong></p>
          </div>
          <div>
            <p>${orderDetails?.deliveryCharge || "N/A"}</p>
            <p>${orderDetails?.discountAmount || "N/A"}</p>
            <p>5% (inclusive)</p>
            <p>${orderDetails?.totalPrice || "N/A"}</p>
          </div>
        </div>
      </div>
      <div style="margin-top: 50px">
        <p style="font-weight: 600">Important Information About Your Order</p>
        <p style="line-height: 20px">In the event that a product is exchanged in store, the exchange receipt issued will be your new proof of purchase.</p>
        <p>Thank you. Please retain this invoice as proof of your purchase.</p>
      </div>
    </div>
  </body>
</html>
`;

      // Set HTML content to the page
      await page.setContent(htmlContent, { waitUntil: "load" });

      // Generate the PDF as a buffer
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      // Close the browser
      await browser.close();

      // Resolve the PDF buffer to be used in an email
      resolve(pdfBuffer);
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to send email with invoice attachment
const sendInvoiceEmail = async (to, subject, orderDetails, pdfBuffer) => {
  const transporter = nodemailer.createTransport({
    // Configure your SMTP transport here
    service: "Gmail", // Example using Gmail, change it according to your needs
    auth: {
      user: "tech.syscomatic@gmail.com", // Your email
      pass: "nfkb rcqg wdez ionc", // Your email password
    },
  });

  const mailOptions = {
    from: "tech.syscomatic@gmail.com",
    to,
    subject,
    text: `Thank you for your order! Your order ID is ${orderDetails.orderId}. Please find the invoice attached.`,
    attachments: [
      {
        filename: `invoice-${orderDetails.orderId}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

// Main createOrder function
const createOrder = async (orderData) => {
  try {
    // Generate custom orderId and orderTime
    const orderId = await generateCustomOrderId();
    const orderTime = formatOrderTime(new Date());

    // Destructure orderData
    const {
      email,
      orderType,
      deliveryAddress,
      deliveryCharge = 0,
      city,
      area,
      phoneNumber,
      paymentMethod,
      transactionId,
      products,
      couponName,
      firstName,
      lastName,
      customerIp,
      channel,
      outlet,
    } = orderData;

    // Find the customer by phone number or email
    const customer = await CustomerModel.findOne({
      $or: [{ email: email || null }, { phoneNumber }],
    })
      .lean()
      .exec();
    console.log(customer);
    // If no customer found, throw an error
    if (!customer) {
      throw new NotFound("Customer not found");
    }

    // Try finding the outlet by ID, but proceed if not found
    const outletData = outlet ? await OutletModel.findById(outlet) : null;

    // Set firstName and lastName from customer if not provided in the request
    const customerFirstName = firstName || customer.firstName;
    const customerLastName = lastName || customer.lastName;

    // Use phoneNumber from the request, or fallback to customer's phoneNumber
    const customerPhoneNumber = phoneNumber || customer.phoneNumber;

    // Validate products
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequest("No products provided");
    }

    // Ensure each product has a valid price
    const productIds = products.map((product) => product._id);
    const validProducts = await ProductModel.find({ _id: { $in: productIds } })
      .lean()
      .exec();

    if (validProducts.length !== products.length) {
      throw new BadRequest("Invalid product IDs");
    }

    // Calculate total price based on valid products
    let coupon =
      couponName &&
      (await CouponModel.findOne({ "general.couponName": couponName })
        .lean()
        .exec());

    const totalPrice = calculateOrderValue(
      validProducts,
      products,
      coupon?._id
    );
    if (!totalPrice || isNaN(totalPrice)) {
      throw new BadRequest("Invalid total price");
    }

    // Initialize discount variables
    let discountAmount = 0;

    // Apply coupon logic if couponName is provided
    if (couponName) {
      if (!coupon) throw new BadRequest("Invalid coupon name");
      if (new Date() > new Date(coupon.general.couponExpiry)) {
        throw new BadRequest("Coupon has expired");
      }
      discountAmount = calculateDiscount(coupon, totalPrice);
    }

    const validDeliveryCharge = isNaN(deliveryCharge) ? 0 : deliveryCharge;
    const vatRate = 5;
    const vat = (vatRate / 100) * totalPrice;

    const finalTotalPrice = totalPrice - discountAmount + validDeliveryCharge;

    // Create new order
    const newOrder = new OrderModel({
      orderId,
      customer: customer._id,
      firstName: customerFirstName,
      lastName: customerLastName,
      orderType,
      orderTime,
      deliveryAddress,
      orderStatus: "Received",
      city,
      area,
      phoneNumber: customerPhoneNumber,
      email: email || customer.email,
      paymentMethod,
      transactionId,
      products,
      coupon: coupon ? coupon._id : null,
      discountAmount,
      totalPrice: finalTotalPrice,
      deliveryCharge: validDeliveryCharge,
      customerIp,
      channel,
      outlet: outletData ? outletData._id : null, // Set to null if outlet is not found
    });
    const savedOrder = await newOrder.save();
    console.log(validProducts);
    const productInfoForSMS = savedOrder.products.map((product) => {
      const validProduct = validProducts.find((p) => p._id.equals(product._id));
      return {
        _id: product._id,
        quantity: product.quantity,
        productName: validProduct
          ? validProduct.productName
          : "Unnamed Product",
        productImage: validProduct ? validProduct.productImage : null,
        regularPrice: validProduct ? validProduct.general.regularPrice : 0,
        salePrice: validProduct ? validProduct.general.salePrice : 0,
        sku: validProduct ? validProduct?.inventory?.sku : null,
      };
    });

    const smsText = getSMSText(
      "Received",
      `${customerFirstName} ${customerLastName}`,
      {
        orderId: savedOrder.orderId,
        products: productInfoForSMS,
        totalPrice: savedOrder.totalPrice,
        discountAmount: savedOrder.discountAmount,
      }
    );

    await sendSMS(customerPhoneNumber, smsText);

    // Generate PDF Invoice
    const pdfInvoice = await generatePDFInvoice({
      orderId: savedOrder.orderId,
      firstName: customerFirstName,
      lastName: customerLastName,
      email: savedOrder.email,
      deliveryAddress,
      phoneNumber: customerPhoneNumber,
      products: productInfoForSMS,
      totalPrice: finalTotalPrice, // Use finalTotalPrice for invoice
      discountAmount,
      deliveryCharge: validDeliveryCharge,
      vatRate,
      vat,
      coupon,
      paymentMethod,
      orderTime,
      transactionId,
      couponCode: coupon?.general?.couponName,
      orderType,
      customerAddress: customer?.address,
      customerCity: customer?.city,
      orderStatus: savedOrder?.orderStatus
    });

    // Send invoice email
    await sendInvoiceEmail(
      savedOrder.email,
      `Your Invoice for Order ${savedOrder.orderId}`,
      {
        orderId: savedOrder.orderId,
        firstName: customerFirstName,
        lastName: customerLastName,
        email: savedOrder.email,
        deliveryAddress,
        phoneNumber: customerPhoneNumber,
        products: productInfoForSMS,
        totalPrice: finalTotalPrice,
        discountAmount,
        deliveryCharge: validDeliveryCharge,
        vatRate,
        vat,
        coupon,
      },
      pdfInvoice
    );

    return {
      message: "Order created successfully",
      createdOrder: {
        order: {
          _id: savedOrder?._id,
          orderId: savedOrder.orderId,
          customer: savedOrder.customer,
          customerIp: savedOrder.customerIp,
          orderType: savedOrder.orderType,
          firstName: savedOrder.firstName,
          lastName: savedOrder.lastName,
          orderStatus: savedOrder.orderStatus,
          deliveryAddress: savedOrder.deliveryAddress,
          deliveryCharge: savedOrder.deliveryCharge,
          email: savedOrder.email,
          city: savedOrder.city,
          area: savedOrder.area,
          phoneNumber: savedOrder.phoneNumber,
          paymentMethod: savedOrder.paymentMethod,
          products: productInfoForSMS,
          coupon: savedOrder.coupon ? savedOrder.coupon : null,
          discountAmount: savedOrder.discountAmount,
          totalPrice: savedOrder.totalPrice,
          orderNote: savedOrder.orderNote,
          channel: savedOrder.channel,
          outlet: savedOrder.outlet,
          orderLogs: savedOrder.orderLogs,
          createdAt: savedOrder.createdAt,
          updatedAt: savedOrder.updatedAt,
          __v: savedOrder.__v,
        },
        customerEmail: savedOrder.email,
        totalOrderValue: savedOrder.totalPrice,
        couponName: couponName || null,
      },
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};










//updateOrderByOrder ID

const updateOrder = async (orderId, orderData) => {
  const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, orderData, {
    new: true,
  });
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
    const orders = await OrderModel.find()
      .populate({
        path: "products._id",
        model: "Product",
        select:
          "productName productImage general.regularPrice inventory.sku general.salePrice",
      })
      .populate({
        path: "customer",
        model: "Customer", // Ensure this matches the model name
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
                  totalPrice:
                    productDetails.general.salePrice * productItem.quantity,
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
    path: "products._id",
    select: "productName general.salePrice", // Select appropriate fields
  });

  // Check if the order was found
  if (!order) {
    throw new Error("Order not found");
  }
  const customer = await CustomerModel.findById(order?.customer).lean().exec();
  // Prepare SMS details
  const customerName = `${order.firstName} ${order.lastName}`;
  const customerPhone = order.phoneNumber;
  const customerFirstName = customer.firstName || "";
  const customerLastName = customer.lastName || "";
  const productIds = order?.products?.map((product) => product._id);
  const validProducts = await ProductModel.find({
    _id: { $in: productIds.map((item) => item._id) },
  })
    .lean()
    .exec();
  const productInfoForSMS = order.products.map((product) => {
    const validProduct = validProducts.find((p) =>
      p._id.equals(product._id._id)
    );
    console.log("test", validProduct);
    return {
      _id: product._id,
      quantity: product.quantity,
      productName: validProduct ? validProduct.productName : "Unnamed Product",
      productImage: validProduct ? validProduct.productImage : null,
      regularPrice: validProduct ? validProduct.general.regularPrice : 0,
      salePrice: validProduct ? validProduct.general.salePrice : 0,
      sku: validProduct ? validProduct?.inventory?.sku : null,
    };
  });
  let coupon =
    order?.coupon?._id &&
    (await CouponModel.findOne({ "general._id": order?.coupon?._id })
      .lean()
      .exec());
  const vatRate = 5;
  const totalPrice = order?.totalPrice;
  const vat = (vatRate / 100) * totalPrice;
  // Use phoneNumber from the request, or fallback to customer's phoneNumber
  const message = getSMSText(orderStatus, customerName, order);

  // Send SMS to customer
  await sendSMS(customerPhone, message);
  // Generate PDF Invoice
  const pdfInvoice = await generatePDFInvoice({
    orderId: order.orderId,
    firstName: customerFirstName,
    lastName: customerLastName,
    email: order.email,
    deliveryAddress: order?.deliveryAddress,
    phoneNumber: customerPhone,
    products: productInfoForSMS,
    totalPrice: order?.totalPrice, // Use finalTotalPrice for invoice
    discountAmount: order?.discountAmount,
    deliveryCharge: order?.deliveryCharge,
    vatRate,
    vat,
    coupon: coupon,
    paymentMethod: order?.paymentMethod,
    orderTime: formatOrderTime(order?.createdAt),
    transactionId: order?.transactionId,
    couponCode: coupon?.general?.couponName,
    orderType: order?.orderType,
    customerAddress: customer?.address,
    customerCity: customer?.city,
    orderStatus: order?.orderStatus
  });

  // Send invoice email
  await sendInvoiceEmail(
    order?.email,
    `Your Invoice for Order ${order.orderId}`,
    {
      orderId: order.orderId,
      firstName: customerFirstName,
      lastName: customerLastName,
      email: order.email,
      deliveryAddress: order?.deliveryAddress,
      phoneNumber: customerPhone,
      products: productInfoForSMS,
      totalPrice: order?.totalPrice, // Use finalTotalPrice for invoice
      discountAmount: order?.discountAmount,
      deliveryCharge: order?.deliveryCharge,
      vatRate,
      vat,
      coupon: coupon,
    },
    pdfInvoice
  );
  return order;
};

const getOrderById = async (id) => {
  try {
    const orderInfo = await OrderModel.findById(id)
      .populate({
        path: "products._id",
        model: "Product",
        select:
          "productName productImage general.regularPrice inventory.sku general.salePrice",
      })
      .populate({
        path: "customer",
        model: "Customer",
        select: "firstName lastName email phoneNumber district address",
      });

    if (!orderInfo) {
      throw new NotFound("Order not found");
    }

    const formattedOrder = {
      ...orderInfo.toObject(),
      products: orderInfo.products.map((productItem) => {
        const productDetails = productItem._id;
        if (!productDetails) {
          console.warn("Product not found:", productItem);
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
      customer: orderInfo.customer
        ? {
            _id: orderInfo.customer._id,
            firstName: orderInfo.customer.firstName,
            lastName: orderInfo.customer.lastName,
            email: orderInfo.customer.email,
            phoneNumber: orderInfo.customer.phoneNumber,
            district: orderInfo.customer.district,
            address: orderInfo.customer.address,
          }
        : null,
    };

    return { success: true, order: formattedOrder };
  } catch (error) {
    console.error("Error in getOrderById:", error.message);
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
    console.error("Error in getCustomerHistory:", error.message);
    throw error;
  }
};

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
      throw new Error("Order not found");
    }

    return updatedOrder;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getOrderHistoryByCustomerId = async (customerId) => {
  try {
    const orders = await OrderModel.find({ customer: customerId })
      .populate("products._id", "productName productImage general") // Adjust the path based on your Product schema
      .exec();

    if (!orders || orders.length === 0) {
      throw new Error("No orders found for this customer");
    }

    const customer = await CustomerModel.findById(customerId).exec();
    if (!customer) {
      throw new Error("Customer not found");
    }

    const billingInfo = customer.billingInfo;

    const orderHistory = orders.map((order) => {
      const products = order.products.map((product) => {
        if (product._id) {
          const regularPrice = product._id.general.regularPrice || 0;
          const productPrice = product._id.general.salePrice || regularPrice;
          return {
            _id: product._id._id, // Include the product's default _id
            productName: product._id.productName,
            productImage: product._id.productImage,
            quantity: product.quantity,
            productPrice: productPrice * product.quantity,
            regularPrice: regularPrice * product.quantity,
          };
        }
        return {
          _id: product._id ? product._id._id : null, // Handle case if _id is missing
          productName: "Product not found",
          productImage: "image not available",
          quantity: product.quantity,
          productPrice: 0,
          regularPrice: 0,
        };
      });

      const total = products.reduce(
        (acc, product) => acc + product.productPrice,
        0
      );
      const regularTotal = products.reduce(
        (acc, product) => acc + product.regularPrice,
        0
      );
      const discount = regularTotal - total;
      const VAT = total * 0.15; // Assuming VAT is 15%
      const subtotal = total + VAT;

      return {
        _id: order._id, // Include the order's default _id
        orderId: order.orderId,
        date: order.createdAt,
        status: order.orderStatus,
        total,
        subtotal,
        discount,
        VAT,
        products,
        paymentMethod: order.paymentMethod,
        billingDetails: billingInfo
          ? {
              firstName: billingInfo.firstName,
              lastName: billingInfo.lastName,
              fullAddress: billingInfo.fullAddress,
              phoneNumber: billingInfo.phoneNumber,
              email: billingInfo.email,
              zipCode: billingInfo.zipCode,
              district: billingInfo.district,
            }
          : null,
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
};
