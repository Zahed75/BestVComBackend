const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

const generateInvoicePDF = async (orderDetails) => {
  const { 
    orderId, firstName, lastName, email, deliveryAddress, phoneNumber, 
    products, totalPrice, discountAmount, deliveryCharge, vatRate, vat,
    termsConditions // Include termsConditions in the destructuring
  } = orderDetails;

  const invoiceDate = new Date().toISOString().split('T')[0];

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14); // Example: due in 14 days
  const dueDateString = dueDate.toISOString().split('T')[0];

  // Update the path to match the location of invoice-1.html
  const templatePath = path.join(__dirname, '../../public/main/invoice-1.ejs'); // Adjust path if needed

  try {
    // Read the HTML template
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders with actual data
    const html = htmlTemplate
      .replace(/<%= customerName %>/g, `${firstName} ${lastName}`)
      .replace(/<%= deliveryAddress %>/g, deliveryAddress)
      .replace(/<%= email %>/g, email)
      .replace(/<%= phoneNumber %>/g, phoneNumber)
      .replace(/<%= orderId %>/g, orderId)
      .replace(/<%= invoiceDate %>/g, invoiceDate)
      .replace(/<%= dueDate %>/g, dueDateString)
      .replace(/<%= subtotal %>/g, products.reduce((acc, product) => acc + (product.price * product.quantity), 0).toFixed(2))
      .replace(/<%= discountAmount %>/g, discountAmount.toFixed(2))
      .replace(/<%= deliveryCharge %>/g, deliveryCharge.toFixed(2))
      .replace(/<%= vatRate %>/g, vatRate.toFixed(2))
      .replace(/<%= vat %>/g, vat.toFixed(2))
      .replace(/<%= totalPrice %>/g, totalPrice.toFixed(2))
      .replace(/<%= companyName %>/g, 'Best Electronics Ltd')
      .replace(/<%= companyAddress %>/g, '123 Electronics Street, Tech City')
      .replace(/<%= companyEmail %>/g, 'contact@bestelectronics.com')
      .replace(/<%= companyPhone %>/g, '123-456-7890')
      .replace(/<%= termsConditions %>/g, termsConditions);

    const pdfOptions = {
      format: 'A4',
      orientation: 'portrait', // or 'landscape' depending on your needs
      border: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      type: 'pdf',
      quality: 'high',
      zoomFactor: 1.0 // Adjust if needed
    };

    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    // Ensure the invoices directory exists
    const invoicesDir = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const pdfPath = path.join(invoicesDir, `${orderId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    return pdfPath;
  } catch (error) {
    console.error("Error generating PDF:", error.message);
    console.error("Error details:", error);
    throw error;
  }
};

module.exports = {
  generateInvoicePDF
};
