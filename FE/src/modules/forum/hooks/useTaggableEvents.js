import { useEffect, useState } from "react";
import { getTaggableEvents } from "../services/forumService";

export function useTaggableEvents({ enabled = true, limit = 50 } = {}) {
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        let active = true;

        const loadEvents = async () => {
            try {
                setLoadingEvents(true);
                const res = await getTaggableEvents({ limit });
                if (active) {
                    setEvents(res.data?.events || []);
                }
            } catch {
                // Keep general discussion option usable if events fail to load
            } finally {
                if (active) setLoadingEvents(false);
            }
        };

        loadEvents();
        return () => {
            active = false;
        };
    }, [enabled, limit]);

    return { events, loadingEvents };
}

