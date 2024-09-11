const OrderModel = require("../Order/model");
const { BadRequest } = require("../../utility/errors");
const { all } = require("axios");



const totalSalesAndNetSalesService = async (startDate, endDate) => {
  try {
    let start, end;

    if (!startDate || !endDate) {
      // Set default dates to the past six months and current date
      end = new Date();
      start = new Date();
      start.setMonth(start.getMonth() - 5);
    } else {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    // Calculate total orders today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalOrdersToday = await OrderModel.countDocuments({
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      orderStatus: { $exists: true } // Considering all orders regardless of status
    });

    const totalOrdersInTimeFrame = await OrderModel.countDocuments({
      createdAt: {
        $gte: start,
        $lte: end,
      },
      orderStatus: { $exists: true } // Considering all orders regardless of status
    });

    const totalSalesResult = await OrderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
          orderStatus: { $exists: true } // Considering all orders regardless of status
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$totalPrice" },
          totalDiscount: { $sum: "$discountAmount" }, // Sum of discount amounts
          totalVAT: { $sum: { $multiply: ["$totalPrice", 0.15] } }, // Sum of VAT amounts (assuming VAT rate of 15%)
          totalOrders: { $sum: 1 }, // Count of orders
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalSales: 1,
          totalDiscount: 1,
          totalVAT: 1,
          totalOrders: 1,
          netSales: { $subtract: [{ $subtract: ["$totalSales", "$totalDiscount"] }, "$totalVAT"] },
        },
      },
      {
        $sort: { year: 1, month: 1 } // Sort by year and month
      }
    ]);

    // Generate all months in the range
    const generateAllMonths = (start, end) => {
      let months = [];
      let current = new Date(start);
      current.setDate(1); // Set to first day of the month

      while (current <= end) {
        months.push({
          year: current.getFullYear(),
          month: current.getMonth() + 1, // Months are zero-based
          totalSales: 0,
          netSales: 0,
          totalOrders: 0,
          totalDiscount: 0,
          totalVAT: 0
        });
        current.setMonth(current.getMonth() + 1); // Move to the next month
      }
      return months;
    };

    const allMonths = generateAllMonths(start, end);

    // Merge totalSalesResult with allMonths
    const mergedResults = allMonths.map(month => {
      const found = totalSalesResult.find(result => result.year === month.year && result.month === month.month);
      return found ? { ...month, ...found } : month;
    });

    // Calculate the sum of total sales and net sales in the given time frame
    const totalSalesSum = mergedResults.reduce((acc, result) => acc + result.totalSales, 0).toFixed(2);
    const netSalesSum = mergedResults.reduce((acc, result) => acc + result.netSales, 0).toFixed(2);

    // Calculate gross sales in the period
    const grossSales = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalGrossSales: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Calculate net sales in the period
    const netSales = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalNetSales: { $sum: { $subtract: ['$totalPrice', '$discountAmount'] } }
        }
      }
    ]);

    // Calculate total days in the period
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Calculate average gross daily sales
    const avgGrossDailySales = grossSales.length ? grossSales[0].totalGrossSales / totalDays : 0;

    // Calculate average net daily sales
    const avgNetDailySales = netSales.length ? netSales[0].totalNetSales / totalDays : 0;

    // Orders placed today
    const ordersPlacedToday = await OrderModel.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });

    // Items purchased today
    const itemsPurchasedToday = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lt: todayEnd }
        }
      },
      {
        $unwind: '$products'
      },
      {
        $group: {
          _id: null,
          totalItemsPurchased: { $sum: '$products.quantity' }
        }
      }
    ]);

    // Refunded orders (assuming refunded means orderStatus: 5)
    const refundedOrders = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          orderStatus: "Cancelled" // Cancelled
        }
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Total delivery charges in the period
    const totalDeliveryCharge = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveryCharge: { $sum: '$deliveryCharge' }
        }
      }
    ]);

    return {
      message: "Total sales calculated successfully",
      totalSalesSum,
      netSalesSum,
      totalOrdersToday,
      totalOrdersInTimeFrame,
      totalSalesAndNet: mergedResults.map(result => ({
        year: result.year,
        month: result.month,
        totalSales: result.totalSales.toFixed(2),
        netSales: result.netSales.toFixed(2),
      })),
      grossSales: grossSales.length ? grossSales[0].totalGrossSales.toFixed(2) : 0,
      avgGrossDailySales: avgGrossDailySales.toFixed(2),
      netSales: netSalesSum,
      avgNetDailySales: avgNetDailySales.toFixed(2),
      ordersPlacedToday,
      itemsPurchasedToday: itemsPurchasedToday.length ? itemsPurchasedToday[0].totalItemsPurchased : 0,
      refunded: refundedOrders.length ? refundedOrders[0].totalRefunded.toFixed(2) : 0,
      deliveryCharge: totalDeliveryCharge.length ? totalDeliveryCharge[0].totalDeliveryCharge.toFixed(2) : 0
    };
  } catch (error) {
    console.error("Error fetching net sales:", error);
    return { message: "Internal server error" };
  }
};



module.exports = {
  totalSalesAndNetSalesService,
};


