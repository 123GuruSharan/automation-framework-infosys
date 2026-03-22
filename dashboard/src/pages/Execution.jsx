import { useEffect, useState } from 'react';
import { executionsApi, testSuitesApi } from '../services/api';

export default function Execution() {
	const [suites, setSuites] = useState([]);
	const [executions, setExecutions] = useState([]);
	const [suiteId, setSuiteId] = useState('');
	const [running, setRunning] = useState(false);
	const [error, setError] = useState(null);
	const [lastResult, setLastResult] = useState(null);

	const loadSuites = async () => {
		try {
			const { data } = await testSuitesApi.getAll();
			setSuites(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load suites');
		}
	};

	const loadExecutions = async () => {
		try {
			const { data } = await executionsApi.getAll();
			setExecutions(Array.isArray(data) ? data : []);
		} catch {
			/* optional */
		}
	};

	useEffect(() => {
		loadSuites();
		loadExecutions();
	}, []);

	const runSuite = async () => {
		const id = Number(suiteId);
		if (!id) {
			setError('Select a test suite');
			return;
		}
		setRunning(true);
		setError(null);
		setLastResult(null);
		try {
			const { data } = await executionsApi.start({ testSuiteId: id });
			setLastResult(data);
			await loadExecutions();
		} catch (e) {
			const msg =
				e?.response?.data?.message ||
				(typeof e?.response?.data === 'string' ? e.response.data : null) ||
				e?.message ||
				'Execution failed';
			setError(String(msg));
		} finally {
			setRunning(false);
		}
	};

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Run execution</h2>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					POST /api/executions/start — runs the integration engine (may take a while for UI tests).
				</p>
			</div>

			{error && (
				<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
					{error}
				</div>
			)}

			<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				<label className="block max-w-md">
					<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
						Test suite
					</span>
					<select
						value={suiteId}
						onChange={(e) => setSuiteId(e.target.value)}
						className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
					>
						<option value="">Select suite…</option>
						{suites.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name} (#{s.id})
							</option>
						))}
					</select>
				</label>
				<button
					type="button"
					onClick={runSuite}
					disabled={running}
					className="mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
				>
					{running ? 'Running suite…' : 'Run test suite'}
				</button>
			</div>

			{lastResult && (
				<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900">
					<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Latest execution</h3>
					<dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
							<dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ID</dt>
							<dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">{lastResult.id}</dd>
						</div>
						<div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
							<dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</dt>
							<dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
								{lastResult.status}
							</dd>
						</div>
						<div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
							<dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Time</dt>
							<dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
								{lastResult.executionTime
									? new Date(lastResult.executionTime).toLocaleString()
									: '—'}
							</dd>
						</div>
						<div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
							<dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total</dt>
							<dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
								{lastResult.totalTests}
							</dd>
						</div>
						<div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
							<dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Passed</dt>
							<dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
								{lastResult.passedTests}
							</dd>
						</div>
						<div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
							<dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Failed</dt>
							<dd className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">
								{lastResult.failedTests}
							</dd>
						</div>
					</dl>
				</div>
			)}

			<div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				<div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
					<h3 className="font-semibold text-zinc-900 dark:text-white">Recent executions</h3>
					<p className="text-xs text-zinc-500 dark:text-zinc-400">GET /api/executions/all</p>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
							<tr>
								<th className="px-6 py-3">ID</th>
								<th className="px-6 py-3">Status</th>
								<th className="px-6 py-3">Total</th>
								<th className="px-6 py-3">Passed</th>
								<th className="px-6 py-3">Failed</th>
								<th className="px-6 py-3">Time</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
							{executions.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
										No executions recorded yet.
									</td>
								</tr>
							) : (
								[...executions]
									.sort((a, b) => (b.id || 0) - (a.id || 0))
									.map((ex) => (
										<tr key={ex.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
											<td className="px-6 py-3 font-mono text-zinc-500">{ex.id}</td>
											<td className="px-6 py-3 font-medium">{ex.status}</td>
											<td className="px-6 py-3">{ex.totalTests}</td>
											<td className="px-6 py-3 text-emerald-600 dark:text-emerald-400">{ex.passedTests}</td>
											<td className="px-6 py-3 text-rose-600 dark:text-rose-400">{ex.failedTests}</td>
											<td className="px-6 py-3 text-zinc-600 dark:text-zinc-300">
												{ex.executionTime ? new Date(ex.executionTime).toLocaleString() : '—'}
											</td>
										</tr>
									))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
