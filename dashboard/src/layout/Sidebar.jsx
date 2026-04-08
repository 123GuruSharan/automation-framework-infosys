import { NavLink } from 'react-router-dom';

const links = [
	{ to: '/dashboard', label: 'Dashboard' },
	{ to: '/testcases', label: 'Test Cases' },
	{ to: '/testsuites', label: 'Test Suites' },
	{ to: '/execution', label: 'Execution' },
	{ to: '/schedules', label: 'Schedules' },
];

export default function Sidebar() {
	return (
		<aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 lg:flex">
			<div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
					AT
				</div>
				<div>
					<p className="text-sm font-semibold text-zinc-900 dark:text-white">Automation</p>
					<p className="text-xs text-zinc-500 dark:text-zinc-400">Test Dashboard</p>
				</div>
			</div>
			<nav className="flex flex-1 flex-col gap-1 p-4">
				{links.map(({ to, label }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							[
								'rounded-xl px-4 py-3 text-sm font-medium transition',
								isActive
									? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
									: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80',
							].join(' ')
						}
					>
						{label}
					</NavLink>
				))}
			</nav>
			<div className="border-t border-zinc-200 p-4 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
				API: localhost:8080
			</div>
		</aside>
	);
}
