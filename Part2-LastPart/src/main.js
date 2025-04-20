import "./style.scss";
import "./components";
import { getTemplate } from "./common/template";
import { appConstants } from "./common/constants";
import { textToImgHandler, imageToImgHandler, imageUpScale, imageInpaint, imageRefine } from "./handlers";
import { initSession } from "./common/session";
import { addLayer, deleteJob, removeLayer } from "./services/jobs";
import { encodeImageToBase64 } from "./common/utils";
import { prepareInPaint, setInpaintFile, clearMask, addCanvasToJob } from "./services/inpaint";

let currentTab = "";

const onSumbitHandler = (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const values = Object.fromEntries(formData.entries());
  const formName = e.target.id;
  switch (formName) {
    case appConstants.forms.text2img: {
      textToImgHandler(values);
      break;
    }
    case appConstants.forms.img2img: {
      imageToImgHandler(values);
      break;
    }
    case appConstants.forms.upscale: {
      imageUpScale(values);
      break;
    }
    case appConstants.forms.inpaint: {
      imageInpaint(values);
      break;
    }
    case appConstants.forms.refine: {
      imageRefine(values);
      break;
    }
  }
  return false;
};

const onFileSelected = async (e) => {
  if (e.target.files.length) {
    const file = e.target.files[0];
    const fileImage = document.querySelector(".input-img");
    if (fileImage) {
      const url = await encodeImageToBase64(file, true);
      fileImage.setAttribute("src", url);
    } else {
      setInpaintFile(file);
    }
  }
};

function loadForm(formId) {
  const template = getTemplate(formId);
  const buttons = document.querySelectorAll(".tab-button");
  buttons.forEach((button) => {
    if (button.dataset.tab === formId) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  if (template) {
    currentTab = formId;
    const content = document.querySelector(".form-container");
    if (content) {
      content.innerHTML = "";
      content.appendChild(template);
      const form = content.querySelector("form");
      if (form) {
        form.setAttribute("id", formId);
        form.addEventListener("submit", onSumbitHandler);

        const inputFile = document.querySelector(".input-file");
        if(inputFile){
          inputFile.addEventListener('change', onFileSelected)
        }
        const clearMaskBtn = document.querySelector(".clear-mask");
        if (clearMaskBtn) {
          clearMaskBtn.addEventListener("click", (e) => {
            clearMask();
          });
        }

        const addJobBtn = document.querySelector(".add-job");
        if (addJobBtn) {
          addJobBtn.addEventListener("click", (e) => {
            addCanvasToJob();
          });
        }
      }
    }
  }
}

const initTabs = () => {
  const tabs = document.querySelector(".tabs");
  if (tabs) {
    tabs.innerHTML = `
    <button class="tab-button active" data-tab="${appConstants.forms.text2img}">Text to Image</button>
    <button class="tab-button" data-tab="${appConstants.forms.img2img}">Image to Image</button>
    <button class="tab-button" data-tab="${appConstants.forms.upscale}">Upscale</button>
    <button class="tab-button" data-tab="${appConstants.forms.refine}">Refine</button>
    <button class="tab-button" data-tab="${appConstants.forms.inpaint}">Inpaint</button>
    `;
  }
  tabs.addEventListener("click", (e) => {
    const button = e.target;
    if (button?.dataset?.tab) {
      loadForm(button.dataset.tab);
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  loadForm(appConstants.forms.text2img);
  initSession();
});

window.addEventListener(appConstants.events.imageAction, async (event) => {
  const { id, type, url } = event.detail;
  switch (type) {
    case appConstants.events.deleteJob: {
      deleteJob(id);
      break;
    }
    case appConstants.events.layerChange: {
      const { action } = event.detail;
      if (action === appConstants.actions.addLayer) {
        addLayer(id);
      } else if (action === appConstants.actions.deleteLayer) {
        removeLayer(id);
      }
      break;
    }
    case appConstants.forms.img2img:
    case appConstants.forms.upscale:
    case appConstants.forms.refine:
    case appConstants.forms.inpaint: {
      if (currentTab !== type) {
        loadForm(type);
      }
      if (type === appConstants.forms.inpaint || type === appConstants.forms.refine) {
        prepareInPaint(url);
      } else {
        if (url) {
          const response = await fetch(url);
          const blob = await response.blob();

          const fileName = `${id}.png`;
          const file = new File([blob], fileName, { type: blob.type });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          const fileInput = document.querySelector(".input-file");
          if (fileInput) {
            fileInput.files = dataTransfer.files;
          }
          const fileImage = document.querySelector(".input-img");
          if (fileImage) {
            fileImage.setAttribute("src", url);
          }
        }
      }
      break;
    }
  }
});
