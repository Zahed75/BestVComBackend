// // index.js

// const generatePDF = require('./src/generatePDF');

// // Example order details (replace with your actual data retrieval logic)
// const orderDetails = {
//   orderId: 'BEL-20240703-4755',
//   orderDate: '7/3/2024',
//   customerName: 'Zahed Hasan',
//   deliveryAddress: '123 Street, City',
//   products: [
//     { name: 'DynaCool 200 Ton Ac', quantity: 2, price: 50003, total: 100006 },
//     { name: 'DynaCool 2.5 Ton Ac', quantity: 1, price: 70000, total: 70000 }
//   ],
//   subtotal: 195501.9,
//   discount: 0,
//   deliveryCharge: 10,
//   vat: 29327.535,
//   total: 195516.9
// };

// // Generate PDF invoice
// const outputPath = './invoices/BEL-20240703-4755.pdf'; // Replace with your desired output path
// generatePDF(outputPath, orderDetails)
//   .then(() => console.log('PDF generation complete.'))
//   .catch(err => console.error('Error generating PDF:', err));
