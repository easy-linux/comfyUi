import { appConstants } from "../common/constants";

export const sendPrompt = async (payload) => {
  const response = await fetch(`${appConstants.comfyUIUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data;
};

export const sunscribeToEvents = async (clientId) => {
  try {
    const response = await fetch(`${appConstants.comfyUIUrl}/api/etn/workflow/subscribe`, {
      method: "POST",
      body: JSON.stringify({ client_id: clientId }),
    });
    const data = await response.json();
  return data;
  } catch (e) {
    console.error('Subscribe error', e)
  }
};
