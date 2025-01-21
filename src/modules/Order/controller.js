const express = require('express');
const router = express.Router();
const orderService = require('../Order/service');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utility/common');
const { BRANCH_ADMIN,HEAD_OFFICE,MANAGER,CUSTOMER, ADMIN} = require('../../config/constants');







// API endpoint for creating orders
const createOrder = asyncHandler(async (req, res) => {
  const orderData = req.body;
  const order = await orderService.createOrder(orderData);
  res.status(200).json({
      message: "Order created successfully",
      order
  });
});






//Update OrderHandlerByOderID

const updateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { orderStatus, ...orderData } = req.body; // Exclude orderStatus from the request body

  try {
    // Validate the orderId (if needed)
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Update the order
    const updatedOrder = await orderService.updateOrder(orderId, orderData);

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order updated successfully',
      updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'An error occurred while updating the order' });
  }
});







const deleteOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await orderService.deleteOrder(id);
    res.status(200).json({
        message: "Order deleted successfully"
    });
});




const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getAllOrders();
    res.status(200).json({
        message: "Successfully retrieved all orders",
        orders
    });
});

  


const updateOrderStatusHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  if (!orderStatus || typeof orderStatus !== 'string') {
    return res.status(400).json({ error: 'Invalid orderStatus' });
  }

  const order = await orderService.updateOrderStatus(id, orderStatus);

  res.status(200).json({
    message: 'Order status updated and SMS sent successfully',
    order,
  });
});













const getOrderByIdHandler =asyncHandler(async(req,res)=>{
  const {id}= req.params;
  const {success,order,error}= await orderService.getOrderById(id);
  if (success) {
    res.status(200).json({
        message: "order fetched success",
        order: order
    });
} else {
    res.status(400).json({
        message: "Failed to fetch order",
        error
    });
}
})




const getCustomerHistoryHandler = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const orders = await orderService.getCustomerHistory(customerId);
    res.status(200).json({
        message: "Successfully retrieved customer order information",
        orders
    });
});




const updateOrderNoteByIdHandler = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { orderNote } = req.body;
  
    const {  order } = await orderService.updateOrderNoteById(orderId, orderNote);

      res.status(200).json({
        message: "Order note updated successfully",
        order,
      });
    
  });




// change Outlet the OrderById
const updateOutletByOrderIdHandler = async (req, res) => {
    const { orderId } = req.params;
    const { outlet } = req.body;
  
    try {
      const updatedOrder = await orderService.updateOutletByOrderId(orderId, outlet);
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Error updating order', error: error.message });
    }
  };




const getOrderHistory = async (req, res) => {
    const { customerId } = req.params;
  
    try {
      const orderHistory = await orderService.getOrderHistoryByCustomerId(customerId);
  
      res.status(200).json({
        success: true,
        data: orderHistory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };





router.put('/updateOrder/:orderId', updateOrder);
router.post('/orderCreate', createOrder);
router.put('/:id',updateOrderStatusHandler);
router.get('/customerHistory/:customerId', getCustomerHistoryHandler);
router.get('/orders', getAllOrders);
router.delete('/deleteOrder/:id',deleteOrder);
router.put('/:id',updateOrderStatusHandler);
router.get('/getOrderById/:id',getOrderByIdHandler);
router.put('/updateNote/:orderId', updateOrderNoteByIdHandler);
router.put('/changeOutletInfo/:orderId',updateOutletByOrderIdHandler);
router.get('/order-history/:customerId', getOrderHistory);


module.exports = router;
