export const sendEvent = (type, data) => {
    const event = new CustomEvent(type, {detail: data});
    window.dispatchEvent(event);
}

export const encodeImageToBase64 = async (file, asUrl = false) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (asUrl) {
                resolve(e.target.result)
            } else {
                resolve(reader.result.split(',')[1])
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

export const getUUID = () => {
    return crypto.randomUUID();
}