const moment = require('moment');
const OrderModel = require('../modules/Order/model'); // Adjust the path to your Order model

// Generate a custom order ID
const generateCustomOrderId = async () => {
  let unique = false;
  let orderId;

  while (!unique) {
    const currentDate = moment().format('YYYYMMDD');
    const randomNumber = Math.floor(Math.random() * 10000) + 1; // Increased range for better uniqueness
    orderId = `BEL-${currentDate}-${randomNumber}`;

    // Check if orderId already exists in the database
    const existingOrder = await OrderModel.findOne({ orderId });
    if (!existingOrder) {
      unique = true;
    }
  }

  return orderId;
};

// Format the order time
const formatOrderTime = (date) => {
  return moment(date).format('MMM DD, YYYY HH:mm:ss');
};

module.exports = {
  generateCustomOrderId,
  formatOrderTime
};
