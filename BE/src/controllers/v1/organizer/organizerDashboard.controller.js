class OrganizerDashboardService {
    async getDashboardData() {
        const totalEvents = await prisma.event.count();
        return { totalEvents };
    }
}

module.exports = new OrganizerDashboardService();