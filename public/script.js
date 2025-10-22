const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${wsProtocol}//${location.host}`);
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
const rawEventBox = document.getElementById("rawEvent");

// --- Machine refs ---
const machineBtn = document.getElementById("triggerMachineBtn");
const mEvent = document.getElementById("mEvent");
const mRules = document.getElementById("mRules");
const mAI = document.getElementById("mAI");
const mAction = document.getElementById("mAction");
const machineText = document.getElementById("machine-text");
const machineDiv = document.getElementById("machineEvents");
const machineTraditional = document.getElementById("machineTraditional");
const rawMachineBox = document.getElementById("rawMachineEvent");


// --- ORDER EVENT ---
orderBtn.addEventListener("click", async () => {
    if (isProcessing) return;
    isProcessing = true;
    orderBtn.disabled = true;
    machineBtn.disabled = true;

    toggleOrder = !toggleOrder;
    const total = toggleOrder ? 1500 : 450;

    const order = { type: "OrderCreated", data: { id: Date.now(), total } };
    rawEventBox.textContent = JSON.stringify(order, null, 2);

    await fetch("/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
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

    const status = {
        type: "MachineStatus",
        data: { id: "Machine-42", temperature, vibration: parseFloat(vibration.toFixed(2)) },
    };
    rawMachineBox.textContent = JSON.stringify(status, null, 2);

    await fetch("/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status),
    });
});


// --- Incoming Messages ---
ws.onmessage = (msg) => {
    let data;
    try {
        data = JSON.parse(msg.data);
    } catch {
        console.warn("Ungültiges JSON:", msg.data);
        return;
    }

    if (data.type === "Order") handleBusiness(data);
    if (data.type === "Machine") handleMachine(data);
};

// --- BUSINESS PIPELINE ---
function handleBusiness(data) {
    const text = data.text;
    [stepEvent, stepRules, stepAction].forEach((s) => s.classList.remove("active"));
    stepEvent.classList.add("active");
    pipelineText.textContent = "📨 Bestellung empfangen…";

    setTimeout(() => {
        stepEvent.classList.remove("active");
        stepRules.classList.add("active");
        const amount = text.match(/€(\d+)/)?.[1];
        pipelineText.textContent = `⚖️ Regel: Betrag = ${amount} € → > 1000 €?`;
    }, 1000);

    setTimeout(() => {
        stepRules.classList.remove("active");
        stepAction.classList.add("active");
        pipelineText.textContent =
            data.status === "sales"
                ? "🚀 Große Bestellung → Vertrieb informiert."
                : "✅ Kleinauftrag → automatisch verarbeitet.";
        const div = document.createElement("div");
        div.textContent = text;
        div.classList.add(data.status === "sales" ? "sales" : "auto");
        eventDiv.prepend(div);
    }, 3000);

    setTimeout(() => {
        const log = document.createElement("div");
        log.classList.add("log");
        log.textContent =
            data.status === "sales"
                ? "📨 Traditionell: Vertrieb hätte Bestellung erst später bemerkt."
                : "🕓 Traditionell: Verarbeitung erst nachts im Batch.";
        traditionalDiv.prepend(log);
        finish();
    }, 5200);
}


// --- MACHINE PIPELINE (mit KI) ---
function handleMachine(data) {
    const text = data.text;
    [mEvent, mRules, mAI, mAction].forEach((s) => s.classList.remove("active"));
    mEvent.classList.add("active");
    machineText.textContent = "📡 Sensor-Event empfangen…";

    setTimeout(() => {
        mEvent.classList.remove("active");
        mRules.classList.add("active");
        machineText.textContent = "⚖️ Prüfe Temperatur & Vibration…";
    }, 1000);

    if (data.status === "critical") {
        setTimeout(() => {
            mRules.classList.remove("active");
            mAction.classList.add("active");
            machineText.textContent = "🚨 Grenzwert überschritten → Wartung sofort!";
            const div = document.createElement("div");
            div.textContent = text;
            div.classList.add("sales");
            machineDiv.prepend(div);
        }, 2800);

        setTimeout(() => {
            const log = document.createElement("div");
            log.classList.add("log");
            log.textContent = "⚪ Traditionell: Fehler erst nach Stillstand bemerkt.";
            machineTraditional.prepend(log);
            finish();
        }, 5000);
        return;
    }

    setTimeout(() => {
        mRules.classList.remove("active");
        mAI.classList.add("active");
        machineText.textContent =
            data.status === "ai"
                ? "🧠 KI erkennt ungewöhnliches Muster!"
                : "🧠 KI überprüft Daten – keine Auffälligkeit.";
    }, 2800);

    setTimeout(() => {
        mAI.classList.remove("active");
        mAction.classList.add("active");
        if (data.status === "ai") machineText.textContent = "🛠️ Vorbeugende Wartung empfohlen.";
        else machineText.textContent = "✅ Maschine läuft stabil.";
        const div = document.createElement("div");
        div.textContent = text;
        div.classList.add(data.status === "ai" ? "sales" : "auto");
        machineDiv.prepend(div);
    }, 4600);

    setTimeout(() => {
        const log = document.createElement("div");
        log.classList.add("log");
        if (data.status === "ai")
            log.textContent = "⚪ Traditionell: Keine KI → Ausfall wäre unentdeckt geblieben.";
        else log.textContent = "⚪ Traditionell: Keine Aktion nötig.";
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
