export const appConstants = {
    comfyUIUrl: 'http://localhost:8188',
    comfyUIWenSocket: 'ws://localhost:8188/ws',
    forms: {
        text2img: 'text2img',
        img2img: 'img2img',
    },
    events: {
        imageAction: 'image-action',
        addJob: 'start-generation',
        progressUpdate: 'progress-update',
        generationComplete: 'generation-complete',
        deleteJob: 'job-delete',
    }
}