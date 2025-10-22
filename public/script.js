const ws = new WebSocket(`ws://${location.host}`);
const eventDiv = document.getElementById("events");
const traditionalDiv = document.getElementById("traditional");
const btn = document.getElementById("triggerBtn");

const stepEvent = document.getElementById("stepEvent");
const stepRules = document.getElementById("stepRules");
const stepAction = document.getElementById("stepAction");
const pipelineText = document.getElementById("pipeline-text");

let isProcessing = false;
let toggleHighValue = false; // abwechselnd große/kleine Bestellung

ws.onopen = () => console.log("✅ WebSocket verbunden");

btn.addEventListener("click", async () => {
    if (isProcessing) return;
    isProcessing = true;
    btn.disabled = true;
    pipelineText.textContent = "📨 Sende neue Bestellung...";

    // abwechselnd groß/klein simulieren
    toggleHighValue = !toggleHighValue;
    const total = toggleHighValue ? 1500 : 450;

    const order = {
        type: "OrderCreated",
        data: {
            id: Math.floor(Math.random() * 10000),
            total: total,
        },
    };

    await fetch("/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
    });
});

ws.onmessage = (msg) => {
    const text = msg.data;
    const div = document.createElement("div");

    if (text.includes("Sales")) div.classList.add("sales");
    if (text.includes("Auto")) div.classList.add("auto");
    div.textContent = text;
    eventDiv.prepend(div);

    runPipeline(text);
};

function runPipeline(text) {
    [stepEvent, stepRules, stepAction].forEach((s) => s.classList.remove("active"));

    // Schritt 1: Event empfangen
    stepEvent.classList.add("active");
    pipelineText.textContent = "📨 Neues Event empfangen – Bestellung wird geprüft...";

    setTimeout(() => {
        stepEvent.classList.remove("active");
        stepRules.classList.add("active");
        const amount = text.match(/€(\d+)/)?.[1];
        pipelineText.textContent = `⚖️ Regelprüfung: Betrag = ${amount} € → Ist > 1000 €?`;
    }, 1200);

    setTimeout(() => {
        stepRules.classList.remove("active");
        stepAction.classList.add("active");
        if (text.includes("Sales")) {
            pipelineText.textContent =
                "🚀 Regel erfüllt! → Große Bestellung erkannt → Vertrieb wird sofort informiert.";
        } else {
            pipelineText.textContent =
                "✅ Regel nicht erfüllt → Kleinauftrag → Automatische Verarbeitung ausgelöst.";
        }
    }, 3200);

    setTimeout(() => {
        stepAction.classList.remove("active");
        pipelineText.textContent =
            "Klicke auf „Nächste Bestellung simulieren“, um den nächsten Fall zu sehen.";
        isProcessing = false;
        btn.disabled = false;
    }, 5500);

    // Rechts: traditioneller Vergleich
    setTimeout(() => {
        const t = document.createElement("div");
        t.classList.add("log");
        t.textContent = text.includes("Sales")
            ? "📨 Vertrieb hätte diese Bestellung erst Stunden später bemerkt (manuell)."
            : "🕓 Kleinauftrag würde abends im Batch-Prozess verarbeitet werden.";
        traditionalDiv.prepend(t);
    }, 6000);
}
