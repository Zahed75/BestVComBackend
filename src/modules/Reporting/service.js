const OrderModel = require("../Order/model");
const ProductModel = require("../Products/model");
const CouponModel = require("../Discount/model");
const { BadRequest } = require("../../utility/errors");




  // const totalSalesAndNetSalesService = async (startDate, endDate) => {
  //   try {
  //     if (!startDate || !endDate) {
  //       return { message: "Start and end dates are required" };
  //     }
  
  //     const totalSalesResult = await OrderModel.aggregate([
  //       {
  //         $match: {
  //           createdAt: {
  //             $gte: new Date(startDate),
  //             $lte: new Date(endDate),
  //           },
  //           orderStatus: { $gte: 2, $lte: 4 }, // Considering only completed orders (Order Dispatched to Order On-Hold)
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           totalSales: { $sum: "$totalPrice" },
  //           totalDiscount: { $sum: "$discountAmount" }, // Sum of discount amounts
  //           totalVAT: { $sum: { $multiply: ["$totalPrice", 0.15] } }, // Sum of VAT amounts (assuming VAT rate of 15%)
  //         },
  //       },
  //     ]);
  
  //     if (totalSalesResult.length === 0) {
  //       return { message: "No completed orders found within the given period" };
  //     }
  
  //     const { totalSales, totalDiscount, totalVAT } = totalSalesResult[0]; // Destructuring assignment
  
  //     // Calculate net sales by subtracting discount and VAT from total sales
  //     const netSales = totalSales - totalDiscount - totalVAT;
  
  //     return {
  //       netSales: netSales,
  //       totalSales: totalSales,
  //     };
  //   } catch (error) {
  //     console.error("Error fetching net sales:", error);
  //     return { message: "Internal server error" };
  //   }
  // };
  
  const totalSalesAndNetSalesService = async (startDate, endDate) => {
    try {
      if (!startDate || !endDate) {
        return { message: "Start and end dates are required" };
      }
  
      const totalSalesResult = await OrderModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
            orderStatus: { $gte: 2, $lte: 4 }, // Considering only completed orders (Order Dispatched to Order On-Hold)
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
            netSales: { $subtract: [{ $subtract: ["$totalSales", "$totalDiscount"] }, "$totalVAT"] },
          },
        },
        {
          $sort: { year: 1, month: 1 } // Sort by year and month
        }
      ]);
  
      if (totalSalesResult.length === 0) {
        return { message: "No completed orders found within the given period" };
      }
  
      return totalSalesResult.map(result => ({
        year: result.year,
        month: result.month,
        totalSales: result.totalSales,
        netSales: result.netSales,
      }));
    } catch (error) {
      console.error("Error fetching net sales:", error);
      return { message: "Internal server error" };
    }
  };
  
  const totalOrderAndVariationsSoldService = async (startDate, endDate) => {
    try {
      if (!startDate || !endDate) {
        return { message: "Start and end dates are required" };
      }
  
      // Calculate total orders for the month
      const totalOrders = await OrderModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });
  
      // Calculate unique product variations sold for the month
      const totalVariationsSoldPipeline = [
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $unwind: "$products", // Split products array into separate documents
        },
        {
          $group: {
            _id: null, // Single document for all variations
            uniqueProducts: { $addToSet: "$products._id" }, // Set of unique product IDs
          },
        },
        {
          $project: {
            totalVariationsSold: { $size: "$uniqueProducts" }, // Count of unique products
          },
        },
      ];
  
      const variationsSoldResult = await OrderModel.aggregate(totalVariationsSoldPipeline);
      const totalVariationsSold = variationsSoldResult.length > 0 ? variationsSoldResult[0].totalVariationsSold : 0;
  
      return {
        totalOrders: totalOrders,
        totalVariationsSold: totalVariationsSold
      };
    } catch (error) {
      console.error("Error fetching total order and variations sold:", error);
      return { message: "Internal server error" };
    }
  };
  
  const getSalesMetrics = async (startDate, endDate) => {
    try {
      if (!startDate || !endDate) {
        throw new Error('Start and end dates are required');
      }
  
      const start = new Date(startDate);
      const end = new Date(endDate);
  
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
  ///hufhish
      // Calculate total days in the period
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
      // Calculate average gross daily sales
      const avgGrossDailySales = grossSales.length ? grossSales[0].totalGrossSales / totalDays : 0;
  
      // Calculate average net daily sales
      const avgNetDailySales = netSales.length ? netSales[0].totalNetSales / totalDays : 0;
  
      // Orders placed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      const ordersPlacedToday = await OrderModel.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      });
  
      // Items purchased today
      const itemsPurchasedToday = await OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow }
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
            orderStatus: 5 // Cancelled
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
        grossSales: grossSales.length ? grossSales[0].totalGrossSales : 0,
        avgGrossDailySales,
        netSales: netSales.length ? netSales[0].totalNetSales : 0,
        avgNetDailySales,
        ordersPlacedToday,
        itemsPurchasedToday: itemsPurchasedToday.length ? itemsPurchasedToday[0].totalItemsPurchased : 0,
        refunded: refundedOrders.length ? refundedOrders[0].totalRefunded : 0,
        deliveryCharge: totalDeliveryCharge.length ? totalDeliveryCharge[0].totalDeliveryCharge : 0
      };
    } catch (error) {
      console.error('Sales metrics Error fetching sales metrics:', error);
      throw error;
    }
  };
  


  


module.exports = {
  
  totalSalesAndNetSalesService,
  totalOrderAndVariationsSoldService,
  getSalesMetrics

};
