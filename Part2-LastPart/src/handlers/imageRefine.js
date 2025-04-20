import { appConstants } from "../common/constants";
import { sendEvent } from "../common/utils";
import { sendPrompt } from "../services/api";
import { addJob } from "../services/jobs";
import { clientId } from "../common/session";
import { getImageBase64, getMaskBase64, getSizes } from "../services/inpaint";



const handler = async (values) => {
  if (values?.image) {
    const seed = values?.seed && values?.seed !== '-1' ? parseInt(values?.seed) : Math.floor(Math.random() * 1000000000)
    const steps = values?.steps ? parseInt(values.steps) : 20;
    const cfg = values?.cfg ? parseInt(values.cfg) : 8;
    const denoise = values?.denoise ? parseFloat(values.denoise) : 1;
    const imageBase64 = getImageBase64()
    const maskBase64 = getMaskBase64()

    const payload = {
      "1": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": {
          "ckpt_name": "Deliberate_v6.safetensors"
        }
      },
      "2": {
        "class_type": "DifferentialDiffusion",
        "inputs": {
          "model": [
            "1",
            0
          ]
        }
      },
      "3": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": [
            "1",
            1
          ],
          "text": values.prompt
        }
      },
      "4": {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": [
            "1",
            1
          ],
          "text": values?.negative ? values?.negative : ''
        }
      },
      "5": {
        "class_type": "ETN_LoadImageBase64",
        "inputs": {
          "image": imageBase64
        }
      },
      "6": {
        "class_type": "ETN_LoadMaskBase64",
        "inputs": {
          "mask": maskBase64
        }
      },
      "7": {
        "class_type": "INPAINT_ExpandMask",
        "inputs": {
          "mask": [
            "6",
            0
          ],
          "grow": 22,
          "blur": 22
        }
      },
      "8": {
        "class_type": "VAEEncode",
        "inputs": {
          "vae": [
            "1",
            2
          ],
          "pixels": [
            "5",
            0
          ]
        }
      },
      "9": {
        "class_type": "SetLatentNoiseMask",
        "inputs": {
          "samples": [
            "8",
            0
          ],
          "mask": [
            "7",
            0
          ]
        }
      },
      "10": {
        "class_type": "RepeatLatentBatch",
        "inputs": {
          "samples": [
            "9",
            0
          ],
          "amount": 4
        }
      },
      "11": {
        "class_type": "CFGGuider",
        "inputs": {
          "model": [
            "2",
            0
          ],
          "positive": [
            "3",
            0
          ],
          "negative": [
            "4",
            0
          ],
          "cfg": cfg
        }
      },
      "12": {
        "class_type": "BasicScheduler",
        "inputs": {
          "model": [
            "2",
            0
          ],
          "scheduler": "normal",
          "steps": steps,
          "denoise": denoise
        }
      },
      "13": {
        "class_type": "SplitSigmas",
        "inputs": {
          "sigmas": [
            "12",
            0
          ],
          "step": 12
        }
      },
      "14": {
        "class_type": "RandomNoise",
        "inputs": {
          "noise_seed": seed
        }
      },
      "15": {
        "class_type": "KSamplerSelect",
        "inputs": {
          "sampler_name": "euler_ancestral"
        }
      },
      "16": {
        "class_type": "SamplerCustomAdvanced",
        "inputs": {
          "noise": [
            "14",
            0
          ],
          "guider": [
            "11",
            0
          ],
          "sampler": [
            "15",
            0
          ],
          "sigmas": [
            "13",
            1
          ],
          "latent_image": [
            "10",
            0
          ]
        }
      },
      "17": {
        "class_type": "VAEDecode",
        "inputs": {
          "vae": [
            "1",
            2
          ],
          "samples": [
            "16",
            1
          ]
        }
      },
      "18": {
        "class_type": "INPAINT_DenoiseToCompositingMask",
        "inputs": {
          "mask": [
            "7",
            0
          ],
          "offset": 0.05,
          "threshold": 0.35
        }
      },
      "19": {
        "class_type": "ETN_ApplyMaskToImage",
        "inputs": {
          "image": [
            "17",
            0
          ],
          "mask": [
            "18",
            0
          ]
        }
      },
      "20": {
        "class_type": "ETN_SendImageWebSocket",
        "inputs": {
          "images": [
            "19",
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