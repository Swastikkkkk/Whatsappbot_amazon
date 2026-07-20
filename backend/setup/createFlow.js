require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

(async () => {

    const flowJson = fs.readFileSync(path.join(__dirname, "checkoutFlow.json"), "utf8");

    console.log("Creating flow...");

    // 1. Create the flow container
    const { data: flow } = await axios.post(
        `https://graph.facebook.com/v23.0/${process.env.WABA_ID}/flows`,
        {
            name: "smartcart_checkout_flow",
            categories: ["OTHER"]
        },
        { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` } }
    );

    console.log("Flow created:", flow);
    const flowId = flow.id;

    // 2. Upload the flow JSON as the flow's asset
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", fs.createReadStream(path.join(__dirname, "checkoutFlow.json")), {
        contentType: "application/json",
        filename: "flow.json"
    });
    form.append("name", "flow.json");
    form.append("asset_type", "FLOW_JSON");

    await axios.post(
        `https://graph.facebook.com/v23.0/${flowId}/assets`,
        form,
        { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, ...form.getHeaders() } }
    );

    console.log("Flow JSON uploaded.");

    // 3. Publish the flow
    await axios.post(
        `https://graph.facebook.com/v23.0/${flowId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` } }
    );

    console.log("Flow published! FLOW_ID =", flowId);
    console.log("Add this to your .env: FLOW_ID=" + flowId);

})().catch(err => {
    console.log("ERROR:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
});