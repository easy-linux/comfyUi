import { getJob, updateJob } from "../services/jobs";
import { appConstants } from "./constants";
import { sendEvent } from "./utils";

export const initWS = (clientId) => {
  const ws = new WebSocket(`${appConstants.comfyUIWenSocket}?clientId=${clientId}`);

  let promptId;

  ws.onmessage = async (event) => {
    if (event.data instanceof Blob) {
      // it's file data
      const arrayBuffer = await event.data.arrayBuffer();
      const view = new DataView(arrayBuffer);

      // first 8 bytes as 16 bit value
      const metaData = [...new Uint8Array(arrayBuffer.slice(0, 8))].map((byte) => byte.toString(16).padStart(2, "0")).join(" ");

      console.log(`File metadata (first 8 bytes): ${metaData}`);

      const imageBlob = new Blob([view.buffer.slice(8)], { type: "image/png" });
      const imageURL = URL.createObjectURL(imageBlob);
      const job = getJob(promptId);
      job.blob = imageBlob;
      job.url = imageURL;
      updateJob(job);
      sendEvent(appConstants.events.generationComplete, { ...job });
      return;
    }

    const message = JSON.parse(event.data);
    console.log("socket data", message);

    if (message?.type === "execution_start") {
      promptId = message?.data.prompt_id;
    } else if (message?.type === "progress") {
      const { prompt_id, max, value } = message.data;
      //send event about progress
      const job = getJob(prompt_id);
      if(value < max){
        // in progress
      }
      sendEvent(appConstants.events.progressUpdate, {
        ...job, 
        progress: Math.round(100 / max * value), // in percents
    })
    } else if (message?.type === "executing") {
      promptId = message?.data.prompt_id;
    }
  };

  ws.onerror = (error) => console.error("WebSocket error: ", error);
};
