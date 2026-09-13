const axios = require('axios');

const FORMIO_BASE = process.env.FORMIO_BASE_URL;
const API_KEY = process.env.FORMIO_API_KEY;

const formioClient = axios.create({
  baseURL: FORMIO_BASE,
  headers: {
    'x-token': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Create or fetch a form in Form.io
async function upsertForm(path, formDefinition) {
  try {
    // Try to get existing form
    const existing = await formioClient.get(`/${path}`);
    return existing.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Create it
      const created = await formioClient.post('/form', formDefinition);
      return created.data;
    }
    throw err;
  }
}

// Create a submission (pre-fill data)
async function createSubmission(formPath, data) {
  const response = await formioClient.post(`/${formPath}/submission`, { data });
  return response.data;
}

// Get a submission by ID
async function getSubmission(formPath, submissionId) {
  const response = await formioClient.get(`/${formPath}/submission/${submissionId}`);
  return response.data;
}

// List submissions for a form
async function listSubmissions(formPath, limit = 50) {
  const response = await formioClient.get(`/${formPath}/submission?limit=${limit}`);
  return response.data;
}

// Build the URL an agent uses to open the pre-filled wizard
function buildWizardUrl(formPath, submissionId) {
  return `${FORMIO_BASE}/${formPath}?submission=${submissionId}`;
}

// Build the URL a client uses to fill the intake form
function buildIntakeUrl(formPath, metadata = {}) {
  const params = new URLSearchParams(metadata).toString();
  return `${FORMIO_BASE}/${formPath}${params ? '?' + params : ''}`;
}

module.exports = {
  formioClient,
  upsertForm,
  createSubmission,
  getSubmission,
  listSubmissions,
  buildWizardUrl,
  buildIntakeUrl,
  FORMIO_BASE
};
