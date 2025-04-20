import { appConstants } from "../common/constants";

const commonButtons = {
  download: "download",
  delete: "delete",
  checkLayer: "checkLayer",
};

class GenerationResult extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    this.images = new Map();
    this.handleStart = this.handleStart.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.handleComplete = this.handleComplete.bind(this);
    this.clickOnButton = this.clickOnButton.bind(this);

    const styleElement = document.createElement("style");
    styleElement.textContent = `.container {margin: 10px; padding: 10px; forder: 1px solid #ccc; border-radius: 5px;}
        .progress { margin-bottom: 10px;}
        .image-list { display: flex; flex-wrap: wrap; align-items: flex-start; gap:10px; }
        .image-list img {width: 200px; height: auto; margin-right: 10px; }
        .image-config { display: grid; grid-template-columns: auto 128px; gap: 5px; margin-left: 5px;}
        .image { display: flrx; flex-direction: column; min-height: 150px; }
        .progress-container { padding: 10px; }
        .layer-check-container { display: flex; align-items: center; gap: 5px; padding: 5px; align-self: flex-start; }
        .image-item { 
           min-width: 200px; min-height: 100px; margin-bottom: 5px; position: relative; 
           display: flex; flex-direction: column; justify-content: flex-start; align-items: center; 
           border: 1px solid #ccc;
        }
        button { 
            position: absolute; top: 10px; font-size: 14px; background-color: transparent; 
            padding: 0; margin: 0; border: 0; cursor: pointer;
        }
        .image2image { right: 120px; }
        .upscale { right: 100px; }
        .refine { right: 80px; }
        .inpaint { right: 60px; }
        .download { right: 40px; }
        .delete { right: 20px; }`;

    this.container = document.createElement("div");
    this.container.className = "container";
    this.imageList = document.createElement("div");
    this.imageList.className = "image-list";
    this.container.appendChild(this.imageList);
    shadow.appendChild(styleElement);
    shadow.appendChild(this.container);
    this.render();
  }

  clickOnButton(e) {
    const button = e.target.closest("button");
    if (button) {
      const buttonType = button.dataset.type;
      const index = button.dataset.index;
      switch (buttonType) {
        case appConstants.forms.img2img:
        case appConstants.forms.upscale:
        case appConstants.forms.refine:
        case appConstants.forms.inpaint: {
          const job = this.images.get(index);
          console.log("button click", job.id, buttonType, job);
          this.sendEvent({ id: job.id, url: job.url, type: buttonType });
          break;
        }
        case commonButtons.download: {
          const job = this.images.get(index);
          this.downloadImage(job.url, `image-${index}.png`);
          break;
        }
        case commonButtons.delete: {
          this.images.delete(index);
          this.sendEvent({ id: index, type: appConstants.events.deleteJob });
          this.render();
          break;
        }
      }
    } else {
      const target = e.target
      if(target){
        if(target.dataset.type === commonButtons.checkLayer){
          const index = target.dataset.index;
          const job = this.images.get(index);
          job.isLayer = !job.isLayer;
          this.images.set(index, job);
          const action = job.isLayer ? appConstants.actions.addLayer : appConstants.actions.deleteLayer;
          this.sendEvent({ id: job.id, url: job.url, type: appConstants.events.layerChange, action, bbox: job.bbox });
        }
      }
    }
  }

  connectedCallback() {
    window.addEventListener(appConstants.events.addJob, this.handleStart);
    window.addEventListener(appConstants.events.progressUpdate, this.handleProgress);
    window.addEventListener(appConstants.events.generationComplete, this.handleComplete);
    this.container.addEventListener("click", this.clickOnButton);
  }

  disconnectedCallback() {
    window.removeEventListener(appConstants.events.addJob, this.handleStart);
    window.removeEventListener(appConstants.events.progressUpdate, this.handleProgress);
    window.removeEventListener(appConstants.events.generationComplete, this.handleComplete);
  }

  handleStart(event) {
    console.log("handleStart");
    const { id } = event.detail;
    this.images.set(id, { ...event.detail, progress: 0 });
    this.render();
  }

  handleProgress(event) {
    console.log("handleProgress");
    const { id, progress } = event.detail;
    const job = this.images.get(id);
    if (job) {
      job.progress = progress;
      this.images.set(id, job);
    }

    this.render();
  }

  handleComplete(event) {
    console.log("handleComplete");
    const { id, result, number, url } = event.detail;
    const job = this.images.get(id);
    if (job) {
      job.progress = 0;
      job.url = url;
      this.images.set(id, job);
    }

    this.render();
  }

  downloadImage(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  sendEvent(data) {
    const event = new CustomEvent(appConstants.events.imageAction, { detail: data });
    window.dispatchEvent(event);
  }

  render() {
    if (this.images.size > 0) {
      this.imageList.innerHTML = `
                ${[...this.images.values()]
                  .map((img, index) => {
                    const config = Object.entries(img.config)
                      .map(
                        ([key, val]) => `<div>${key}: </div><div class="config-value">${val}</div>
                            `
                      )
                      .join("");
                    if (img.url) {
                      return `<div class="image-item">
                           <div class="image">
                               <img src="${img.url}" alt="Generated Image" />
                               <button title="Image to Image" class="image2image" data-type="${appConstants.forms.img2img}" data-index="${img.id}">🏞️</button>
                                <button title="Upscale image" class="upscale" data-type="${appConstants.forms.upscale}" data-index="${img.id}">↕️</button>
                                <button title="Refine selected area" class="refine" data-type="${appConstants.forms.refine}" data-index="${img.id}">👍</button>
                                <button title="Inpaint" class="inpaint" data-type="${appConstants.forms.inpaint}" data-index="${img.id}">🖌️</button>
                                <button title="Download" class="download" data-type="${commonButtons.download}" data-index="${img.id}">⬇️</button>
                                <button title="Delete" class="delete" data-type="${commonButtons.delete}" data-index="${img.id}">❌</button>
                           </div>
                           <div class="layer-check-container"><input type="checkbox" data-type="${commonButtons.checkLayer}" data-index="${img.id}" class="inLayer" ${
                        !!img?.isLayer ? "checked " : ""
                      }/><span>Result Layer</span></div>
                           <div class="image-config">${config}</div>
                        </div>`;
                    } else {
                      return `<div class="image-item">
                           <div class="image">
                               <div class="progress-container">
                               <svg width="100" height="100" wiewBox="0 0 100 100" 
                                    xmlns="http://www.s3.org/2000/svg">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="10" />
                                    <circle 
                                    id="progress" 
                                    cx="50" cy="50" 
                                    r="45" fill="none" 
                                    stroke="#999999" 
                                    stroke-width="10" 
                                    stroke-dasharray="283"
                                    stroke-dashoffset="calc(283 * (1 - ${+img.progress / 100}))"
                                    transform="rotate(-90 50 50)"
                                    />
                                    <text x="50" y="55" text-anchor="middle" font-size="20" fill="#999999">${img.progress}%</text>
                                </svg>
                               </div>
                           </div>
                           <div class="image-config">${config}</div>
                        </div>`;
                    }
                  })
                  .join("")}
        `;
    } else {
      this.imageList.innerHTML = "";
    }
  }
}

customElements.define("generation-result", GenerationResult);
