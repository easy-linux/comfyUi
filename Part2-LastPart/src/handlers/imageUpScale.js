import { appConstants } from "../common/constants";
import { encodeImageToBase64, sendEvent } from "../common/utils";
import { sendPrompt } from "../services/api";
import { addJob } from "../services/jobs";
import { clientId } from "../common/session";
import { getSizes } from "../services/inpaint";

const handler = async (values) => {
  if (values?.image) {
    const seed = values?.seed && values?.seed !== '-1' ? parseInt(values?.seed) : Math.floor(Math.random() * 1000000000)
    const steps = values?.steps ? parseInt(values.steps) : 20;
    const cfg = values?.cfg ? parseInt(values.cfg) : 8;
    const denoise = values?.denoise ? parseFloat(values.denoise) : 1;
    const base64 = await encodeImageToBase64(values.image)
    const image = document.querySelector(".input-img");
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    const xSize = parseInt(values.scale)
    const newWidth = width * xSize
    const newHeight = height * xSize

    const payload = {
      "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "serenity_v21Safetensors.safetensors"
            }
        },
        "2": {
            "class_type": "ETN_LoadImageBase64",
            "inputs": {
                "image": base64
            }
        },
        "3": {
            "class_type": "UpscaleModelLoader",
            "inputs": {
                "model_name": "4x_NMKD-Superscale-SP_178000_G.pth"
            }
        },
        "4": {
            "class_type": "ImageUpscaleWithModel",
            "inputs": {
                "upscale_model": [
                    "3",
                    0
                ],
                "image": [
                    "2",
                    0
                ]
            }
        },
        "5": {
            "class_type": "ImageScale",
            "inputs": {
                "image": [
                    "4",
                    0
                ],
                "width": newWidth,
                "height": newHeight,
                "upscale_method": "lanczos",
                "crop": "disabled"
            }
        },
        "6": {
            "class_type": "ETN_TileLayout",
            "inputs": {
                "image": [
                    "5",
                    0
                ],
                "min_tile_size": 672,
                "padding": 32,
                "blending": 16
            }
        },
        "7": {
            "class_type": "ETN_ExtractImageTile",
            "inputs": {
                "image": [
                    "5",
                    0
                ],
                "layout": [
                    "6",
                    0
                ],
                "index": 0
            }
        },
        "8": {
            "class_type": "ETN_GenerateTileMask",
            "inputs": {
                "layout": [
                    "6",
                    0
                ],
                "index": 0
            }
        },
        "9": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": [
                    "1",
                    1
                ],
                "text": "cinematic photo of 4k uhd, photograph, film, best quality, highres"
            }
        },
        "10": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": [
                    "1",
                    1
                ],
                "text": "drawing, painting, sketch, bad quality, low resolution, blurry"
            }
        },
        "11": {
            "class_type": "ImageScale",
            "inputs": {
                "image": [
                    "2",
                    0
                ],
                "width": newWidth,
                "height": newHeight,
                "upscale_method": "lanczos",
                "crop": "disabled"
            }
        },
        "12": {
            "class_type": "ETN_ExtractImageTile",
            "inputs": {
                "image": [
                    "11",
                    0
                ],
                "layout": [
                    "6",
                    0
                ],
                "index": 0
            }
        },
        "13": {
            "class_type": "ControlNetLoader",
            "inputs": {
                "control_net_name": "control_lora_rank128_v11f1e_sd15_tile_fp16.safetensors"
            }
        },
        "14": {
            "class_type": "ControlNetApplyAdvanced",
            "inputs": {
                "positive": [
                    "9",
                    0
                ],
                "negative": [
                    "10",
                    0
                ],
                "control_net": [
                    "13",
                    0
                ],
                "image": [
                    "12",
                    0
                ],
                "vae": [
                    "1",
                    2
                ],
                "strength": 0.5,
                "start_percent": 0.0,
                "end_percent": 1.0
            }
        },
        "15": {
            "class_type": "VAEEncode",
            "inputs": {
                "vae": [
                    "1",
                    2
                ],
                "pixels": [
                    "7",
                    0
                ]
            }
        },
        "16": {
            "class_type": "SetLatentNoiseMask",
            "inputs": {
                "samples": [
                    "15",
                    0
                ],
                "mask": [
                    "8",
                    0
                ]
            }
        },
        "17": {
            "class_type": "CFGGuider",
            "inputs": {
                "model": [
                    "1",
                    0
                ],
                "positive": [
                    "14",
                    0
                ],
                "negative": [
                    "14",
                    1
                ],
                "cfg": cfg
            }
        },
        "18": {
            "class_type": "BasicScheduler",
            "inputs": {
                "model": [
                    "1",
                    0
                ],
                "scheduler": "karras",
                "steps": steps,
                "denoise": denoise
            }
        },
        "19": {
            "class_type": "SplitSigmas",
            "inputs": {
                "sigmas": [
                    "18",
                    0
                ],
                "step": 14
            }
        },
        "20": {
            "class_type": "RandomNoise",
            "inputs": {
                "noise_seed": seed
            }
        },
        "21": {
            "class_type": "KSamplerSelect",
            "inputs": {
                "sampler_name": "dpmpp_2m"
            }
        },
        "22": {
            "class_type": "SamplerCustomAdvanced",
            "inputs": {
                "noise": [
                    "20",
                    0
                ],
                "guider": [
                    "17",
                    0
                ],
                "sampler": [
                    "21",
                    0
                ],
                "sigmas": [
                    "19",
                    1
                ],
                "latent_image": [
                    "16",
                    0
                ]
            }
        },
        "23": {
            "class_type": "VAEDecode",
            "inputs": {
                "vae": [
                    "1",
                    2
                ],
                "samples": [
                    "22",
                    1
                ]
            }
        },
        "24": {
            "class_type": "ETN_MergeImageTile",
            "inputs": {
                "layout": [
                    "6",
                    0
                ],
                "index": 0,
                "tile": [
                    "23",
                    0
                ],
                "image": [
                    "5",
                    0
                ]
            }
        },
        "25": {
            "class_type": "ETN_ExtractImageTile",
            "inputs": {
                "image": [
                    "5",
                    0
                ],
                "layout": [
                    "6",
                    0
                ],
                "index": 1
            }
        },
        "26": {
            "class_type": "ETN_GenerateTileMask",
            "inputs": {
                "layout": [
                    "6",
                    0
                ],
                "index": 1
            }
        },
        "27": {
            "class_type": "ETN_ExtractImageTile",
            "inputs": {
                "image": [
                    "11",
                    0
                ],
                "layout": [
                    "6",
                    0
                ],
                "index": 1
            }
        },
        "28": {
            "class_type": "ControlNetApplyAdvanced",
            "inputs": {
                "positive": [
                    "9",
                    0
                ],
                "negative": [
                    "10",
                    0
                ],
                "control_net": [
                    "13",
                    0
                ],
                "image": [
                    "27",
                    0
                ],
                "vae": [
                    "1",
                    2
                ],
                "strength": 0.5,
                "start_percent": 0.0,
                "end_percent": 1.0
            }
        },
        "29": {
            "class_type": "VAEEncode",
            "inputs": {
                "vae": [
                    "1",
                    2
                ],
                "pixels": [
                    "25",
                    0
                ]
            }
        },
        "30": {
            "class_type": "SetLatentNoiseMask",
            "inputs": {
                "samples": [
                    "29",
                    0
                ],
                "mask": [
                    "26",
                    0
                ]
            }
        },
        "31": {
            "class_type": "CFGGuider",
            "inputs": {
                "model": [
                    "1",
                    0
                ],
                "positive": [
                    "28",
                    0
                ],
                "negative": [
                    "28",
                    1
                ],
                "cfg": 7.0
            }
        },
        "32": {
            "class_type": "BasicScheduler",
            "inputs": {
                "model": [
                    "1",
                    0
                ],
                "scheduler": "karras",
                "steps": 20,
                "denoise": 1.0
            }
        },
        "33": {
            "class_type": "SplitSigmas",
            "inputs": {
                "sigmas": [
                    "32",
                    0
                ],
                "step": 14
            }
        },
        "34": {
            "class_type": "SamplerCustomAdvanced",
            "inputs": {
                "noise": [
                    "20",
                    0
                ],
                "guider": [
                    "31",
                    0
                ],
                "sampler": [
                    "21",
                    0
                ],
                "sigmas": [
                    "33",
                    1
                ],
                "latent_image": [
                    "30",
                    0
                ]
            }
        },
        "35": {
            "class_type": "VAEDecode",
            "inputs": {
                "vae": [
                    "1",
                    2
                ],
                "samples": [
                    "34",
                    1
                ]
            }
        },
        "36": {
            "class_type": "ETN_MergeImageTile",
            "inputs": {
                "layout": [
                    "6",
                    0
                ],
                "index": 1,
                "tile": [
                    "35",
                    0
                ],
                "image": [
                    "24",
                    0
                ]
            }
        },
        "37": {
            "class_type": "ETN_SendImageWebSocket",
            "inputs": {
                "images": [
                    "36",
                    0
                ],
                "format": "PNG"
            }
        }
    }

    const data = await sendPrompt({ prompt: payload, client_id: clientId, front: false })
    const { prompt_id, number, node_errors } = data
    if (Object.entries(node_errors).length) {
      console.error(node_errors)
    } else {
      const job = {
        id: prompt_id,
        number: number,
        payload,
        config: {
          seed,
          prompt: values.prompt,
          negative: values?.negative ? values?.negative : '',
          steps,
          cfg,
          denoise,
        },
        result: null,
      }
      addJob(job)
      sendEvent(appConstants.events.addJob, { ...job })
    }
  } else {

  }
};

export default handler;