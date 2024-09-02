const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const createToken = require('./createToken');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'tech.syscomatic@gmail.com',
    pass: 'nfkb rcqg wdez ionc',
  },
});

exports.SendEmailUtility = async (EmailTo, EmailText, EmailSubject) => {
  let mailOptions = {
    from: 'BestElectronics-Technologies  <tech.syscomatic@gmail.com>',
    to: EmailTo,
    subject: EmailSubject,
    text: EmailText,
  };

  return new Promise((resolve) => {
    transporter.sendMail(mailOptions, (err, info) => {
      console.log({ info });
      if (err) {
        resolve(err);
      }  
      resolve(info);
    });
  });
};

exports.SendEmailUtilityForAdmin = async (EmailTo, EmailBody, EmailSubject, EmailType = 'TEXT') => {
  let mailOptions = {
    from: 'BestElectronics-Technologies <tech.syscomatic@gmail.com>',
    to: EmailTo,
    subject: EmailSubject,
  };

  if (EmailType === 'HTML') {
    mailOptions.html = EmailBody;  // Set HTML content
  } else {
    mailOptions.text = EmailBody;  // Set text content
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        reject(err);
      } else {
        console.log("Email sent:", info);
        resolve(info);
      }
    });
  });
};

// Function to read HTML template file
const readHTMLFile = (pathToFile) => {
  return new Promise((resolve, reject) => {
    fs.readFile(pathToFile, { encoding: 'utf-8' }, (err, html) => {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
};

// Register custom Handlebars helper
handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

// Function to send order invoice email
exports.sendOrderInvoiceEmail = async (EmailTo, orderData) => {
  try {
    // Read the HTML template file
    const templatePath = path.join(__dirname, '../templates/order.html');
    const htmlTemplate = await readHTMLFile(templatePath);

    // Compile Handlebars template
    const template = handlebars.compile(htmlTemplate);

    // Prepare data to inject into template
    const replacements = {
      orderId: orderData.orderId,
      orderDate: new Date().toLocaleDateString(),  // Example date formatting
      customerName: orderData.firstName + ' ' + orderData.lastName,
      customerEmail: orderData.email,
      deliveryAddress: orderData.deliveryAddress,
      phoneNumber: orderData.phoneNumber,
      products: orderData.products,
      subtotal: orderData.totalPrice - orderData.discountAmount - orderData.deliveryCharge,  // Corrected subtotal calculation
      discount: orderData.discountAmount,
      deliveryCharge: orderData.deliveryCharge,
      vatRate: orderData.vatRate,
      vat: orderData.vat,  // VAT should be directly provided
      total: orderData.totalPrice,
    };

    // Replace placeholders with actual data in the template
    const emailHtml = template(replacements);

    // Setup email options
    const mailOptions = {
      from: 'BestElectronics-Technologies <tech.syscomatic@gmail.com>',
      to: EmailTo,
      subject: 'Your Order Invoice',
      html: emailHtml,
    };

    // Send email using Nodemailer
    const info = await transporter.sendMail(mailOptions);
    console.log('Order invoice email sent:', info);

    return info;
  } catch (error) {
    console.error('Error sending order invoice email:', error);
    throw error;
  }
};


// invoice generate

exports.sendOrderInvoiceEmail = async (EmailTo, orderData, pdfPath = null) => {
  try {
    // Log the order data for debugging
    console.log('Order Data:', orderData);

    // Read the HTML template file
    const templatePath = path.join(__dirname, '../templates/order.html');
    const htmlTemplate = await readHTMLFile(templatePath);

    // Compile Handlebars template
    const template = handlebars.compile(htmlTemplate);

    // Prepare data to inject into the template
    const replacements = {
      orderId: orderData.orderId,
      orderDate: new Date().toLocaleDateString(),  // Format the order date as needed
      customerName: `${orderData.firstName} ${orderData.lastName}`,  // Combine first and last name
      customerEmail: orderData.email,
      deliveryAddress: orderData.deliveryAddress,
      phoneNumber: orderData.phoneNumber,
      products: orderData.products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        total: product.quantity * product.price
      })),
      subtotal: (orderData.totalPrice - orderData.discountAmount - orderData.deliveryCharge).toFixed(2),  // Corrected subtotal calculation
      discount: orderData.discountAmount.toFixed(2),
      deliveryCharge: orderData.deliveryCharge.toFixed(2),
      vatRate: orderData.vatRate.toFixed(2),
      vat: orderData.vat.toFixed(2),  // VAT should be directly provided
      total: orderData.totalPrice.toFixed(2),
    };

    // Log the replacements data for debugging
    console.log('Replacements Data:', replacements);

    // Replace placeholders with actual data in the template
    const emailHtml = template(replacements);

    // Setup email options
    const mailOptions = {
      from: 'BestElectronics-Technologies <tech.syscomatic@gmail.com>',
      to: EmailTo,
      subject: 'Your Order Invoice',
      html: emailHtml,
    };

    // Attach PDF if provided
    if (pdfPath) {
      mailOptions.attachments = [{
        filename: path.basename(pdfPath),
        path: pdfPath
      }];
    }

    // Send email using Nodemailer
    const info = await transporter.sendMail(mailOptions);
    console.log('Order invoice email sent:', info);

    // Remove the PDF file after sending the email
    if (pdfPath) {
      fs.unlinkSync(pdfPath);
    }

    return info;
  } catch (error) {
    console.error('Error sending order invoice email:', error);
    throw error;
  }
};
