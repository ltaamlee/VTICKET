import { useCallback, useState } from "react";

export function useForumNotice() {
    const [notice, setNotice] = useState(null);

    const notify = useCallback((message, type = "info") => {
        setNotice({ message, type });
    }, []);

    const dismissNotice = useCallback(() => {
        setNotice(null);
    }, []);

    return { notice, notify, dismissNotice };
}

