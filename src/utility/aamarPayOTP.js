const axios = require('axios');

const sendSMS = async (receiver, message) => {
  try {
    const response = await axios.post('https://sysadmin.muthobarta.com/api/v1/send-sms', {
      // receiver: receiver,
      receiver: receiver,
      message: message,
      remove_duplicate: true
    }, {
      headers: {
        'Authorization': `Token dbf5ae53b49fdf65ac01f09ef7385686ac42ea4d`
      }
    });
   
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw new Error('Failed to send SMS');
  }
};

module.exports = sendSMS;
