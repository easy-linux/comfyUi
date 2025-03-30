import { appConstants } from "../common/constants";

class GenerationResult extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.images = new Map();
    this.handleStart = this.handleStart.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.handleComplete = this.handleComplete.bind(this);
    this.render();
  }

  connectedCallback() {
    window.addEventListener(appConstants.events.addJob, this.handleStart);
    window.addEventListener(appConstants.events.progressUpdate, this.handleProgress);
    window.addEventListener(appConstants.events.generationComplete, this.handleComplete);
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
      this.shadowRoot.innerHTML = `
        <style>
        .container {margin: 10px; padding: 10px; forder: 1px solid #ccc; border-radius: 5px;}
        .progress { margin-bottom: 10px;}
        .image-list { display: flex; flex-wrap: wrap; align-items: center; gap:10px; }
        .image-list img {width: 200px; height: auto; margin-right: 10px; }
        .image-config { display: grid; grid-template-columns: auto 128px; gap: 5px; margin-left: 5px;}
        .image { display: flrx; flex-direction: column; min-height: 150px; }
        .progress-container { padding: 10px; }
        .image-item { 
           min-width: 200px; min-height: 100px; margin-bottom: 5px; position: relative; 
           display: flex; flex-direction: column; justify-content: flex-start; align-items: center; 
           border: 1px solid #ccc;
        }
        button { 
            position: absolute; top: 10px; font-size: 14px; background-color: transparent; 
            padding: 0; margin: 0; border: 0; cursor: pointer;
        }
        .download { right: 40px; }
        .delete { right: 20px; }
        </style>
        <div class="container">
            <div class="image-list">
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
                               <button title="Download" class="download" data-index="${img.id}">⬇</button>
                               <button title="Delete" class="delete" data-index="${img.id}">❌</button>
                           </div>
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
            </div>
        </div>
        `;

      const downloadBtn = this.shadowRoot.querySelector(".download");
      if (downloadBtn) {
        downloadBtn.addEventListener("click", (e) => {
          const index = e.target.dataset.index;
          const job = this.images.get(index);
          this.downloadImage(job.url, `image-${index}.png`);
        });
      }

      const deleteBtn = this.shadowRoot.querySelector(".delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          const id = e.target.dataset.index;
          this.images.delete(id);
          this.sendEvent({ id, type: appConstants.events.deleteJob });
        });
      }
    } else {
      this.shadowRoot.innerHTML = "";
    }
  }
}

customElements.define("generation-result", GenerationResult);
