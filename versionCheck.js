
const worker = new Worker('/versionCheck.worker.js');

worker.onmessage = ({ data }) => {
  if (confirm(`A new version is available (${data.version}).\r\n\r\nThe most recent change was '${data.message}'\r\n\r\nIs it OK to reload the page?`)) {
    location.reload(true);
  }
};