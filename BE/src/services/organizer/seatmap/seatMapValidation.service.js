const BaseService = require("../../public/base.service");
const zoneValidationService = require("../zone/zoneValidation.service");

const DEFAULT_CANVAS_WIDTH = 900;
const DEFAULT_CANVAS_HEIGHT = 600;
const MAX_CANVAS_SIZE = 4000;

class SeatMapValidationService extends BaseService {
    isValidId(id) {
        return zoneValidationService.isValidId(id);
    }

    normalizeNumber(value, fallback = 0) {
        return zoneValidationService.normalizeNumber(value, fallback);
    }

    normalizeCanvas(canvasWidth, canvasHeight) {
        const width = Math.min(
            Math.max(
                this.normalizeNumber(canvasWidth, DEFAULT_CANVAS_WIDTH),
                320
            ),
            MAX_CANVAS_SIZE
        );
        const height = Math.min(
            Math.max(
                this.normalizeNumber(canvasHeight, DEFAULT_CANVAS_HEIGHT),
                320
            ),
            MAX_CANVAS_SIZE
        );

        return { width, height };
    }
}

module.exports = new SeatMapValidationService();
