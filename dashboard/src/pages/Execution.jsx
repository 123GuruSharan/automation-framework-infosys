import { useCallback, useEffect, useState } from 'react';
import ExecutionReportModal from '../components/ExecutionReportModal';
import ExecutionLogsModal from '../components/ExecutionLogsModal';
import Tooltip from '../components/Tooltip';
import { executionsApi, reportsApi, resultsApi, testSuitesApi } from '../services/api';
import { getImageUrl } from '../utils/screenshotUrl';

export default function Execution() {
	const [suites, setSuites] = useState([]);
	const [executions, setExecutions] = useState([]);
	const [suiteId, setSuiteId] = useState('');
	const [running, setRunning] = useState(false);
	const [error, setError] = useState(null);
	const [lastResult, setLastResult] = useState(null);
	const [reportExecutionId, setReportExecutionId] = useState(null);

	/** First screenshot filesystem path per execution id (from report API), null = none / not loaded */
	const [screenshotPathByExecutionId, setScreenshotPathByExecutionId] = useState({});

	const [selectedImage, setSelectedImage] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [logsExecutionId, setLogsExecutionId] = useState(null);
	const [suiteResults, setSuiteResults] = useState(null);
	const [suiteResultsLoading, setSuiteResultsLoading] = useState(false);
	const [suiteResultsError, setSuiteResultsError] = useState(null);

	const closeModal = useCallback(() => {
		setIsModalOpen(false);
		setSelectedImage(null);
	}, []);

	const openScreenshotPreview = useCallback((rawPath) => {
		const url = getImageUrl(rawPath);
		if (!url) {
			return;
		}
		setSelectedImage(url);
		setIsModalOpen(true);
	}, []);

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

	useEffect(() => {
		setSuiteResults(null);
		setSuiteResultsError(null);
	}, [suiteId]);

	const canViewReport = (ex) => ex.status === 'COMPLETED' && (ex.totalTests ?? 0) > 0;

	/** Load first screenshot path per execution so the table can show View vs — */
	useEffect(() => {
		if (!executions.length) {
			setScreenshotPathByExecutionId({});
			return;
		}
		let cancelled = false;
		(async () => {
			const eligible = executions.filter(
				(ex) => ex.status === 'COMPLETED' && (ex.totalTests ?? 0) > 0,
			);
			const entries = await Promise.all(
				eligible.map(async (ex) => {
					try {
						const { data } = await executionsApi.getReport(ex.id);
						const rows = Array.isArray(data?.rows) ? data.rows : [];
						const allPaths = rows.map((r) => r?.screenshotPath).filter(Boolean);
						const preferred = allPaths.length ? allPaths[allPaths.length - 1] : null;
						return [ex.id, preferred];
					} catch {
						return [ex.id, null];
					}
				}),
			);
			if (cancelled) {
				return;
			}
			const next = {};
			for (const [id, path] of entries) {
				next[id] = path;
			}
			setScreenshotPathByExecutionId(next);
		})();
		return () => {
			cancelled = true;
		};
	}, [executions]);

	const loadSuiteResults = async () => {
		const id = Number(suiteId);
		if (!id) {
			setSuiteResultsError('Select a test suite first');
			return;
		}
		setSuiteResultsLoading(true);
		setSuiteResultsError(null);
		try {
			const { data } = await resultsApi.getBySuite(id, { limit: 15 });
			setSuiteResults(data);
		} catch (e) {
			setSuiteResults(null);
			setSuiteResultsError(
				e?.response?.data?.message ||
					(typeof e?.response?.data === 'string' ? e.response.data : null) ||
					e?.message ||
					'Failed to load suite results',
			);
		} finally {
			setSuiteResultsLoading(false);
		}
	};

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

	const openReportDownload = (executionId, format) => {
		window.open(reportsApi.downloadUrl(executionId, format), '_blank', 'noopener,noreferrer');
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
				<div className="mt-6 flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={runSuite}
						disabled={running}
						className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
					>
						{running ? 'Running suite…' : 'Run test suite'}
					</button>
					<button
						type="button"
						onClick={loadSuiteResults}
						disabled={!suiteId || suiteResultsLoading}
						className="rounded-xl border border-violet-300 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
					>
						{suiteResultsLoading ? 'Loading…' : 'Suite history & pass rate'}
					</button>
				</div>
				<p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
					<code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GET /api/results/&#123;suiteId&#125;</code>
					— same integration as the Test suites page.
				</p>
				{suiteResultsError && (
					<div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
						{suiteResultsError}
					</div>
				)}
				{suiteResults && (
					<div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
						<p className="text-sm font-semibold text-zinc-900 dark:text-white">
							{suiteResults.suiteName}{' '}
							<span className="font-normal text-zinc-500 dark:text-zinc-400">
								({suiteResults.totalExecutions} run(s), overall pass {suiteResults.overallPassRate}%)
							</span>
						</p>
						{suiteResults.lastExecutionAt && (
							<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
								Last run: {new Date(suiteResults.lastExecutionAt).toLocaleString()}
							</p>
						)}
						<ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-zinc-700 dark:text-zinc-300">
							{(suiteResults.recentExecutions || []).map((r) => (
								<li key={r.id} className="flex justify-between gap-2 border-b border-zinc-200/80 pb-1 dark:border-zinc-600/50">
									<span className="font-mono text-zinc-500">#{r.id}</span>
									<span>{r.status}</span>
									<span>
										{r.passedTests}/{r.totalTests} passed
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
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
					{canViewReport(lastResult) && (
						<div className="mt-4 flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => setReportExecutionId(lastResult.id)}
								className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
							>
								View full report
							</button>
							<button
								type="button"
								onClick={() => setLogsExecutionId(lastResult.id)}
								className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
							>
								View logs
							</button>
							<button
								type="button"
								onClick={() => openReportDownload(lastResult.id, 'csv')}
								className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								CSV
							</button>
							<button
								type="button"
								onClick={() => openReportDownload(lastResult.id, 'html')}
								className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								HTML
							</button>
							<button
								type="button"
								onClick={() => openReportDownload(lastResult.id, 'junit')}
								className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								JUnit
							</button>
						</div>
					)}
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
								<th className="px-6 py-3">Logs</th>
								<th className="px-6 py-3">Export</th>
								<th className="px-6 py-3">Screenshot</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
							{executions.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-6 py-8 text-center text-zinc-500">
										No executions recorded yet.
									</td>
								</tr>
							) : (
								[...executions]
									.sort((a, b) => (b.id || 0) - (a.id || 0))
									.map((ex) => {
										const rawPath = screenshotPathByExecutionId[ex.id];
										const hasScreenshot = Boolean(rawPath);
										const hasFailures = (ex.failedTests ?? 0) > 0;
										return (
											<tr
												key={ex.id}
												className={`transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
													hasFailures
														? 'bg-rose-50/60 dark:bg-rose-950/25'
														: ''
												}`}
											>
												<td className="px-6 py-3 font-mono text-zinc-500">{ex.id}</td>
												<td className="px-6 py-3 font-medium">{ex.status}</td>
												<td className="px-6 py-3">{ex.totalTests}</td>
												<td className="px-6 py-3 text-emerald-600 dark:text-emerald-400">
													{ex.passedTests}
												</td>
												<td
													className={`px-6 py-3 font-semibold ${
														hasFailures
															? 'text-rose-700 dark:text-rose-400'
															: 'text-rose-600 dark:text-rose-400'
													}`}
												>
													{ex.failedTests}
												</td>
												<td className="px-6 py-3 text-zinc-600 dark:text-zinc-300">
													{ex.executionTime ? new Date(ex.executionTime).toLocaleString() : '—'}
												</td>
												<td className="px-6 py-3">
													<button
														type="button"
														onClick={() => setLogsExecutionId(ex.id)}
														className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
													>
														View logs
													</button>
												</td>
												<td className="px-6 py-3">
													<div className="flex flex-wrap gap-2">
														<button
															type="button"
															onClick={() => openReportDownload(ex.id, 'csv')}
															className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
														>
															CSV
														</button>
														<button
															type="button"
															onClick={() => openReportDownload(ex.id, 'html')}
															className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
														>
															HTML
														</button>
														<button
															type="button"
															onClick={() => openReportDownload(ex.id, 'junit')}
															className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
														>
															JUnit
														</button>
													</div>
												</td>
												<td className="px-6 py-3">
													{hasScreenshot ? (
														<Tooltip text="View failure screenshot">
															<button
																type="button"
																onClick={() => openScreenshotPreview(rawPath)}
																className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-500/30 active:scale-[0.97]"
															>
																View
															</button>
														</Tooltip>
													) : (
														<span className="text-xs text-zinc-400">
															{hasFailures ? 'No screenshot (API/no UI fail)' : '—'}
														</span>
													)}
												</td>
											</tr>
										);
									})
							)}
						</tbody>
					</table>
				</div>
			</div>

			<ExecutionReportModal
				isOpen={reportExecutionId != null}
				executionId={reportExecutionId}
				onClose={() => setReportExecutionId(null)}
			/>
			<ExecutionLogsModal
				isOpen={logsExecutionId != null}
				executionId={logsExecutionId}
				onClose={() => setLogsExecutionId(null)}
			/>

			{/* Screenshot preview modal — mount when open so fade-in animation runs reliably */}
			{isModalOpen && selectedImage && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center p-4" aria-hidden={false}>
					<button
						type="button"
						className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-[2px]"
						onClick={closeModal}
						aria-label="Close modal"
					/>
					<div
						className="relative z-10 flex max-h-[90vh] w-full max-w-[80vw] animate-fade-in-up flex-col rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700"
						role="dialog"
						aria-modal="true"
						aria-label="Screenshot preview"
					>
						<div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-2 pb-2 dark:border-zinc-800">
							<p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">Screenshot</p>
							<button
								type="button"
								onClick={closeModal}
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
								aria-label="Close"
							>
								<span className="text-2xl leading-none">&times;</span>
							</button>
						</div>
						<div className="overflow-auto p-2">
							<div className="group relative mx-auto overflow-hidden rounded-lg">
								<img
									src={selectedImage}
									alt="Screenshot preview"
									className="mx-auto max-h-[min(80vh,880px)] w-auto max-w-full rounded-lg object-contain shadow-lg transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.03]"
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
