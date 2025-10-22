import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
    console.log(`✅ Server läuft auf http://localhost:${PORT}`)
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
    if (event.type === "OrderCreated") {
        const result =
            event.data.total > 1000
                ? { type: "Order", status: "sales", text: `💼 Sales Notification – Order #${event.data.id} (€${event.data.total})` }
                : { type: "Order", status: "auto", text: `✅ Auto-Processing – Order #${event.data.id} (€${event.data.total})` };
        clients.forEach((c) => c.send(JSON.stringify(result)));
    }

    if (event.type === "MachineStatus") {
        const { temperature, vibration } = event.data;
        let result = { type: "Machine", status: "ok", text: "" };

        if (temperature > 80 || vibration > 7) {
            result = {
                type: "Machine",
                status: "critical",
                text: `🚨 Kritisch! Temp: ${temperature}°C, Vib: ${vibration}g → Wartung sofort.`,
            };
        } else if (detectAnomaly(vibration)) {
            result = {
                type: "Machine",
                status: "ai",
                text: `🤖 KI erkennt abnormales Vibrationsmuster (${vibration}g) → Wartung empfohlen.`,
            };
        } else {
            result = {
                type: "Machine",
                status: "ok",
                text: `✅ Maschine stabil – Temp: ${temperature}°C, Vib: ${vibration}g`,
            };
        }
        clients.forEach((c) => c.send(JSON.stringify(result)));
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
