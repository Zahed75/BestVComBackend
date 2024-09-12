const express = require('express');
const router = express.Router();
const emailService = require('../Email/service');
const { asyncHandler } = require('../../utility/common');
const { BRANCH_ADMIN,HEAD_OFFICE,MANAGER,CUSTOMER, ADMIN} = require('../../config/constants');



const createAndSendOrderEmailsController = async (req, res) => {
    try {
        const orderData = req.body.orderData; // Extract the order data from the request body

        // Call the service to send order emails
        const result = await emailService.createAndSendOrderEmails(orderData);

        // Return success response
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Error sending order emails: ${error.message}`,
        });
    }
};



const updateNewOrderEmailController = async (req, res) => {
    try {
        const templateId = req.params.id; // Get the template ID from URL params
        const updateData = req.body; // Get the updated data from the request body

        // Call the service to update the new order email setup and send the updated email
        const updatedTemplate = await emailService.updateNewOrderEmail(templateId, updateData);

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'New order email setup updated and email sent successfully',
            data: updatedTemplate,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Error updating new order email setup: ${error.message}`,
        });
    }
};


router.post('/email-setup/new-order', createAndSendOrderEmailsController);

router.put('/email-setup/new-order/:id', updateNewOrderEmailController);




module.exports = router;
