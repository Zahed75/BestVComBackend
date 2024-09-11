const getSMSText = (orderStatus, customerName, order) => {
  // Format product details
  const formatProductDetails = (products) => {
    if (!Array.isArray(products) || products.length === 0) {
      return 'No products available';
    }
    return products.map(product => {
      const name = product._id?.productName || 'Product Name Not Available';
      const quantity = product.quantity || 'N/A';
      const price = product._id?.general?.salePrice || 'N/A';
      return `${name} (${quantity} x ${price})`;
    }).join(', ');
  };

  const translateOrderStatus = (status) => {
    const statusMap = {
      'Received': 'গ্রহণ করা হয়েছে',
      'Confirmed': 'নিশ্চিত করা হয়েছে',
      'Dispatched': 'প্রেরিত করা হয়েছে',
      'Delivered': 'সরবরাহ করা হয়েছে',
      'On-Hold': 'স্থগিত রাখা হয়েছে',
      'Cancelled': 'বাতিল করা হয়েছে',
      'Spammed': 'স্প্যাম হিসাবে চিহ্নিত করা হয়েছে',
    };
    return statusMap[status] || status;
  };

  // Build the message based on order status
  const message = `সম্মানিত ${customerName},\nআপনার অর্ডার (${order.orderId}) ${translateOrderStatus(orderStatus)} হয়েছে এই বিস্তারিতে:\n${formatProductDetails(order.products)}।\nমোট মূল্য: ${order.totalPrice}, অফার মূল্য: ${order.discountAmount}।\nঅর্ডার অবস্থা: ${translateOrderStatus(orderStatus)}`;

  return message;
};

module.exports = {
  getSMSText
}
