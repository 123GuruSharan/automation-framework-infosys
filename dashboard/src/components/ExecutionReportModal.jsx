import { useEffect, useState } from 'react';
import { executionsApi, logsApi, reportsApi } from '../services/api';
import { getImageUrl } from '../utils/screenshotUrl';
import ImagePreviewModal from './ImagePreviewModal';
import Tooltip from './Tooltip';

export default function ExecutionReportModal({ isOpen, executionId, onClose }) {
	const [report, setReport] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [preview, setPreview] = useState({ url: null, title: '' });
	const [activeTab, setActiveTab] = useState('report');
	const [logs, setLogs] = useState([]);
	const [logsLoading, setLogsLoading] = useState(false);
	const [logsError, setLogsError] = useState(null);

	useEffect(() => {
		if (!isOpen || executionId == null) {
			setReport(null);
			setError(null);
			setLogs([]);
			setLogsError(null);
			setActiveTab('report');
			return;
		}
		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const { data } = await executionsApi.getReport(executionId);
				if (!cancelled) {
					setReport(data);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e?.response?.data?.message || e?.message || 'Failed to load report');
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isOpen, executionId]);

	useEffect(() => {
		if (!isOpen || executionId == null || activeTab !== 'logs') {
			return;
		}
		let cancelled = false;
		(async () => {
			setLogsLoading(true);
			setLogsError(null);
			try {
				const { data } = await logsApi.getByExecution(executionId);
				if (!cancelled) {
					setLogs(Array.isArray(data) ? data : []);
				}
			} catch (e) {
				if (!cancelled) {
					setLogsError(e?.response?.data?.message || e?.message || 'Failed to load logs');
				}
			} finally {
				if (!cancelled) {
					setLogsLoading(false);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [activeTab, executionId, isOpen]);

	if (!isOpen) {
		return null;
	}

	const rows = Array.isArray(report?.rows) ? report.rows : [];
	const openReportDownload = (format) => {
		if (executionId == null) return;
		window.open(reportsApi.downloadUrl(executionId, format), '_blank', 'noopener,noreferrer');
	};

	const levelClass = (level) => {
		switch ((level || '').toUpperCase()) {
			case 'ERROR':
				return 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200';
			case 'WARN':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
			case 'DEBUG':
				return 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200';
			default:
				return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200';
		}
	};

	return (
		<>
			<div
				className="fixed inset-0 z-50 flex items-center justify-center p-4"
				role="dialog"
				aria-modal="true"
				aria-labelledby="report-modal-title"
			>
				<button
					type="button"
					className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
					onClick={onClose}
					aria-label="Close report"
				/>
				<div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl animate-fade-in-up flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700">
					<div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
						<div>
							<h2 id="report-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
								Execution report
							</h2>
							{report && (
								<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
									Execution #{report.executionId} · Suite duration {report.suiteDurationMs ?? 0} ms
								</p>
							)}
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => openReportDownload('csv')}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								CSV
							</button>
							<button
								type="button"
								onClick={() => openReportDownload('html')}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								HTML
							</button>
							<button
								type="button"
								onClick={() => openReportDownload('junit')}
								className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								JUnit
							</button>
							<button
								type="button"
								onClick={onClose}
								className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
								aria-label="Close"
							>
								<span className="text-2xl leading-none">&times;</span>
							</button>
						</div>
					</div>
					<div className="overflow-y-auto px-2 pb-4 sm:px-4">
						<div className="px-2 pt-3">
							<div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/70">
								<button
									type="button"
									onClick={() => setActiveTab('report')}
									className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
										activeTab === 'report'
											? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100'
											: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
									}`}
								>
									Report
								</button>
								<button
									type="button"
									onClick={() => setActiveTab('logs')}
									className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
										activeTab === 'logs'
											? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100'
											: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
									}`}
								>
									Logs
								</button>
							</div>
						</div>
						{loading && <p className="px-3 py-8 text-center text-sm text-zinc-500">Loading report…</p>}
						{error && (
							<p className="px-3 py-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p>
						)}
						{!loading && !error && activeTab === 'report' && rows.length === 0 && (
							<p className="px-3 py-8 text-center text-sm text-zinc-500">No test case rows for this run.</p>
						)}
						{!loading && !error && activeTab === 'report' && rows.length > 0 && (
							<div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
								<table className="min-w-full text-left text-sm">
									<thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
										<tr>
											<th className="px-4 py-3">Test case</th>
											<th className="px-4 py-3">Status</th>
											<th className="px-4 py-3">Duration</th>
											<th className="px-4 py-3">Screenshot</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
										{rows.map((row, idx) => {
											const url = getImageUrl(row.screenshotPath);
											const hasShot = Boolean(url);
											const isFail = row.status === 'FAIL';
											return (
												<tr
													key={`${row.testCaseName}-${idx}`}
													className={
														isFail
															? 'border-l-4 border-l-rose-500 bg-rose-50/80 transition-colors dark:border-l-rose-400 dark:bg-rose-950/35'
															: 'transition-colors'
													}
												>
													<td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
														{row.testCaseName}
													</td>
													<td className="px-4 py-3">
														<span
															className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
																row.status === 'PASS'
																	? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
																	: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
															}`}
														>
															{row.status}
														</span>
													</td>
													<td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
														{row.durationMs != null ? `${row.durationMs} ms` : '—'}
													</td>
													<td className="px-4 py-3">
														{hasShot ? (
															<Tooltip text="View failure screenshot">
																<button
																	type="button"
																	onClick={() =>
																		setPreview({
																			url,
																			title: row.testCaseName || 'Screenshot',
																		})
																	}
																	className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-500/30 active:scale-[0.97]"
																>
																	View
																</button>
															</Tooltip>
														) : (
															<span className="text-zinc-400">—</span>
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
						{activeTab === 'logs' && (
							<div className="px-2 pt-3">
								{logsLoading && <p className="px-3 py-8 text-center text-sm text-zinc-500">Loading logs…</p>}
								{logsError && (
									<p className="px-3 py-8 text-center text-sm text-rose-600 dark:text-rose-400">{logsError}</p>
								)}
								{!logsLoading && !logsError && logs.length === 0 && (
									<p className="px-3 py-8 text-center text-sm text-zinc-500">No logs for this execution.</p>
								)}
								{!logsLoading && !logsError && logs.length > 0 && (
									<div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
										<table className="min-w-full text-left text-sm">
											<thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
												<tr>
													<th className="px-4 py-3">Time</th>
													<th className="px-4 py-3">Level</th>
													<th className="px-4 py-3">Source</th>
													<th className="px-4 py-3">Message</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
												{logs.map((row) => (
													<tr key={row.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
														<td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
															{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
														</td>
														<td className="px-4 py-3">
															<span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${levelClass(row.level)}`}>
																{row.level || 'INFO'}
															</span>
														</td>
														<td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{row.source || '—'}</td>
														<td className="max-w-[540px] px-4 py-3 text-zinc-800 dark:text-zinc-100">{row.message}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
			<ImagePreviewModal
				isOpen={Boolean(preview.url)}
				imageUrl={preview.url}
				title={preview.title}
				onClose={() => setPreview({ url: null, title: '' })}
			/>
		</>
	);
}
