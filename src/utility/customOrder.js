const moment = require('moment');

// Generate a custom order ID
const generateCustomOrderId = () => {
  const currentDate = moment().format('YYYYMMDD');
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  return `BEL-${currentDate}-${randomNumber}`;
};

// Format the order time
const formatOrderTime = (date) => {
  return moment(date).format('MMM DD, YYYY HH:mm:ss');
};

module.exports = {
  generateCustomOrderId,
  formatOrderTime
};
