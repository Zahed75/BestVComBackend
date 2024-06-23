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
    const order = await orderService.createOrder(orderData); // Get total order value from the service
    res.status(200).json({
        message: "Order created successfully",
        createdOrder: order,
        // totalOrderValue: totalOrderValue // Include total order value in the response
    });
});



//Update OrderHandlerByOderID

const updateOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const orderData = req.body;
    const updatedOrder = await orderService.updateOrder(orderId, orderData);
    res.status(200).json({
        message: "Order updated successfully",
        updatedOrder
    });
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

  







const updateOrderStatusHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.updateOrderStatus(id, req.body);

    res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    next(err, req, res);
  }
};





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





router.get('/customerHistory/:customerId', getCustomerHistoryHandler);
router.get('/orders', getAllOrders);
router.post('/orderCreate', createOrder);
router.put('/:orderId', updateOrder);
router.delete('/deleteOrder/:id',deleteOrder);
router.put('/:id',authMiddleware,roleMiddleware([BRANCH_ADMIN,HEAD_OFFICE,ADMIN]),updateOrderStatusHandler);
router.get('/getOrderById/:id',getOrderByIdHandler);
router.put('/updateNote/:orderId', updateOrderNoteByIdHandler);

module.exports = router;
