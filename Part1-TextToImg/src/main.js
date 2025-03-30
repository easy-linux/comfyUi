import "./style.scss";
import "./components";
import { getTemplate } from "./common/template";
import { appConstants } from "./common/constants";
import { textToImgHandler, imageToImgHandler } from "./handlers";
import { initSession } from "./common/session";
import { deleteJob } from "./services/jobs";

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
  }
  return false;
};

function loadForm(formId) {
  const template = getTemplate(formId);
  const buttons = document.querySelectorAll(".tab-button");

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
      }
    }
  }
}

const initTabs = () => {
  const tabs = document.querySelector(".tabs");
  if (tabs) {
    tabs.innerHTML = `
    <button class="tab-button active" data-tab="${appConstants.forms.text2img}">Text to Image</button>
    <button class="tab-button active" data-tab="${appConstants.forms.img2img}">Image to Image</button>
    `;
  }
  tabs.addEventListener("click", (e) => {
    const button = e.target;
    if (button?.dataset?.tab) {
      const buttons = document.querySelectorAll(".tab-button");
      buttons.forEach((button) => button.classList.remove("active"));
      button.classList.add("active");
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
  //events from web component
  const { id, type, url} = event.detail;
  switch(type){
    case appConstants.events.deleteJob: {
      deleteJob(id);
      break;
    }
  }
})
