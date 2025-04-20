export const appConstants = {
    comfyUIUrl: 'http://192.168.5.146:8188',
    comfyUIWenSocket: 'ws://192.168.5.146:8188/ws',
    forms: {
        text2img: 'text2img',
        img2img: 'img2img',
        inpaint: 'inpaint',
        upscale: 'upscale',
        refine: 'refine',
    },
    events: {
        imageAction: 'image-action',
        addJob: 'start-generation',
        progressUpdate: 'progress-update',
        generationComplete: 'generation-complete',
        deleteJob: 'job-delete',
        imageToImage: 'image-to-image',
        upscale: 'up-scale',
        inpaint: 'inpaint',
        layerChange: 'layer-change',
        layersChanged: 'layers-changed',
    },
    actions: {
        addLayer: 'add-layer',
        deleteLayer: 'delete-layer',
    }
}