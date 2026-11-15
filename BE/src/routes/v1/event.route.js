const express = require("express");
const router = express.Router();
const eventController = require("../../controllers/v1/event/event.controller");

router.get("/", eventController.getEvents);
router.get("/featured", eventController.getFeaturedEvents);
router.get("/upcoming", eventController.getUpcomingEvents);
router.get("/:idOrSlug", eventController.getEventDetail);

module.exports = router;

