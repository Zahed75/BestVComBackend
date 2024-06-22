const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
  netSales: {
    type: Number,
    default: 0,
  },
  orders: {
    type: Number,
    default: 0,
  },
  variationsSold: {
    type: Number,
    default: 0,
  },
  grossSales: {
    type: Number,
    default: 0,
  },
  averageGrossDailySales: {
    type: Number,
    default: 0,
  },
  netSalesInPeriod: {
    type: Number,
    default: 0,
  },
  refunded: {
    type: Number,
  },
  averageNetDailySales: {
    type: Number,
    default: 0,
  },
  orderPlaced: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ReportModel = mongoose.model("Report", ReportSchema);

module.exports = ReportModel;
