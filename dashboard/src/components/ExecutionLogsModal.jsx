import { useEffect, useState } from 'react';
import { logsApi } from '../services/api';

export default function ExecutionLogsModal({ isOpen, executionId, onClose }) {
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!isOpen || executionId == null) {
			setRows([]);
			setError(null);
			return;
		}
		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const { data } = await logsApi.getByExecution(executionId);
				if (!cancelled) {
					setRows(Array.isArray(data) ? data : []);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e?.response?.data?.message || e?.message || 'Failed to load logs');
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
		<div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
			<button
				type="button"
				className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				aria-label="Close logs modal"
			/>
			<div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl animate-fade-in-up flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200/90 dark:bg-zinc-900 dark:ring-zinc-700">
				<div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
					<div>
						<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
							Execution logs
						</h2>
						<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Execution #{executionId}</p>
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
				<div className="overflow-y-auto px-3 pb-4 sm:px-4">
					{loading && <p className="px-3 py-8 text-center text-sm text-zinc-500">Loading logs…</p>}
					{error && <p className="px-3 py-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p>}
					{!loading && !error && rows.length === 0 && (
						<p className="px-3 py-8 text-center text-sm text-zinc-500">No logs for this execution.</p>
					)}
					{!loading && !error && rows.length > 0 && (
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
									{rows.map((row) => (
										<tr key={row.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
											<td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
												{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
											</td>
											<td className="px-4 py-3">
												<span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${levelClass(row.level)}`}>
													{row.level || 'INFO'}
												</span>
											</td>
											<td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
												{row.source || '—'}
											</td>
											<td className="max-w-[560px] px-4 py-3 text-zinc-800 dark:text-zinc-100">
												{row.message}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
