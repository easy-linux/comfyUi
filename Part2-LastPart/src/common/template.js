import text2imgForm from "../templates/text2imgForm.html";
import image2imgForm from "../templates/image2imgForm.html";
import inpaintForm from "../templates/inpaintForm.html";
import refineForm from "../templates/refineForm.html";
import upscaleForm from "../templates/upscaleForm.html";
import { appConstants } from "./constants";

export const getTemplate = (form) => {
  let f = null;
  switch (form) {
    case appConstants.forms.text2img: {
      f = text2imgForm;
      break;
    }
    case appConstants.forms.img2img: {
      f = image2imgForm;
      break;
    }
    case appConstants.forms.inpaint: {
      f = inpaintForm;
      break;
    }
    case appConstants.forms.refine: {
      f = refineForm;
      break;
    }
    case appConstants.forms.upscale: {
      f = upscaleForm;
      break;
    }
  }
  if (f) {
    const template = document.createElement("template");
    template.innerHTML = f.trim();
    return template.content.cloneNode(true);
  }
  return null;
};
