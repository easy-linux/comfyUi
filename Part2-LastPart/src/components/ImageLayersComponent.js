import { appConstants } from "../common/constants"
import { addBlobAsJob, getJob } from "../services/jobs";


class ImageLayers extends HTMLElement {
    constructor() {
        super();
        this.handleLayersChanged = this.handleLayersChanged.bind(this)
        const shadow = this.attachShadow({ mode: "open" });
        this.activeLayers = []

        const styleElement = document.createElement("style");
        styleElement.textContent = `
            .container { margin: 0 10px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; display: flex; gap: 5px;}
            .layers-list { width: 400px; }
            .buttons-holder { display: flex; padding: 10px; justify-content: flex-end; gap: 5px;}
        `

        this.mainContainer = document.createElement("div");
        
        this.container = document.createElement("div");
        this.container.className = "container";
        this.layersList = document.createElement("div");
        this.layersList.className = "layers-list";
        this.layersCheck = document.createElement("div");
        this.layersCheck.className = "layers-check";
        this.layersCheck.addEventListener('change', (e) => {
            const check = e.target;
            if(check.dataset?.layerid){
                
                this.activeLayers.forEach((layer) => {
                    if(layer.id === check.dataset.layerid){
                        layer.active = check.checked;
                    }
                })
                this.drawLayers(this.activeLayers);
            }
        })

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d');
        this.canvas.className = "layers-canvas";
        this.layersList.appendChild(this.canvas);

        this.container.appendChild(this.layersList);
        this.container.appendChild(this.layersCheck);

        this.buttonsHolder = document.createElement("div");
        this.buttonsHolder.className = "buttons-holder";

        this.downloadButton = document.createElement("button");
        this.downloadButton.className = 'download'
        this.downloadButton.textContent = 'Download'
        this.downloadButton.addEventListener("click", (e) => {
            const dataURL = this.canvas.toDataURL('image/png');
            this.downloadImage(dataURL, `result-image.png`);
        });

        this.addJobButton = document.createElement("button");
        this.addJobButton.className = 'add-job'
        this.addJobButton.textContent = 'Add Job'
        this.addJobButton.addEventListener("click", (e) => {
            this.canvas.toBlob((blob) => { 
                if(blob){
                    addBlobAsJob(blob);
                }
             }, 'image/png');
            
        });

        this.buttonsHolder.appendChild(this.downloadButton);
        this.buttonsHolder.appendChild(this.addJobButton);

        this.mainContainer.appendChild(this.container);
        this.mainContainer.appendChild(this.buttonsHolder);

        shadow.appendChild(styleElement);
        shadow.appendChild(this.mainContainer);
    
        this.render();
    }

    connectedCallback() {
        window.addEventListener(appConstants.events.layersChanged, this.handleLayersChanged);
    }

    disconnectedCallback() {
        window.removeEventListener(appConstants.events.layersChanged, this.handleLayersChanged);
    }

    handleLayersChanged(event) {
        const { layers } = event.detail;
        const inAactiveLayers = {}

        this.activeLayers
        .filter((l) => (!l.active))
        .forEach((l) => (inAactiveLayers[l.id] = true))

        this.activeLayers = layers.map((layer) => {
            layer.active = true
            if(inAactiveLayers[layer.id]){
                layer.active = false
            }
            return layer;
        });
        this.render();
        this.drawLayers(this.activeLayers);
    }

    downloadImage(url, filename) {
        const link = document.createElement("a");
        link.href = url;
        link.target = '_blank'
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    sendEvent(data) {
        const event = new CustomEvent(appConstants.events.imageAction, { detail: data })
        window.dispatchEvent(event)
    }

    async drawLayers(layers) {
        const layersWithImg = await Promise.all(layers
            .filter((l) => (l.active))
            .map((l) => this.loadImage(l)));

        const maxWidth = Math.max(...layersWithImg.map(layer => layer.img.width));
        const maxHeight = Math.max(...layersWithImg.map(layer => layer.img.height));

        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        this.canvas.style.width = '100%'; 
        this.canvas.style.height = 'auto';

        this.ctx.clearRect(0, 0, maxWidth, maxHeight);
        layersWithImg.forEach(layer => {
            if(layer.bbox){
                this.ctx.drawImage(layer.img, layer.bbox.x, layer.bbox.y)
            } else {
                this.ctx.drawImage(layer.img, 0, 0)
            }
            
        });

        
        if(this.layersCheck){
            this.layersCheck.innerHTML = '';
            layers.forEach((layer, index) => {
                const row = document.createElement('div')
                row.setAttribute('class', 'layer-check-row')
                row.innerHTML = `<label>
                <input type="checkbox" ${layer.active ? 'checked' : ''} data-layerid="${layer.id}" /> Layer ${index}`;
                this.layersCheck.appendChild(row)
            });
        }
    }

    loadImage(layer) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({
                img,
                ...layer,
            });
            img.onerror = reject;
            img.src = layer.url;
        });
    }

    render() {
        if (this.activeLayers.length > 0) {
            this.mainContainer.style = 'display: block;'
        }
        else{
            this.mainContainer.style = 'display: none;'
        }
    }
}

customElements.define("layers-list", ImageLayers);