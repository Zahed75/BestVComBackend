const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  customer: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'customer'
  },
  orderType: {
    type: String,
    enum: ["Delivery", "Pickup", "Online"],
    required: true
  },
  orderStatus: {
    type: String,
    enum: [
      'Order Received', 
      'Order Confirmed', 
      'Order Dispatched',
      'Order Delivered',
      'Order On-Hold',
      'Order Cancelled',
      'Order Spammed'
    ],
    default: "Order Received"
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryCharge: {
    type: Number,
  },
  district: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  transactionId: String,
  products: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  coupon: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon"
    }
  },
  discountAmount: Number,
  totalPrice: {
    type: Number,
    required: true
  },
  vatRate: Number
}, { timestamps: true });

const OrderModel = mongoose.model('Order', OrderSchema);

module.exports = OrderModel;
