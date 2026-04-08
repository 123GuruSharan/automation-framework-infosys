import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const titles = {
	'/dashboard': 'Dashboard',
	'/testcases': 'Test Cases',
	'/testsuites': 'Test Suites',
	'/execution': 'Execution',
	'/schedules': 'Schedules',
};

export default function MainLayout() {
	const { pathname } = useLocation();
	const title = titles[pathname] || 'Dashboard';
	const [darkMode, setDarkMode] = useState(() => {
		if (typeof window === 'undefined') return false;
		return document.documentElement.classList.contains('dark');
	});

	useEffect(() => {
		const saved = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const useDark = saved === 'dark' || (saved !== 'light' && prefersDark);
		document.documentElement.classList.toggle('dark', useDark);
		setDarkMode(useDark);
	}, []);

	const toggleTheme = () => {
		const next = !document.documentElement.classList.contains('dark');
		document.documentElement.classList.toggle('dark', next);
		localStorage.setItem('theme', next ? 'dark' : 'light');
		setDarkMode(next);
	};

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<TopNavbar title={title} darkMode={darkMode} onToggleTheme={toggleTheme} />
				<main className="flex-1 p-4 sm:p-6 lg:p-8">
					<div className="mx-auto max-w-6xl">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
