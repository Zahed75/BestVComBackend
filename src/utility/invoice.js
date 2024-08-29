const EasyInvoice = require('easyinvoice');
const path = require('path');
const fs = require('fs');

const generateInvoicePDF = async (order, customer) => {
  // Define invoice data
  const invoiceData = {
    "sender": {
      "company": "Best Electronics Ltd",
      "address": "City Center, 1000 Motijheel Road, Dhaka",
      "zip": "1000",
      "city": "Dhaka",
      "country": "Bangladesh",
      "logo": "https://drive.google.com/uc?export=view&id=1iA534h7YVE_a8R7aaJqM762t5fbwZQCV",
      "phone": "09606-111777"
    },
    "client": {
      "company": `${customer.firstName} ${customer.lastName}`,
      "email": customer.email,
      "address": customer.address,
      "zip": customer.zipCode,
      "city": customer.city,
      "country": "Bangladesh"
    },
    "information": {
      "Order Id": order.orderId,
      "date": order.orderTime,
      "due-date": order.orderTime
    },
    "products": order.products.map(product => ({
      "quantity": product.quantity,
      "description": product.name,
      "tax-rate": 0,
      "price": product.price
    })),
    "bottom-notice": "Thank you for your business!",
    "settings": {
      "currency": "BDT",
      "tax-notation": "vat"
    },
    "translate": {
      "invoice": "Invoice",
      "number": "Number",
      "date": "Date",
      "due-date": "Due Date"
    },
    "additionalInfo": {
      "paymentMethod": order.paymentMethod || "N/A",
      "shippingMethod": order.shippingMethod || "N/A",
      "trackingNumber": order.trackingNumber || "N/A",
      "deliveryCharge": order.deliveryCharge || 0,
      "discount": order.discountAmount || 0,
      "subtotal": order.totalPrice - order.discountAmount - order.deliveryCharge
    }
  };

  // Generate PDF
  const result = await EasyInvoice.createInvoice(invoiceData);

  // Save the PDF to a file
  const filePath = path.join(__dirname, '../invoices/invoice.pdf');
  fs.writeFileSync(filePath, result.pdf, 'base64');

  return filePath;
};

module.exports = {
  generateInvoicePDF
};
