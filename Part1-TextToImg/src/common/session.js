import { sunscribeToEvents } from "../services/api";
import { getUUID } from "./utils";
import { initWS } from "./websocket";

export const clientId = getUUID();

export const initSession = () => {
    initWS(clientId);
    sunscribeToEvents(clientId);
}