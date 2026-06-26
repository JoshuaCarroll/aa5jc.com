
const worker = new Worker('/versionCheck.worker.js');

worker.onmessage = ({ data }) => {
  location.reload(true);
};