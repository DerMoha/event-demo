import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const server = app.listen(3000, () =>
    console.log("✅ Server läuft auf http://localhost:3000")
);

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    console.log("🔗 WebSocket verbunden");
});

const rules = [
    { event: "OrderCreated", condition: (d) => d.total > 1000, action: "notifySales" },
    { event: "OrderCreated", condition: (d) => d.total <= 1000, action: "autoProcess" },
];

function evaluateEvent(event) {
    for (const rule of rules) {
        if (rule.event === event.type && rule.condition(event.data)) {
            const msg =
                rule.action === "notifySales"
                    ? `💼 Sales Notification – Order #${event.data.id} (€${event.data.total})`
                    : `✅ Auto-Processing – Order #${event.data.id} (€${event.data.total})`;
            console.log(msg);
            clients.forEach((c) => c.send(msg));
        }
    }
}

app.post("/event", (req, res) => {
    const event = req.body;
    console.log("📩 Event empfangen:", event);
    evaluateEvent(event);
    res.json({ ok: true });
});
