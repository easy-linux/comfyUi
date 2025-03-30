import { appConstants } from "../common/constants";
import { clientId } from "../common/session";
import { sendEvent } from "../common/utils";
import { sendPrompt } from "../services/api";
import { addJob } from "../services/jobs";

export const textToImgHandler = async (values) => {
  if (values?.prompt) {
    const seed = values.seed && values.seed !== "-1" ? parseInt(values.seed) : Math.floor(Math.random() * 1000000000);
    const steps = values.steps ? parseInt(values.steps) : 20;
    const cfg = values.steps ? parseInt(values.cfg) : 8;
    const denoise = values.denoise ? parseFloat(values.denoise) : 1;

    const payload = {
      3: {
        inputs: {
          seed: seed,
          steps: steps,
          cfg: cfg,
          sampler_name: "euler_ancestral",
          scheduler: "normal",
          denoise: denoise,
          model: ["4", 0],
          positive: ["6", 0],
          negative: ["7", 0],
          latent_image: ["5", 0],
        },
        class_type: "KSampler",
        _meta: {
          title: "KSampler",
        },
      },
      4: {
        inputs: {
          ckpt_name: "Deliberate_v6.safetensors",
        },
        class_type: "CheckpointLoaderSimple",
        _meta: {
          title: "Load Checkpoint",
        },
      },
      5: {
        inputs: {
          width: 512,
          height: 728,
          batch_size: 1,
        },
        class_type: "EmptyLatentImage",
        _meta: {
          title: "Empty Latent Image",
        },
      },
      6: {
        inputs: {
          text: values.prompt,
          clip: ["4", 1],
        },
        class_type: "CLIPTextEncode",
        _meta: {
          title: "CLIP Text Encode (Prompt)",
        },
      },
      7: {
        inputs: {
          text: values.negative ? values.negative : "",
          clip: ["4", 1],
        },
        class_type: "CLIPTextEncode",
        _meta: {
          title: "CLIP Text Encode (Prompt)",
        },
      },
      8: {
        inputs: {
          samples: ["3", 0],
          vae: ["4", 2],
        },
        class_type: "VAEDecode",
        _meta: {
          title: "VAE Decode",
        },
      },
      9: {
        inputs: {
          format: "PNG",
          images: ["8", 0],
        },
        class_type: "ETN_SendImageWebSocket",
        _meta: {
          title: "Save Image",
        },
      },
    };
    const data = await sendPrompt({ prompt: payload, client_id: clientId, front: false });
    if (data) {
      const { prompt_id, number, node_errors } = data;
      if (Object.entries(node_errors).length) {
        console.error(node_errors);
      } else {
        const job = {
          id: prompt_id,
          number: number,
          payload,
          config: {
            seed,
            prompt: values.prompt,
            negative: values.negative ? values.negative : "",
            steps,
            cfg,
            denoise,
          },
          result: null, // we will put result here
        };
        addJob(job);
        sendEvent(appConstants.events.addJob, { ...job });
      }
    }
  }
};

export default textToImgHandler;
