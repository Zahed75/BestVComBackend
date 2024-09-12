const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const createToken = require('./createToken');

const EmailTemplateModel = require('../../src/modules/Email/model'); // Adjust the path as necessary
const emailService = require('../modules/Email/service');
const {sendEmail} = require("../modules/Email/service");

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







// send Email Invoice
exports.sendOrderInvoiceEmail = async (EmailTo, orderData, pdfPath = null) => {
  try {
    // Validate the EmailTo field (ensure it's a string)
    if (!EmailTo || typeof EmailTo !== 'string') {
      throw new Error('Recipient email (EmailTo) is not defined or invalid.');
    }

    // Fetch the email template for new orders
    const template = await EmailTemplateModel.findOne({ status: 'new_order', enable: true }).exec();

    // Fallback content if template is not found
    const defaultSubject = 'Order Confirmation';
    const defaultEmailHeading = 'Thank you for your order!';
    const defaultBaseColor = '#FF6600';
    const defaultBodyBackgroundColor = '#F5F5F5';
    const defaultBodyTextColor = '#333';
    const defaultFromName = 'Your Company';
    const defaultFromAddress = 'no-reply@yourcompany.com';

    if (!template) {
      console.warn('Email template for new orders not found. Using default template.');
    }

    // Use template data if available, else fallback to default values
    const { subject, emailHeading, headerImage, baseColor, bodyBackgroundColor, bodyTextColor, footerText, fromName, fromAddress } = template || {
      subject: defaultSubject,
      emailHeading: defaultEmailHeading,
      baseColor: defaultBaseColor,
      bodyBackgroundColor: defaultBodyBackgroundColor,
      bodyTextColor: defaultBodyTextColor,
      fromName: defaultFromName,
      fromAddress: defaultFromAddress
    };

    // Ensure that all numeric fields in orderData are properly handled
    const totalPrice = orderData.totalPrice || 0;
    const discountAmount = orderData.discountAmount || 0;
    const deliveryCharge = orderData.deliveryCharge || 0;
    const vat = orderData.vat || 0;
    const vatRate = orderData.vatRate || 0;

    // Prepare the email content
    const htmlContent = `
      <html>
      <body style="font-family: Arial, sans-serif; color: ${bodyTextColor}; background-color: ${bodyBackgroundColor};">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; background-color: #fff;">
          <h1 style="color: ${baseColor};">${emailHeading}</h1>
          <p>Thank you for your purchase!</p>
          ${headerImage ? `<img src="${headerImage}" alt="Header Image" style="max-width: 100%; height: auto;"/>` : ''}

          <h2 style="color: ${baseColor};">Order Information</h2>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Total Cost:</strong> ${totalPrice.toFixed(2)} BDT</p>
          <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
          
          <h3 style="color: ${baseColor};">Items:</h3>
          <ul>
            ${orderData.products.map(product => `
              <li>
                <strong>${product.name || 'Unknown Product'}</strong> - 
                ${product.quantity} x ${product.price ? product.price.toFixed(2) + ' BDT' : 'N/A'}
              </li>
            `).join('')}
          </ul>

          <p><strong>Discount Amount:</strong> ${discountAmount.toFixed(2)} BDT</p>
          <p><strong>Delivery Charge:</strong> ${deliveryCharge.toFixed(2)} BDT</p>
          <p><strong>VAT (${vatRate}%):</strong> ${vat.toFixed(2)} BDT</p>

          ${footerText ? `<p style="color: #888;">${footerText}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    // Send the email to the customer
    await sendEmail({
      to: EmailTo,  // Single customer email
      from: `${fromName} <${fromAddress}>`,
      subject: subject,
      html: htmlContent
    });

    console.log('Order invoice email sent successfully to:', EmailTo);

  } catch (error) {
    console.error("Error sending order invoice email:", error.message || error);
    throw error;
  }
};
