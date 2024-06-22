const express = require("express"); 
const router = express.Router();
const reportingService = require("./service");
const { asyncHandler } = require("../../utility/common");

const totalSalesHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const totalSalesAndNet = await reportingService.totalSalesAndNetSalesService(
    startDate,
    endDate
  );
  res
    .status(200)
    .json({
      message: "Total sales calculated Successfully",
      totalSalesAndNet: totalSalesAndNet,
    });
});

const totalOrderAndVariationsSoldHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const totalOrderAndVariationsSold = await reportingService.totalOrderAndVariationsSoldService(
    startDate,
    endDate
  );
  res
    .status(200)
    .json({
      message: "Total order and variations calculated Successfully",
      totalOrderAndVariationsSold: totalOrderAndVariationsSold,
    });
});
const getSalesMetricsHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const metrics = await reportingService.getSalesMetrics(startDate, endDate);
  res.status(200).json(metrics);
});

router.get("/totalSales", totalSalesHandler);
router.get("/totalOrderAndVariationsSold", totalOrderAndVariationsSoldHandler);
router.get('/salesMetrics', getSalesMetricsHandler);
module.exports = router;
