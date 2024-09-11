const express = require('express');
const router = express.Router();
const settingService = require('./service');
const { asyncHandler } = require('../../utility/common');



const createEmailSettings = asyncHandler(async (req, res) => {
    const settings = await settingService.createEmailSettings(req.body);
    res.status(200).json({
        message: "Email Settings Created Successfully!",
        settings
    });
});


const updateEmailSettings = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const settings = await settingService.updateEmailSettings(id, req.body);
    res.status(200).json({
        message: "Email Settings Updated Successfully!",
        settings
    })
}); 

router.post('/updateEmailSettings/:id', updateEmailSettings);
router.post('/createEmailSettings', createEmailSettings);
module.exports = router;