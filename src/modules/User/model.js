const bcrypt = require('bcryptjs');
const { required } = require('joi');
const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({

  email: {
    type: String,
    unique: [true, 'your email must be unique/used already'],
    required: [true, 'email must be required'],
  },

  outlet: {
    type: String,
  },

  firstName: {
    type: String,
    max: [20, "Name should be at least 20 "]
  },

  lastName: {
    type: String,
    max: [20, "Name should be at least 20 "]
  },

  phoneNumber: {
    type: String,
    max: [12, 'Please Input Your Number'],
    required: [true, "Must be input Phone Number"]
  },

  password: {
    type: String,
    max: [6, 'Your Password must be in 6 digits'],

  },
  otp: {
    type: Number,
  },
  otpExpiry: {
    type: Date,
  },
  emailChangeOTP: {
    type: Number,
  },

  changedEmail: {
    type: String,
  },

  role: {
    type: String,
    // HEAD_OFFICE:'HQ',
    // BRANCH_ADMIN:'BA',
    // CUSTOMER: 'CUS',
    // ADMIN : AD
    // MGR : Manager

    enum: ['HQ', 'BA', 'CUS', 'AD', 'MGR'],
    require: [true, 'Role must be selected'],
  },

  isActive: {
    type: Boolean,
    default: false,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
  refreshToken: [String],
  profilePicture: {
    type: String
  }

}, { timestamps: true }
);

// Password Hash Function using Bycryptjs

// Password Hash Function using Bycryptjs

UserSchema.pre('save', async function hashPassword(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods = {
  async authenticate(password) {
    return await bcrypt.compare(password, this.password);
  },
};

//Validations
//Validations
UserSchema.path('phoneNumber').validate(function (value) {
  const regex = /^\d{13}$/; // regular expression to match 11 digits
  return regex.test(value);
}, 'Must be a valid phone number');

const UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;
