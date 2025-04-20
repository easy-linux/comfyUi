import { appConstants } from "../common/constants";
import { sendEvent } from "../common/utils";
import { sendPrompt } from "../services/api";
import { addJob } from "../services/jobs";
import { clientId } from "../common/session";
import { getImageBase64, getMaskBase64, getSizes, getMaskBoundingBox } from "../services/inpaint";

const handler = async (values) => {
  if (values?.image) {
    const seed = values?.seed && values?.seed !== "-1" ? parseInt(values?.seed) : Math.floor(Math.random() * 1000000000);
    const steps = values?.steps ? parseInt(values.steps) : 20;
    const cfg = values?.cfg ? parseInt(values.cfg) : 8;
    const denoise = values?.denoise ? parseFloat(values.denoise) : 1;
    const imageBase64 = getImageBase64();
    const maskBase64 = getMaskBase64();
    const boundingBox = getMaskBoundingBox()

    const payload = {
      1: {
        class_type: "CheckpointLoaderSimple",
        inputs: {
          ckpt_name: "serenity_v21Safetensors.safetensors",
        },
      },
      2: {
        class_type: "DifferentialDiffusion",
        inputs: {
          model: ["1", 0],
        },
      },
      3: {
        class_type: "ETN_LoadImageBase64",
        inputs: {
          image: imageBase64,
        },
      },
      4: {
        class_type: "ETN_LoadMaskBase64",
        inputs: {
          mask: maskBase64,
        },
      },
      5: {
        class_type: "INPAINT_ExpandMask",
        inputs: {
          mask: ["4", 0],
          grow: 9,
          blur: 9,
        },
      },
      6: {
        class_type: "CropMask",
        inputs: {
          mask: ["5", 0],
          x: boundingBox.x,
          y: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      },
      7: {
        class_type: "INPAINT_MaskedBlur",
        inputs: {
          image: ["3", 0],
          mask: ["5", 0],
          blur: 65,
          falloff: 9,
        },
      },
      8: {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: values.prompt,
        },
      },
      9: {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: values.negative ? values.negative : "",
        },
      },
      10: {
        class_type: "InpaintPreprocessor",
        inputs: {
          image: ["3", 0],
          mask: ["5", 0],
        },
      },
      11: {
        class_type: "ControlNetLoader",
        inputs: {
          control_net_name: "control_v11p_sd15_inpaint_fp16.safetensors",
        },
      },
      12: {
        class_type: "ControlNetApplyAdvanced",
        inputs: {
          positive: ["8", 0],
          negative: ["9", 0],
          control_net: ["11", 0],
          image: ["10", 0],
          vae: ["1", 2],
          strength: 1.0,
          start_percent: 0.0,
          end_percent: 1.0,
        },
      },
      13: {
        class_type: "VAEEncode",
        inputs: {
          vae: ["1", 2],
          pixels: ["7", 0],
        },
      },
      14: {
        class_type: "SetLatentNoiseMask",
        inputs: {
          samples: ["13", 0],
          mask: ["5", 0],
        },
      },
      15: {
        class_type: "RepeatLatentBatch",
        inputs: {
          samples: ["14", 0],
          amount: 1,
        },
      },
      16: {
        class_type: "CFGGuider",
        inputs: {
          model: ["2", 0],
          positive: ["12", 0],
          negative: ["12", 1],
          cfg: cfg,
        },
      },
      17: {
        class_type: "BasicScheduler",
        inputs: {
          model: ["2", 0],
          scheduler: "karras",
          steps: steps,
          denoise: denoise,
        },
      },
      18: {
        class_type: "RandomNoise",
        inputs: {
          noise_seed: seed,
        },
      },
      19: {
        class_type: "KSamplerSelect",
        inputs: {
          sampler_name: "dpmpp_2m",
        },
      },
      20: {
        class_type: "SamplerCustomAdvanced",
        inputs: {
          noise: ["18", 0],
          guider: ["16", 0],
          sampler: ["19", 0],
          sigmas: ["17", 0],
          latent_image: ["15", 0],
        },
      },
      21: {
        class_type: "VAEDecode",
        inputs: {
          vae: ["1", 2],
          samples: ["20", 1],
        },
      },
      22: {
        class_type: "ImageCrop",
        inputs: {
          image: ["21", 0],
          x: boundingBox.x,
          y: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      },
      23: {
        class_type: "INPAINT_DenoiseToCompositingMask",
        inputs: {
          mask: ["6", 0],
          offset: 0.05,
          threshold: 0.35,
        },
      },
      24: {
        class_type: "ETN_ApplyMaskToImage",
        inputs: {
          image: ["22", 0],
          mask: ["23", 0],
        },
      },
      25: {
        class_type: "ETN_SendImageWebSocket",
        inputs: {
          images: ["24", 0],
          format: "PNG",
        },
      },
    };

    const data = await sendPrompt({ prompt: payload, client_id: clientId, front: false });
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
          negative: values?.negative ? values?.negative : "",
          steps,
          cfg,
          denoise,
        },
        bbox: boundingBox,
        result: null,
      };
      addJob(job);
      sendEvent(appConstants.events.addJob, { ...job });
    }
  } else {
  }
};

export default handler;
