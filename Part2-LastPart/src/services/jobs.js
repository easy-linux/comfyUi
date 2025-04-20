import { appConstants } from "../common/constants";
import { getUUID, sendEvent } from "../common/utils";

const jobs = new Map();
const layers = new Map();

export const addLayer = (id) => {
  if (jobs.has(id)) {
    const job = getJob(id);
    layers.set(id, job);
    sendEvent(appConstants.events.layersChanged, { layers: [...layers.values()] });
  }
};

export const removeLayer = (id) => {
  if (layers.has(id)) {
    layers.delete(id);
    sendEvent(appConstants.events.layersChanged, { layers: [...layers.values()] });
  }
};

export const getLayers = () => layers.values();

export const addJob = (job) => {
  if (job) {
    return jobs.set(job.id, job);
  }
};

export const getJobs = () => {
  return [...jobs.values()];
};

export const updateJob = (job) => {
  if (job && jobs.has(job.id)) {
    return jobs.set(job.id, job);
  }
};

export const getJob = (id) => {
  if (jobs.has(id)) {
    return jobs.get(id);
  }
  return null;
};

export const deleteJob = (id) => {
  if (jobs.has(id)) {
    removeLayer(id);
    const job = getJob(id);
    if (job?.url) {
      URL.revokeObjectURL(job.url);
    }
    return jobs.delete(id);
  }
  return null;
};

export const clearJobs = () => {
  const jobs = getJobs()
  jobs.forEach((job) => removeLayer(job.id))
  jobs.clear();
};

export const addBlobAsJob = (blob) => {
  if (blob) {
    const imageURL = URL.createObjectURL(blob);
    const id = getUUID();
    const name = blob.name || `image-${id}.png`;
    const job = {
      id,
      name: name,
      payload: {},
      config: {},
      progress: 0,
      result: null,
    };
    addJob(job);
    sendEvent(appConstants.events.addJob, { ...job });
    setTimeout(() => {
      job.blob = blob;
      job.url = imageURL;
      updateJob(job);
      sendEvent(appConstants.events.generationComplete, { ...job });
    }, 0);
  }
};
