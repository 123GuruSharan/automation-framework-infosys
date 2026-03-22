import { NavLink } from 'react-router-dom';

export default function TopNavbar({ title, darkMode, onToggleTheme }) {
	return (
		<header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex lg:hidden">
					<span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
						Menu → use sidebar on desktop
					</span>
				</div>
				<h1 className="truncate text-lg font-semibold text-zinc-900 dark:text-white">{title}</h1>
			</div>
			<div className="flex items-center gap-2">
				<nav className="flex gap-1 lg:hidden">
					{[
						['/dashboard', 'Home'],
						['/testcases', 'Cases'],
						['/testsuites', 'Suites'],
						['/execution', 'Run'],
					].map(([to, label]) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								`rounded-lg px-2 py-1.5 text-xs font-medium ${
									isActive
										? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
										: 'text-zinc-600 dark:text-zinc-400'
								}`
							}
						>
							{label}
						</NavLink>
					))}
				</nav>
				<button
					type="button"
					onClick={onToggleTheme}
					className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
					aria-label="Toggle dark mode"
				>
					{darkMode ? 'Light' : 'Dark'}
				</button>
			</div>
		</header>
	);
}
