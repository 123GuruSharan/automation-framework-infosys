export default function StatCard({ title, value, hint, accent = 'indigo' }) {
	const accents = {
		indigo: 'from-indigo-500 to-violet-600',
		emerald: 'from-emerald-500 to-teal-600',
		rose: 'from-rose-500 to-red-600',
		amber: 'from-amber-500 to-orange-600',
	};
	const ring = {
		indigo: 'ring-indigo-500/20 dark:ring-indigo-400/30',
		emerald: 'ring-emerald-500/20 dark:ring-emerald-400/30',
		rose: 'ring-rose-500/20 dark:ring-rose-400/30',
		amber: 'ring-amber-500/20 dark:ring-amber-400/30',
	};
	return (
		<div
			className={`rounded-2xl bg-white p-6 shadow-card ring-1 ring-zinc-200/80 transition hover:shadow-card-lg dark:bg-zinc-900 dark:ring-zinc-800 ${ring[accent]}`}
		>
			<p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
			<p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">{value}</p>
			{hint && <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
			<div
				className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${accents[accent]}`}
				aria-hidden
			/>
		</div>
	);
}
