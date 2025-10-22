export const rules = [
    {
        event: "OrderCreated",
        condition: (data) => data.total > 1000,
        action: "notifySales"
    },
    {
        event: "OrderCreated",
        condition: (data) => data.total <= 1000,
        action: "autoProcess"
    }
];

export function evaluateEvent(event, wsClients) {
    for (const rule of rules) {
        if (rule.event === event.type && rule.condition(event.data)) {
            const msg = `💼 ${rule.action === "notifySales"
                ? "Sales Notification"
                : "Auto-Processing"
            } – Order #${event.data.id} (€${event.data.total})`;
            console.log(msg);
            wsClients.forEach((c) => c.send(msg));
        }
    }
}
