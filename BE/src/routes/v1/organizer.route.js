const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");

const organizerRequestController = require("../../controllers/v1/organizer/organizerRequest.controller");
const organizerEventController = require("../../controllers/v1/organizer/organizerEvent.controller");
const organizerCategoryController = require("../../controllers/v1/organizer/organizerCategory.controller");
const organizerSeatMapController = require("../../controllers/v1/organizer/organizerSeatMap.controller");
const organizerZoneController = require("../../controllers/v1/organizer/organizerZone.controller");
const organizerTicketController = require("../../controllers/v1/organizer/organizerTicket.controller");
const organizerDashboardController = require("../../controllers/v1/organizer/organizerDashboard.controller");

// ==========================================
// 1. NHÓM ĐĂNG KÝ LÀM BAN TỔ CHỨC (Cần đăng nhập)
// ==========================================
router.post("/register", authenticate, organizerRequestController.createRequest);
router.post("/requests", authenticate, organizerRequestController.createRequest);
router.get("/my-request", authenticate, organizerRequestController.getMyRequest);
router.put("/my-request/:id", authenticate, organizerRequestController.updateMyRequest);
router.delete("/my-request/:id", authenticate, organizerRequestController.cancelMyRequest);

router.use(authenticate);
router.use(authorize("ORGANIZER"));
router.get("/categories", organizerCategoryController.getCategories);
router.get("/dashboard", organizerDashboardController.getDashboardData);

// Event
router.get("/events", organizerEventController.getEvents);
router.get("/events/stats", organizerEventController.getEventStats);
router.get("/events/:id", organizerEventController.getEventDetail);
router.post("/events", organizerEventController.createEvent);
router.put("/events/:id", organizerEventController.updateEvent);
router.delete("/events/:id", organizerEventController.deleteEvent);
router.patch("/events/:id/submit", organizerEventController.submitEvent);

// Tickets
router.get(
  "/events/:eventId/ticket-types",
  organizerTicketController.getTicketTypes
);
router.get(
  "/events/:eventId/ticket-stats",
  organizerTicketController.getEventTicketStats
);
router.get(
  "/events/:eventId/tickets",
  organizerTicketController.getEventTickets
);
router.get("/tickets/:id", organizerTicketController.getTicketDetail);
router.post("/tickets/:id/check-in", organizerTicketController.checkInTicket);

// Seat Map
router.get("/seat-maps", organizerSeatMapController.getSeatMaps);
router.get("/seat-maps/:id", organizerSeatMapController.getSeatMapDetail);
router.post("/seat-maps", organizerSeatMapController.createSeatMap);
router.put("/seat-maps/:id", organizerSeatMapController.updateSeatMap);
router.post("/seat-maps/:id/duplicate", organizerSeatMapController.duplicateSeatMap);
router.delete("/seat-maps/:id", organizerSeatMapController.deleteSeatMap);

// Zone
router.get("/seat-maps/:seatMapId/zones", organizerZoneController.getZones);
router.post("/seat-maps/:seatMapId/zones", organizerZoneController.createZone);
router.get("/zones/:id", organizerZoneController.getZoneDetail);
router.put("/zones/:id", organizerZoneController.updateZone);
router.delete("/zones/:id", organizerZoneController.deleteZone);

module.exports = router;