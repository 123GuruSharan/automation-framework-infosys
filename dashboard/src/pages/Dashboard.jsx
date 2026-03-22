import { useEffect, useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { testCasesApi } from '../services/api';

const BAR_COLORS = {
	Passed: '#22c55e',
	Failed: '#ef4444',
	Pending: '#eab308',
};

export default function Dashboard() {
	const [cases, setCases] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const { data } = await testCasesApi.getAll();
				if (!cancelled) setCases(Array.isArray(data) ? data : []);
			} catch (e) {
				if (!cancelled) setError(e?.message || 'Failed to load test cases');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const stats = useMemo(() => {
		const total = cases.length;
		const norm = (s) => (s || '').toUpperCase();
		const passed = cases.filter((c) => norm(c.status) === 'PASS').length;
		const failed = cases.filter((c) => norm(c.status) === 'FAIL').length;
		const pending = cases.filter((c) => norm(c.status) === 'PENDING').length;
		return { total, passed, failed, pending };
	}, [cases]);

	const chartData = useMemo(
		() => [
			{ name: 'Passed', count: stats.passed },
			{ name: 'Failed', count: stats.failed },
			{ name: 'Pending', count: stats.pending },
		],
		[stats],
	);

	if (loading) {
		return (
			<div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				Loading dashboard…
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
				{error}. Is the backend running on port 8080?
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Overview</h2>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					Live counts from your regression test catalog.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard title="Total Test Cases" value={stats.total} accent="indigo" />
				<StatCard title="Passed" value={stats.passed} accent="emerald" hint="Status: PASS" />
				<StatCard title="Failed" value={stats.failed} accent="rose" hint="Status: FAIL" />
				<StatCard title="Pending" value={stats.pending} accent="amber" hint="Status: PENDING" />
			</div>

			<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Results distribution</h3>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Bar chart by current case status</p>
				<div className="mt-6 h-80 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-zinc-200 dark:stroke-zinc-700"
								vertical={false}
							/>
							<XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-zinc-500" />
							<YAxis allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-zinc-500" />
							<Tooltip
								contentStyle={{
									borderRadius: '12px',
									border: '1px solid rgb(228 228 231)',
									boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)',
								}}
							/>
							<Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={56}>
								{chartData.map((entry) => (
									<Cell key={entry.name} fill={BAR_COLORS[entry.name] || '#6366f1'} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
