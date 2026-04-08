import { useEffect, useState } from 'react';
import { schedulesApi, testSuitesApi } from '../services/api';

const CRON_PRESETS = [
	{ label: 'Every 1 min', value: '0 * * * * *' },
	{ label: 'Every 5 min', value: '0 */5 * * * *' },
	{ label: 'Hourly', value: '0 0 * * * *' },
	{ label: 'Daily (midnight)', value: '0 0 0 * * *' },
];

function isLikelyValidSpringCron(value) {
	const v = (value || '').trim();
	if (!v) return false;
	const parts = v.split(/\s+/);
	if (parts.length !== 6) return false;
	return parts.every((p) => /^[\d*/,\-?LW#A-Z]+$/i.test(p));
}

export default function Schedules() {
	const [schedules, setSchedules] = useState([]);
	const [suites, setSuites] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	const [name, setName] = useState('');
	const [testSuiteId, setTestSuiteId] = useState('');
	const [cronExpression, setCronExpression] = useState('0 */5 * * * *');
	const cronValid = isLikelyValidSpringCron(cronExpression);

	const load = async () => {
		setError(null);
		try {
			const [{ data: suiteData }, { data: scheduleData }] = await Promise.all([
				testSuitesApi.getAll(),
				schedulesApi.getAll(),
			]);
			setSuites(Array.isArray(suiteData) ? suiteData : []);
			setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load schedules');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const onCreate = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			await schedulesApi.create({
				name: name || null,
				testSuiteId: Number(testSuiteId),
				cronExpression: cronExpression.trim(),
			});
			setSuccess('Schedule created');
			setName('');
			setCronExpression('0 */5 * * * *');
			await load();
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Create schedule failed');
		} finally {
			setSaving(false);
		}
	};

	const toggleEnabled = async (schedule) => {
		setError(null);
		setSuccess(null);
		try {
			await schedulesApi.setEnabled(schedule.id, !schedule.enabled);
			setSuccess(`Schedule #${schedule.id} ${schedule.enabled ? 'disabled' : 'enabled'}`);
			await load();
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Update failed');
		}
	};

	const runNow = async (id) => {
		setError(null);
		setSuccess(null);
		try {
			await schedulesApi.runNow(id);
			setSuccess(`Schedule #${id} triggered`);
			await load();
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Run now failed');
		}
	};

	if (loading) return <p className="text-zinc-500">Loading schedules…</p>;

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Schedules</h2>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					Automate suite execution using cron expressions.
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
				onSubmit={onCreate}
				className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-zinc-900"
			>
				<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">New schedule</h3>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">POST /api/schedules/create</p>
				<div className="mt-6 grid gap-4 sm:max-w-xl">
					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Name
						</span>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Nightly smoke run"
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950"
						/>
					</label>

					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Test suite
						</span>
						<select
							required
							value={testSuiteId}
							onChange={(e) => setTestSuiteId(e.target.value)}
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

					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Cron expression
						</span>
						<div className="mt-1 flex flex-wrap gap-2">
							{CRON_PRESETS.map((preset) => (
								<button
									key={preset.value}
									type="button"
									onClick={() => setCronExpression(preset.value)}
									className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
										cronExpression.trim() === preset.value
											? 'bg-indigo-600 text-white'
											: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
									}`}
								>
									{preset.label}
								</button>
							))}
						</div>
						<input
							required
							value={cronExpression}
							onChange={(e) => setCronExpression(e.target.value)}
							placeholder="0 */5 * * * *"
							className={`mt-2 w-full rounded-xl border bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-4 dark:bg-zinc-950 ${
								cronValid
									? 'border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-zinc-700'
									: 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-700'
							}`}
						/>
						<p
							className={`mt-1 text-xs ${cronValid ? 'text-zinc-500 dark:text-zinc-400' : 'text-rose-600 dark:text-rose-400'}`}
						>
							Spring cron has 6 fields (second minute hour day month weekday). Example every 5 mins:
							<code className="ml-1">0 */5 * * * *</code>
						</p>
					</label>

					<button
						type="submit"
						disabled={saving || !cronValid}
						className="w-fit rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500 disabled:opacity-60"
					>
						{saving ? 'Saving…' : 'Create schedule'}
					</button>
				</div>
			</form>

			<div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				<div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
					<h3 className="font-semibold text-zinc-900 dark:text-white">Existing schedules</h3>
					<p className="text-xs text-zinc-500 dark:text-zinc-400">GET /api/schedules/all</p>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
							<tr>
								<th className="px-6 py-3">ID</th>
								<th className="px-6 py-3">Name</th>
								<th className="px-6 py-3">Suite</th>
								<th className="px-6 py-3">Cron</th>
								<th className="px-6 py-3">Enabled</th>
								<th className="px-6 py-3">Last run</th>
								<th className="px-6 py-3">Next run</th>
								<th className="px-6 py-3">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
							{schedules.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
										No schedules yet.
									</td>
								</tr>
							) : (
								schedules.map((s) => (
									<tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
										<td className="px-6 py-3 font-mono text-zinc-500">#{s.id}</td>
										<td className="px-6 py-3 font-medium">{s.name}</td>
										<td className="px-6 py-3">
											{s.testSuite?.name ? `${s.testSuite.name} (#${s.testSuite.id})` : `#${s.testSuite?.id ?? '—'}`}
										</td>
										<td className="px-6 py-3 font-mono text-xs">{s.cronExpression}</td>
										<td className="px-6 py-3">
											<span
												className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
													s.enabled
														? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
														: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
												}`}
											>
												{s.enabled ? 'ON' : 'OFF'}
											</span>
										</td>
										<td className="px-6 py-3 text-zinc-600 dark:text-zinc-300">
											{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}
										</td>
										<td className="px-6 py-3 text-zinc-600 dark:text-zinc-300">
											{s.nextRunAt ? new Date(s.nextRunAt).toLocaleString() : '—'}
										</td>
										<td className="px-6 py-3">
											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													onClick={() => runNow(s.id)}
													className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
												>
													Run now
												</button>
												<button
													type="button"
													onClick={() => toggleEnabled(s)}
													className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
												>
													{s.enabled ? 'Disable' : 'Enable'}
												</button>
											</div>
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
