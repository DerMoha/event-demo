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
    // Bestellung
    if (event.type === "OrderCreated") {
        const msg =
            event.data.total > 1000
                ? `💼 Sales Notification – Order #${event.data.id} (€${event.data.total})`
                : `✅ Auto-Processing – Order #${event.data.id} (€${event.data.total})`;
        clients.forEach((c) => c.send(msg));
    }

    // Maschine
    if (event.type === "MachineStatus") {
        const { temperature, vibration } = event.data;
        let msg = "";
        if (temperature > 80 || vibration > 7) {
            msg = `🚨 Kritisch! Temp: ${temperature}°C, Vib: ${vibration}g → Wartung sofort.`;
        } else if (detectAnomaly(vibration)) {
            msg = `🤖 KI erkennt abnormales Vibrationsmuster (${vibration}g) → Wartung empfohlen.`;
        } else {
            msg = `✅ Maschine stabil – Temp: ${temperature}°C, Vib: ${vibration}g`;
        }
        clients.forEach((c) => c.send(msg));
    }
}

function detectAnomaly(vibration) {
    return vibration > 5 && Math.random() < 0.3;
}


app.post("/event", (req, res) => {
    const event = req.body;
    console.log("📩 Event empfangen:", event);
    evaluateEvent(event);
    res.json({ ok: true });
});
