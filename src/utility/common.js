const generateOTP = () => {
  let digits = '0123456789';
  let OTP = '';

  // Generate exactly 4 digits for the OTP
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  // If for any reason the OTP is not 4 digits, regenerate it
  if (OTP.length !== 4) {
    return generateOTP();
  }

  return OTP;
};

const asyncHandler = (func) => (req, res, next) => {
  Promise.resolve(func(req, res, next)).catch(next);
};

function convertTo4Digit(number) {
  let numStr = String(number);

  let zerosNeeded = 4 - numStr.length;

  for (let i = 0; i < zerosNeeded; i++) {
    numStr = '0' + numStr;
  }

  return numStr;
}

module.exports = {
  generateOTP,
  asyncHandler,
  convertTo4Digit,
};
