export const sendEvent = (type, data) => {
    const event = new CustomEvent(type, {detail: data});
    window.dispatchEvent(event);
}

export const getUUID = () => {
    return crypto.randomUUID();
}