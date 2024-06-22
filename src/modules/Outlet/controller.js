const express = require("express");
const router = express.Router();
const outletService = require('./service');
const { asyncHandler } = require('../../utility/common');
const multerMiddleware = require('../../middlewares/multerMiddleware');

const outletCreate = asyncHandler(async (req, res) => {
  const { outletName, outletLocation, outletManager,outletImage } = req.body;
  // const outletImage = req.files['outletImage'] ? `/uploads/${req.files['outletImage'][0].filename}` : '';
  const createdOutlet = await outletService.outletCreateService(outletName, outletLocation, outletImage, outletManager);
  res.status(200).json({ createdOutlet });
});

const getAllOutlet = asyncHandler(async (req, res) => {
  const outlet = await outletService.getAllUsers();
  res.status(200).json({ outlet });
});

const updateOutlet = asyncHandler(async (req, res) => {
  const outlet = await outletService.updateOutlet(req.params.id, req.body);
  res.status(200).json({ outlet });
});

const deleteOutlet = asyncHandler(async (req, res) => {
  await outletService.deleteOutlet(req.params.id);
  res.status(200).json({ message: "Outlet deleted successfully" });
});

const searchOutlet = asyncHandler(async (req, res) => {
  const searchInfo = await outletService.searchOutlet(req.query.outletName.split(","));
  res.status(200).json({ message: "Search successful", searchInfo });
});

const outletEmailSetPassword = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  const emailInfo = await outletService.passEmailForOutlet(email, token);
  if (!emailInfo) {
    return res.status(401).json({ message: "Failed to send email" });
  }
  res.status(200).json({ message: "Email sent successfully" });
});

const getOutletManagerById = asyncHandler(async (req, res) => {
  const managerInfo = await outletService.getOutletManagerByIdService(req.params.id);
  res.status(200).json({ message: "Outlet manager found", managerInfo });
});

router.post("/outletCreate", multerMiddleware.upload.fields([
  { name: 'outletImage', maxCount: 1 }
]), outletCreate);
router.get("/getAllOutlet", getAllOutlet);
router.put("/updateOutlet/:id", updateOutlet);
router.delete("/deleteOutlet/:id", deleteOutlet);
router.get("/searchOutlet", searchOutlet);
router.post("/outletEmailSetPassword", outletEmailSetPassword);
router.get("/getOutletManagerById/:id", getOutletManagerById);

module.exports = router;
