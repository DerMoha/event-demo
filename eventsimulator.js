import fetch from "node-fetch";

console.log("📦 Simuliere Bestellungen...");

setInterval(async () => {
    const order = {
        type: "OrderCreated",
        data: {
            id: Math.floor(Math.random() * 10000),
            total: Math.floor(Math.random() * 2000) + 100
        }
    };

    try {
        const res = await fetch("http://localhost:3000/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order)
        });

        if (!res.ok) throw new Error(await res.text());
    } catch (err) {
        console.error("Fehler beim Senden:", err.message);
    }
}, 3000);
