import { useEffect, useState } from 'react';
import { resultsApi, testSuitesApi } from '../services/api';

export default function TestSuites() {
	const [suites, setSuites] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [resultsBySuiteId, setResultsBySuiteId] = useState({});
	const [resultsLoadingId, setResultsLoadingId] = useState(null);

	const load = async () => {
		setError(null);
		try {
			const { data } = await testSuitesApi.getAll();
			setSuites(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load suites');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const loadSuiteResults = async (suiteId) => {
		setResultsLoadingId(suiteId);
		setError(null);
		try {
			const { data } = await resultsApi.getBySuite(suiteId, { limit: 15 });
			setResultsBySuiteId((prev) => ({ ...prev, [suiteId]: data }));
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load suite results');
		} finally {
			setResultsLoadingId(null);
		}
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			await testSuitesApi.create({ name, description: description || null });
			setSuccess('Suite created');
			setName('');
			setDescription('');
			await load();
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Create failed');
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <p className="text-zinc-500">Loading suites…</p>;

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Test suites</h2>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					Organize cases into runnable suites. Point-to-point integration:{' '}
					<code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GET /api/results/&#123;suiteId&#125;</code>
				</p>
			</div>

			{error && (
				<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
					{error}
				</div>
			)}
			{success && (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
					{success}
				</div>
			)}

			<form
				onSubmit={onSubmit}
				className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900"
			>
				<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">New suite</h3>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">POST /api/testsuites/create</p>
				<div className="mt-6 grid gap-4 sm:max-w-xl">
					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Name
						</span>
						<input
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950"
						/>
					</label>
					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Description
						</span>
						<textarea
							rows={2}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
						/>
					</label>
					<button
						type="submit"
						disabled={saving}
						className="w-fit rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500 disabled:opacity-60"
					>
						{saving ? 'Saving…' : 'Create suite'}
					</button>
				</div>
			</form>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{suites.length === 0 ? (
					<p className="col-span-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-10 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
						No suites yet. Create one above.
					</p>
				) : (
					suites.map((s) => (
						<div
							key={s.id}
							className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card transition hover:shadow-card-lg dark:border-zinc-800 dark:bg-zinc-900"
						>
							<p className="text-xs font-mono text-zinc-400">#{s.id}</p>
							<h4 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{s.name}</h4>
							<p className="mt-2 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">
								{s.description || 'No description'}
							</p>
							{s.createdAt && (
								<p className="mt-4 text-xs text-zinc-400">
									Created {new Date(s.createdAt).toLocaleString()}
								</p>
							)}
							<button
								type="button"
								onClick={() => loadSuiteResults(s.id)}
								disabled={resultsLoadingId === s.id}
								className="mt-4 w-full rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
							>
								{resultsLoadingId === s.id ? 'Loading results…' : 'Load suite results (API)'}
							</button>
							{resultsBySuiteId[s.id] && (
								<div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
									<p className="font-semibold text-zinc-800 dark:text-zinc-100">
										{resultsBySuiteId[s.id].totalExecutions} run(s) · pass rate{' '}
										{resultsBySuiteId[s.id].overallPassRate}%
									</p>
									{resultsBySuiteId[s.id].lastExecutionAt && (
										<p className="mt-1 text-zinc-500 dark:text-zinc-400">
											Last: {new Date(resultsBySuiteId[s.id].lastExecutionAt).toLocaleString()}
										</p>
									)}
									<ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-zinc-600 dark:text-zinc-300">
										{(resultsBySuiteId[s.id].recentExecutions || []).map((r) => (
											<li key={r.id} className="flex justify-between gap-2">
												<span className="truncate">#{r.id}</span>
												<span className="shrink-0 text-zinc-500">{r.status}</span>
												<span className="shrink-0">
													{r.passedTests}/{r.totalTests}
												</span>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}
