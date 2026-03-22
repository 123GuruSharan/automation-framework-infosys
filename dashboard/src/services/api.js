import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 300_000,
});

export default api;

export const testCasesApi = {
	getAll: () => api.get('/api/testcases/all'),
	create: (payload) => api.post('/api/testcases/create', payload),
};

export const testSuitesApi = {
	getAll: () => api.get('/api/testsuites/all'),
	create: (payload) => api.post('/api/testsuites/create', payload),
};

export const executionsApi = {
	start: (payload) => api.post('/api/executions/start', payload),
	getAll: () => api.get('/api/executions/all'),
	getReport: (executionId) => api.get(`/api/executions/report/${executionId}`),
};
