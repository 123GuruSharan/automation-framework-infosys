import { useEffect, useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { analyticsApi, testCasesApi, testSuitesApi } from '../services/api';

function formatLocalDate(d) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function defaultDateRangeStrings() {
	const to = new Date();
	const from = new Date();
	from.setDate(from.getDate() - 29);
	return { from: formatLocalDate(from), to: formatLocalDate(to) };
}

const BAR_COLORS = {
	Passed: '#22c55e',
	Failed: '#ef4444',
	Pending: '#eab308',
};

export default function Dashboard() {
	const defaults = useMemo(() => defaultDateRangeStrings(), []);
	const [cases, setCases] = useState([]);
	const [suites, setSuites] = useState([]);
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [filterSuiteId, setFilterSuiteId] = useState('');
	const [filterFrom, setFilterFrom] = useState(defaults.from);
	const [filterTo, setFilterTo] = useState(defaults.to);

	const buildTrendsParams = () => {
		const params = { limit: 8, from: filterFrom, to: filterTo };
		if (filterSuiteId !== '' && filterSuiteId != null) {
			const id = Number(filterSuiteId);
			if (!Number.isNaN(id)) params.suiteId = id;
		}
		return params;
	};

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const [{ data: caseData }, { data: suiteData }, { data: analyticsData }] = await Promise.all([
					testCasesApi.getAll(),
					testSuitesApi.getAll(),
					analyticsApi.getTrends({ limit: 8, from: defaults.from, to: defaults.to }),
				]);
				if (!cancelled) {
					setCases(Array.isArray(caseData) ? caseData : []);
					setSuites(Array.isArray(suiteData) ? suiteData : []);
					setAnalytics(analyticsData || null);
				}
			} catch (e) {
				if (!cancelled) setError(e?.message || 'Failed to load test cases');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only; filters use Apply
	}, []);

	async function applyAnalyticsFilters() {
		setAnalyticsLoading(true);
		setError(null);
		try {
			const { data } = await analyticsApi.getTrends(buildTrendsParams());
			setAnalytics(data || null);
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load analytics');
		} finally {
			setAnalyticsLoading(false);
		}
	}

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

	const trendData = useMemo(
		() =>
			(Array.isArray(analytics?.trends) ? analytics.trends : []).map((t) => ({
				date: t.date,
				passRate: t.passRate,
				total: t.total,
			})),
		[analytics],
	);

	const hotspots = Array.isArray(analytics?.topFailureHotspots) ? analytics.topFailureHotspots : [];

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

			<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Analytics filters</h3>
				<p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
					Scope trends and hotspots by test suite and date range.
				</p>
				<div className="mt-4 flex flex-wrap items-end gap-3">
					<label className="flex min-w-[180px] flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
						Suite
						<select
							value={filterSuiteId}
							onChange={(e) => setFilterSuiteId(e.target.value)}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
						>
							<option value="">All suites</option>
							{suites.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name || `Suite #${s.id}`}
								</option>
							))}
						</select>
					</label>
					<label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
						From
						<input
							type="date"
							value={filterFrom}
							onChange={(e) => setFilterFrom(e.target.value)}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
						/>
					</label>
					<label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
						To
						<input
							type="date"
							value={filterTo}
							onChange={(e) => setFilterTo(e.target.value)}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
						/>
					</label>
					<button
						type="button"
						onClick={applyAnalyticsFilters}
						disabled={analyticsLoading}
						className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
					>
						{analyticsLoading ? 'Loading…' : 'Apply'}
					</button>
				</div>
				{analytics?.filterSuiteName ? (
					<p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
						Showing analytics for suite: <span className="font-medium text-zinc-700 dark:text-zinc-200">{analytics.filterSuiteName}</span>
					</p>
				) : null}
			</div>

			<div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					title="Total Executions"
					value={analytics?.totalExecutions ?? 0}
					accent="indigo"
					hint="From analytics API"
				/>
				<StatCard title="Tests Run" value={analytics?.totalTestsRun ?? 0} accent="emerald" />
				<StatCard title="Failed (History)" value={analytics?.totalFailed ?? 0} accent="rose" />
				<StatCard
					title="Overall Pass Rate"
					value={`${analytics?.overallPassRate ?? 0}%`}
					accent="amber"
				/>
				{analyticsLoading ? (
					<div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-white/60 dark:bg-zinc-900/60" />
				) : null}
			</div>

			<div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				{analyticsLoading ? (
					<div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-white/60 dark:bg-zinc-900/60" />
				) : null}
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

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
					{analyticsLoading ? (
						<div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-white/60 dark:bg-zinc-900/60" />
					) : null}
					<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Pass rate trend</h3>
					<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
						Trend from <code>/api/analytics/trends</code>
						{filterFrom && filterTo ? (
							<>
								{' '}
								({filterFrom} – {filterTo})
							</>
						) : null}
					</p>
					<div className="mt-6 h-72 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-zinc-200 dark:stroke-zinc-700"
									vertical={false}
								/>
								<XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-zinc-500" />
								<YAxis
									dataKey="passRate"
									domain={[0, 100]}
									tick={{ fill: 'currentColor', fontSize: 12 }}
									className="text-zinc-500"
								/>
								<Tooltip />
								<Line type="monotone" dataKey="passRate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
					{analyticsLoading ? (
						<div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-white/60 dark:bg-zinc-900/60" />
					) : null}
					<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Top failure hotspots</h3>
					<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Most frequently failing test cases</p>
					<div className="mt-4 space-y-3">
						{hotspots.length === 0 ? (
							<p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
								No failure hotspots yet.
							</p>
						) : (
							hotspots.map((h, idx) => (
								<div
									key={`${h.testCaseName}-${idx}`}
									className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/40"
								>
									<p className="truncate pr-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
										{h.testCaseName}
									</p>
									<span className="rounded-lg bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
										{h.failureCount}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
