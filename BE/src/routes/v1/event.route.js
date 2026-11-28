const express = require("express");
const router = express.Router();
const eventController = require("../../controllers/v1/event/event.controller");
const orderError = require("../../middlewares/order-error.middleware");

router.get("/", eventController.getEvents);
router.get("/featured", eventController.getFeaturedEvents);
router.get("/upcoming", eventController.getUpcomingEvents);
router.get("/:id/seats", eventController.getAvailableSeats, orderError);
router.get("/:idOrSlug", eventController.getEventDetail);

module.exports = router;

