const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const CustomerSchema = new mongoose.Schema({
  email: {
    type: String
  },
  firstName: {
    type: String,
    max: [15, "FirstName should be at most 15 characters"],
    required: [true, "FirstName is required"]
  },
  phoneNumber: {
    type: String,
    max: [13, "Phone Number should be at most 13 characters"],
    required: [true, "Please enter a valid phone number"],
    unique: true
  },
  lastName: {
    type: String,
    max: [12, "LastName should be at most 12 characters"]
  },
  city: {
    type: String,
    max: [200, "City should be at most 200 characters"]
  },
  profilePicture: {
    type: String,
  },
  userName: {
    type: String,
    max: [15, "UserName should be at most 15 characters"],
    default: ""
  },
  changedPhoneNumber: {
    type: String,
    max: [14, "Changed Phone Number should be at most 14 characters"],
  },
  isValid: {
    type: Boolean,
    default: false
  },
  otp: {
    type: Number
  },
  password: {
    type: String,
  },
  address: {
    type: String,
    max: [120, "Address should be at most 120 characters"],
  },
  zipCode: {
    type: String,
    max: [12, 'Zip Code should be at most 12 characters']
  },
  isActive: {
    type: Boolean
  },
  isVerified: {
    type: Boolean
  },
  refreshToken: [String],
  wishList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  billingInfo: {
    district: {
      type: String,
      max: [45, "District should be at most 45 characters"],
    },
    firstName: {
      type: String,
      max: [15, "FirstName should be at most 15 characters"],
    },
    lastName: {
      type: String,
      max: [12, "LastName should be at most 12 characters"]
    },
    fullAddress: {
      type: String,
      max: [220, "Full Address should be at most 220 characters"]
    },
    phoneNumber: {
      type: String,
      max: [13, "Phone Number should be at most 13 characters"],
    },
    email: {
      type: String,
    },
    zipCode: {
      type: String,
      max: [12, 'Zip Code should be at most 12 characters']
    }
  },
  shippingInfo: {
    district: {
      type: String,
      max: [45, "District should be at most 45 characters"],
    },
    firstName: {
      type: String,
      max: [15, "FirstName should be at most 15 characters"],
    },
    lastName: {
      type: String,
      max: [12, "LastName should be at most 12 characters"]
    },
    fullAddress: {
      type: String,
      max: [220, "Full Address should be at most 220 characters"]
    },
    phoneNumber: {
      type: String,
      max: [13, "Phone Number should be at most 13 characters"],
    },
    email: {
      type: String,
    },
    zipCode: {
      type: String,
      max: [12, 'Zip Code should be at most 12 characters']
    }
  }
});

// Password Hash Function using Bcryptjs
CustomerSchema.pre('save', async function hashPassword(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

CustomerSchema.methods = {
  async authenticate(password) {
    return await bcrypt.compare(password, this.password);
  },
};

// Validations
CustomerSchema.path('phoneNumber').validate(function (value) {
  const regex = /^\d{13}$/; // regular expression to match 13 digits
  return regex.test(value);
}, "Please enter a valid Phone Number");

const CustomerModel = mongoose.model('customer', CustomerSchema);

module.exports = CustomerModel;
