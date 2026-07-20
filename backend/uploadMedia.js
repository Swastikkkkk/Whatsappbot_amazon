// Uploadmedia.js
require("dotenv").config();
const axios = require("axios");

async function uploadImage(imageUrl, appId, token) {

    // Download the image FIRST so we know its real byte length —
    // a hardcoded/wrong file_length causes Meta to silently fail the upload
    // (returns no error, just no usable handle).
    const imgBytes = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
    const fileLength = imgBytes.length;

    // Step 1: create upload session with the REAL file length
    const { data: session } = await axios.post(
        `https://graph.facebook.com/v23.0/${appId}/uploads`,
        null,
        { params: { file_length: fileLength, file_type: "image/jpeg", access_token: token } }
    );

    // Step 2: push the actual bytes to the session
    const { data: uploadResult } = await axios.post(
        `https://graph.facebook.com/v23.0/${session.id}`,
        imgBytes,
        {
            headers: {
                Authorization: `OAuth ${token}`,
                file_offset: 0,
                "Content-Type": "application/octet-stream"
            }
        }
    );

    if (!uploadResult || !uploadResult.h) {
        console.log("Upload response (no handle returned):", JSON.stringify(uploadResult));
        throw new Error("Media upload did not return a handle — check image URL is publicly reachable and under Meta's size/type limits.");
    }

    return uploadResult.h; // header_handle
}

module.exports = { uploadImage };