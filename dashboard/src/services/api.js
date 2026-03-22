import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:8080',
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
};
