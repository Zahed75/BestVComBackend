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


router.get("/totalSales", totalSalesHandler);
module.exports = router;
