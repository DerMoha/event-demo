const ws = new WebSocket(`ws://${location.host}`);
let isProcessing = false;
let toggleOrder = false;
let toggleMachine = false;

// --- Business refs ---
const orderBtn = document.getElementById("triggerOrderBtn");
const stepEvent = document.getElementById("stepEvent");
const stepRules = document.getElementById("stepRules");
const stepAction = document.getElementById("stepAction");
const pipelineText = document.getElementById("pipeline-text");
const eventDiv = document.getElementById("events");
const traditionalDiv = document.getElementById("traditional");

// --- Machine refs ---
const machineBtn = document.getElementById("triggerMachineBtn");
const mEvent = document.getElementById("mEvent");
const mRules = document.getElementById("mRules");
const mAI = document.getElementById("mAI");
const mAction = document.getElementById("mAction");
const machineText = document.getElementById("machine-text");
const machineDiv = document.getElementById("machineEvents");
const machineTraditional = document.getElementById("machineTraditional");

// --- ORDER EVENT ---
orderBtn.addEventListener("click", async () => {
    if (isProcessing) return;
    isProcessing = true;
    orderBtn.disabled = true;
    machineBtn.disabled = true;

    toggleOrder = !toggleOrder;
    const total = toggleOrder ? 1500 : 450;
    await fetch("/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "OrderCreated", data: { id: Date.now(), total } }),
    });
});

// --- MACHINE EVENT ---
machineBtn.addEventListener("click", async () => {
    if (isProcessing) return;
    isProcessing = true;
    orderBtn.disabled = true;
    machineBtn.disabled = true;

    toggleMachine = !toggleMachine;
    const temperature = toggleMachine ? 85 : 70;
    const vibration = toggleMachine ? 8 : 4 + Math.random() * 3;
    await fetch("/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "MachineStatus",
            data: { id: "Machine-42", temperature, vibration: parseFloat(vibration.toFixed(2)) },
        }),
    });
});

// --- Incoming Messages ---
ws.onmessage = (msg) => {
    const text = msg.data;
    if (text.startsWith("💼") || text.startsWith("✅")) handleBusiness(text);
    else handleMachine(text);
};

// --- BUSINESS PIPELINE ---
function handleBusiness(text) {
    [stepEvent, stepRules, stepAction].forEach((s) => s.classList.remove("active"));
    stepEvent.classList.add("active");
    pipelineText.textContent = "📨 Bestellung empfangen…";

    setTimeout(() => {
        stepEvent.classList.remove("active");
        stepRules.classList.add("active");
        const amount = text.match(/€(\d+)/)?.[1];
        pipelineText.textContent = `⚖️ Regel: Betrag = ${amount} € → > 1000 € ?`;
    }, 1000);

    setTimeout(() => {
        stepRules.classList.remove("active");
        stepAction.classList.add("active");
        pipelineText.textContent = text.includes("Sales")
            ? "🚀 Große Bestellung → Vertrieb informiert."
            : "✅ Kleinauftrag → automatisch verarbeitet.";
        const div = document.createElement("div");
        div.textContent = text;
        div.classList.add(text.includes("Sales") ? "sales" : "auto");
        eventDiv.prepend(div);
    }, 3000);

    setTimeout(() => {
        const log = document.createElement("div");
        log.classList.add("log");
        log.textContent = text.includes("Sales")
            ? "📨 Traditionell: Vertrieb hätte Bestellung erst später bemerkt."
            : "🕓 Traditionell: Verarbeitung erst nachts im Batch.";
        traditionalDiv.prepend(log);
        finish();
    }, 5200);
}

// --- MACHINE PIPELINE (mit KI) ---
function handleMachine(text) {
    [mEvent, mRules, mAI, mAction].forEach((s) => s.classList.remove("active"));
    mEvent.classList.add("active");
    machineText.textContent = "📡 Sensor-Event empfangen…";

    setTimeout(() => {
        mEvent.classList.remove("active");
        mRules.classList.add("active");
        machineText.textContent = "⚖️ Prüfe Temperatur & Vibration gegen Grenzwerte…";
    }, 1000);

    setTimeout(() => {
        mRules.classList.remove("active");
        mAI.classList.add("active");
        machineText.textContent = text.includes("KI")
            ? "🧠 KI erkennt Anomalie → Wartung empfohlen."
            : "🧠 KI prüft Muster → keine Auffälligkeit.";
    }, 2800);

    setTimeout(() => {
        mAI.classList.remove("active");
        mAction.classList.add("active");
        machineText.textContent = text.includes("🚨")
            ? "🛠️ Alarm! Wartung sofort ausgelöst."
            : text.includes("KI")
                ? "🛠️ Vorbeugende Wartung geplant."
                : "✅ Maschine stabil.";
        const div = document.createElement("div");
        div.textContent = text;
        div.classList.add(text.includes("🚨") ? "sales" : "auto");
        machineDiv.prepend(div);
    }, 4600);

    setTimeout(() => {
        const log = document.createElement("div");
        log.classList.add("log");
        log.textContent = text.includes("🚨")
            ? "⚪ Traditionell: Fehler erst nach Stillstand erkannt."
            : text.includes("KI")
                ? "⚪ Traditionell: Keine KI → Problem wäre unentdeckt geblieben."
                : "⚪ Traditionell: Keine Aktion nötig.";
        machineTraditional.prepend(log);
        finish();
    }, 6500);
}

function finish() {
    isProcessing = false;
    orderBtn.disabled = false;
    machineBtn.disabled = false;
    pipelineText.textContent = "Bereit.";
    machineText.textContent = "Bereit.";
}
