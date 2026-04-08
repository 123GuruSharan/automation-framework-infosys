import axios from 'axios';

/** Point-to-point backend URL; override with VITE_API_BASE_URL in dashboard/.env */
const rawBase = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
	typeof rawBase === 'string' && rawBase.trim() !== '' ? rawBase.replace(/\/$/, '') : 'http://localhost:8080';

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
	update: (id, payload) => api.patch(`/api/testcases/${id}`, payload),
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

export const reportsApi = {
	downloadUrl: (executionId, format = 'csv') =>
		`${API_BASE_URL}/api/reports/generate?executionId=${encodeURIComponent(executionId)}&format=${encodeURIComponent(format)}`,
};

export const logsApi = {
	getByExecution: (executionId) => api.get(`/api/logs/${executionId}`),
	collect: (payload) => api.post('/api/logs/collect', payload),
};

export const analyticsApi = {
	getTrends: (params = {}) => api.get('/api/analytics/trends', { params }),
};

/** Suite-scoped execution history + pass rate (PDF: GET /results/{suiteId}) */
export const resultsApi = {
	getBySuite: (suiteId, params = {}) => api.get(`/api/results/${suiteId}`, { params }),
};

export const schedulesApi = {
	create: (payload) => api.post('/api/schedules/create', payload),
	getAll: () => api.get('/api/schedules/all'),
	setEnabled: (id, enabled) => api.patch(`/api/schedules/${id}/enabled`, { enabled }),
	runNow: (id) => api.post(`/api/schedules/${id}/run-now`),
};
