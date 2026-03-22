import { useEffect, useState } from 'react';
import { executionsApi } from '../services/api';
import { getImageUrl } from '../utils/screenshotUrl';
import ImagePreviewModal from './ImagePreviewModal';
import Tooltip from './Tooltip';

export default function ExecutionReportModal({ isOpen, executionId, onClose }) {
	const [report, setReport] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [preview, setPreview] = useState({ url: null, title: '' });

	useEffect(() => {
		if (!isOpen || executionId == null) {
			setReport(null);
			setError(null);
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

	if (!isOpen) {
		return null;
	}

	const rows = Array.isArray(report?.rows) ? report.rows : [];

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
						<button
							type="button"
							onClick={onClose}
							className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
							aria-label="Close"
						>
							<span className="text-2xl leading-none">&times;</span>
						</button>
					</div>
					<div className="overflow-y-auto px-2 pb-4 sm:px-4">
						{loading && <p className="px-3 py-8 text-center text-sm text-zinc-500">Loading report…</p>}
						{error && (
							<p className="px-3 py-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p>
						)}
						{!loading && !error && rows.length === 0 && (
							<p className="px-3 py-8 text-center text-sm text-zinc-500">No test case rows for this run.</p>
						)}
						{!loading && !error && rows.length > 0 && (
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
