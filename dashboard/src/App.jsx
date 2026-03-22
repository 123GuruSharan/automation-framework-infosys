import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import TestCases from './pages/TestCases';
import TestSuites from './pages/TestSuites';
import Execution from './pages/Execution';

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<MainLayout />}>
					<Route index element={<Navigate to="/dashboard" replace />} />
					<Route path="dashboard" element={<Dashboard />} />
					<Route path="testcases" element={<TestCases />} />
					<Route path="testsuites" element={<TestSuites />} />
					<Route path="execution" element={<Execution />} />
				</Route>
				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
