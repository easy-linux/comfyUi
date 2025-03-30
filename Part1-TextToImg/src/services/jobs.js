const jobs = new Map();

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
    const job = getJob(id);
    if (job?.url) {
      URL.revokeObjectURL(job.url);
    }
    return jobs.delete(id);
  }
  return null;
};

export const clearJobs = () => {
    jobs.clear();
}
