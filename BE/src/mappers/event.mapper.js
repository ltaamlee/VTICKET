/**
 * EventMapper - Chịu trách nhiệm chuyển đổi và định dạng Entity Event từ DB sang DTO Response
 * Tuân thủ cấu trúc thư mục mappers/ của dự án (tương tự user.mapper.js, organizerRequest.mapper.js)
 */
class EventMapper {
    /**
     * Tính toán khoảng giá vé từ danh sách TicketType của sự kiện
     * @param {Array} ticketTypes 
     * @returns {{ minPrice: number, maxPrice: number, isFree: boolean }}
     */
    static calculatePriceRange(ticketTypes = []) {
        if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
            return {
                minPrice: 0,
                maxPrice: 0,
                isFree: true,
            };
        }

        const validPrices = ticketTypes
            .map((t) => Number(t.price))
            .filter((p) => !Number.isNaN(p));

        if (validPrices.length === 0) {
            return {
                minPrice: 0,
                maxPrice: 0,
                isFree: true,
            };
        }

        const minPrice = Math.min(...validPrices);
        const maxPrice = Math.max(...validPrices);

        return {
            minPrice,
            maxPrice,
            isFree: maxPrice === 0,
        };
    }

    /**
     * Xác định trạng thái bán vé của sự kiện
     * @param {Object} event 
     * @param {Array} ticketTypes 
     * @returns {"UPCOMING" | "SELLING" | "SOLD_OUT" | "ENDED"}
     */
    static determineTicketStatus(event, ticketTypes = []) {
        const now = new Date();

        // 1. Kiểm tra nếu sự kiện đã kết thúc
        if (event.endAt && new Date(event.endAt) < now) {
            return "ENDED";
        }

        // 2. Kiểm tra thời gian bán vé
        if (event.saleEndAt && new Date(event.saleEndAt) < now) {
            return "ENDED";
        }

        if (event.saleStartAt && new Date(event.saleStartAt) > now) {
            return "UPCOMING";
        }

        // 3. Kiểm tra số lượng vé còn lại
        if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
            const hasAvailableTickets = ticketTypes.some((t) => {
                const capacity = Number(t.capacity) || 0;
                const sold = Number(t.soldQuantity) || 0;
                const isActive = !t.status || t.status === "ACTIVE";
                return isActive && capacity - sold > 0;
            });

            if (!hasAvailableTickets) {
                return "SOLD_OUT";
            }
        }

        return "SELLING";
    }

    /**
     * Format thông tin tóm tắt của 1 sự kiện (dùng cho danh sách, thẻ sự kiện)
     * @param {Object} event 
     * @returns {Object} Event Summary DTO
     */
    static toEventSummaryResponse(event) {
        if (!event) return null;

        const ticketTypes = event.ticketTypes || [];
        const priceRange = this.calculatePriceRange(ticketTypes);
        const ticketStatus = this.determineTicketStatus(event, ticketTypes);
        const organizerProfile = event.organizer?.organizerProfile;

        return {
            id: event.id,
            name: event.name,
            slug: event.slug,
            thumbnailUrl: event.thumbnailUrl || null,
            bannerUrl: event.bannerUrl || null,
            location: event.location,
            startAt: event.startAt,
            endAt: event.endAt,
            saleStartAt: event.saleStartAt,
            saleEndAt: event.saleEndAt,
            status: event.status,
            category: event.category
                ? {
                      id: event.category.id,
                      name: event.category.name,
                      slug: event.category.slug,
                  }
                : null,
            organizer: {
                id: event.organizerId,
                name:
                    organizerProfile?.organizationName ||
                    event.organizer?.username ||
                    "Ban tổ chức",
                logo: organizerProfile?.logo || null,
                isVerified: Boolean(organizerProfile?.isVerified),
            },
            priceRange,
            ticketStatus,
            totalTicketTypes: ticketTypes.length,
            createdAt: event.createdAt,
        };
    }

    /**
     * Format danh sách sự kiện có phân trang
     * @param {Array} events 
     * @param {Object} pagination 
     * @returns {Object}
     */
    static toEventListResponse(events = [], pagination = {}) {
        return {
            events: events.map((e) => this.toEventSummaryResponse(e)),
            pagination,
        };
    }

    /**
     * Format chi tiết toàn diện của sự kiện (dùng cho trang chi tiết /events/:slug)
     * @param {Object} event 
     * @returns {Object} Event Detail DTO
     */
    static toEventDetailResponse(event) {
        if (!event) return null;

        const summary = this.toEventSummaryResponse(event);
        const organizerProfile = event.organizer?.organizerProfile;

        const formattedTicketTypes = (event.ticketTypes || []).map((ticket) => {
            const capacity = Number(ticket.capacity) || 0;
            const soldQuantity = Number(ticket.soldQuantity) || 0;
            const remainingQuantity = Math.max(0, capacity - soldQuantity);

            return {
                id: ticket.id,
                name: ticket.name,
                price: ticket.price,
                capacity,
                soldQuantity,
                remainingQuantity,
                saleStartAt: ticket.saleStartAt,
                saleEndAt: ticket.saleEndAt,
                status: ticket.status,
                zoneId: ticket.zoneId,
                zone: ticket.zone
                    ? {
                          id: ticket.zone.id,
                          name: ticket.zone.name,
                          color: ticket.zone.color,
                          type: ticket.zone.type,
                      }
                    : null,
            };
        });

        let formattedSeatMap = null;
        if (event.seatMap) {
            formattedSeatMap = {
                id: event.seatMap.id,
                name: event.seatMap.name,
                canvasWidth: event.seatMap.canvasWidth,
                canvasHeight: event.seatMap.canvasHeight,
                zones: (event.seatMap.zones || []).map((zone) => ({
                    id: zone.id,
                    name: zone.name,
                    code: zone.code,
                    color: zone.color,
                    type: zone.type,
                    capacity: zone.capacity,
                    price: zone.price,
                    shape: zone.shape,
                    posX: zone.posX,
                    posY: zone.posY,
                    width: zone.width,
                    height: zone.height,
                    rotation: zone.rotation,
                    points: zone.points,
                    holes: zone.holes,
                    isLocked: zone.isLocked,
                })),
            };
        }

        return {
            ...summary,
            description: event.description || "",
            contactEmail: event.contactEmail || organizerProfile?.contactEmail || null,
            contactPhone: event.contactPhone || organizerProfile?.contactPhone || null,
            submittedAt: event.submittedAt,
            reviewedAt: event.reviewedAt,
            publishedAt: event.publishedAt,
            organizer: {
                ...summary.organizer,
                email: organizerProfile?.contactEmail || event.organizer?.email || null,
                phone: organizerProfile?.contactPhone || null,
                address: organizerProfile?.address || null,
                website: organizerProfile?.website || null,
                description: organizerProfile?.description || null,
                banner: organizerProfile?.banner || null,
            },
            ticketTypes: formattedTicketTypes,
            seatMap: formattedSeatMap,
        };
    }
}

module.exports = EventMapper;

