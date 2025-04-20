import { appConstants } from "../common/constants";
import { clientId } from "../common/session";
import { encodeImageToBase64, sendEvent } from "../common/utils";
import { sendPrompt } from "../services/api";
import { addJob } from "../services/jobs";



const imageToImgHandler = async (values) => {
  if (values?.image) {
    const seed = values?.seed && values?.seed !== '-1' ? parseInt(values?.seed) : Math.floor(Math.random() * 1000000000)
    const steps = values?.steps ? parseInt(values.steps) : 20;
    const cfg = values?.cfg ? parseInt(values.cfg) : 8;
    const denoise = values?.denoise ? parseFloat(values.denoise) : 1;
    const base64 = await encodeImageToBase64(values.image)

    const payload = {
      "3": {
        "inputs": {
          "seed": seed,
          "steps": steps,
          "cfg": cfg,
          "sampler_name": "euler_ancestral",
          "scheduler": "normal",
          "denoise": denoise,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["12", 0]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "KSampler"
        }
      },
      "4": {
        "inputs": {
          "ckpt_name": "Deliberate_v6.safetensors"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Load Checkpoint"
        }
      },
      "6": {
        "inputs": {
          "text": values.prompt,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "7": {
        "inputs": {
          "text": values?.negative ? values?.negative : '',
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": [
            "4",
            2
          ]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "9": {
        "inputs": {
          "images": [
            "8",
            0
          ],
          "format": "PNG"
        },
        "class_type": "SaveImageWebsocket",
        "_meta": {
          "title": "Save Image"
        }
      },
      "11": {
        "class_type": "ETN_LoadImageBase64",
        "inputs": {
          "image": base64
        }
      },
      "12": {
        "inputs": {
          "pixels": ["11", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEEncode",
        "_meta": {
          "title": "VAE Encode"
        }
      },
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

export default imageToImgHandler;