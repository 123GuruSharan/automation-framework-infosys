import { useEffect, useState } from 'react';
import { testCasesApi, testSuitesApi } from '../services/api';

const emptyForm = {
	name: '',
	description: '',
	type: 'UI',
	status: 'PENDING',
	testSuiteId: '',
	url: '',
	expectedTitle: '',
};

export default function TestCases() {
	const [rows, setRows] = useState([]);
	const [suites, setSuites] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [editing, setEditing] = useState(null);

	const load = async () => {
		setError(null);
		try {
			const [casesRes, suitesRes] = await Promise.all([testCasesApi.getAll(), testSuitesApi.getAll()]);
			setRows(Array.isArray(casesRes.data) ? casesRes.data : []);
			setSuites(Array.isArray(suitesRes.data) ? suitesRes.data : []);
		} catch (e) {
			setError(e?.response?.data?.message || e?.message || 'Failed to load data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const onSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(null);
		const suiteId = Number(form.testSuiteId);
		if (!suiteId) {
			setError('Select a test suite');
			setSaving(false);
			return;
		}
		try {
			await testCasesApi.create({
				name: form.name,
				description: form.description || null,
				type: form.type,
				status: form.status,
				testSuiteId: suiteId,
				url: form.url || null,
				expectedTitle: form.expectedTitle || null,
			});
			setSuccess('Test case created');
			setForm(emptyForm);
			await load();
		} catch (e) {
			const msg =
				e?.response?.data?.message ||
				(typeof e?.response?.data === 'string' ? e.response.data : null) ||
				e?.message ||
				'Create failed';
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	const openEdit = (row) => {
		setError(null);
		setSuccess(null);
		setEditing({
			id: row.id,
			name: row.name || '',
			description: row.description || '',
			type: row.type || 'UI',
			status: row.status || 'PENDING',
			testSuiteId: String(row.testSuite?.id || row.testSuiteId || ''),
			url: row.url || '',
			expectedTitle: row.expectedTitle || '',
		});
	};

	const closeEdit = () => {
		setEditing(null);
	};

	const onEditSubmit = async (e) => {
		e.preventDefault();
		if (!editing?.id) return;
		const suiteId = Number(editing.testSuiteId);
		if (!suiteId) {
			setError('Select a test suite for edit');
			return;
		}
		setUpdating(true);
		setError(null);
		setSuccess(null);
		try {
			await testCasesApi.update(editing.id, {
				name: editing.name,
				description: editing.description || null,
				type: editing.type,
				status: editing.status,
				testSuiteId: suiteId,
				url: editing.url || null,
				expectedTitle: editing.expectedTitle || null,
			});
			setSuccess(`Test case #${editing.id} updated`);
			closeEdit();
			await load();
		} catch (e2) {
			const msg =
				e2?.response?.data?.message ||
				(typeof e2?.response?.data === 'string' ? e2.response.data : null) ||
				e2?.message ||
				'Update failed';
			setError(msg);
		} finally {
			setUpdating(false);
		}
	};

	if (loading) {
		return <p className="text-zinc-500">Loading test cases…</p>;
	}

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Test cases</h2>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">GET /api/testcases/all</p>
			</div>

			{error && (
				<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
					{String(error)}
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
				<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Create test case</h3>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">POST /api/testcases/create</p>
				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					<label className="block sm:col-span-2">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Name
						</span>
						<input
							required
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-indigo-400"
						/>
					</label>
					<label className="block sm:col-span-2">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Description
						</span>
						<textarea
							rows={2}
							value={form.description}
							onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-indigo-400"
						/>
					</label>
					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Type
						</span>
						<select
							value={form.type}
							onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
						>
							<option value="UI">UI</option>
							<option value="API">API</option>
						</select>
					</label>
					<label className="block">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Status
						</span>
						<select
							value={form.status}
							onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
						>
							<option value="PENDING">PENDING</option>
							<option value="PASS">PASS</option>
							<option value="FAIL">FAIL</option>
						</select>
					</label>
					<label className="block sm:col-span-2">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Test suite
						</span>
						<select
							required
							value={form.testSuiteId}
							onChange={(e) => setForm((f) => ({ ...f, testSuiteId: e.target.value }))}
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
					<label className="block sm:col-span-2">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							URL (UI tests)
						</span>
						<input
							value={form.url}
							onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
							placeholder="https://example.com"
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-indigo-400"
						/>
					</label>
					<label className="block sm:col-span-2">
						<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
							Expected title (UI tests)
						</span>
						<input
							value={form.expectedTitle}
							onChange={(e) => setForm((f) => ({ ...f, expectedTitle: e.target.value }))}
							placeholder="Example Domain"
							className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-indigo-400"
						/>
					</label>
				</div>
				<div className="mt-6">
					<button
						type="submit"
						disabled={saving}
						className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-60"
					>
						{saving ? 'Creating…' : 'Create test case'}
					</button>
				</div>
			</form>

			<div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card dark:border-zinc-800 dark:bg-zinc-900">
				<div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
					<h3 className="font-semibold text-zinc-900 dark:text-white">All test cases</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
							<tr>
								<th className="px-6 py-3">ID</th>
								<th className="px-6 py-3">Name</th>
								<th className="px-6 py-3">Type</th>
								<th className="px-6 py-3">Status</th>
								<th className="px-6 py-3">Suite</th>
								<th className="px-6 py-3">URL</th>
								<th className="px-6 py-3">Expected title</th>
								<th className="px-6 py-3">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
							{rows.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-6 py-10 text-center text-zinc-500">
										No test cases yet. Create a suite first, then add cases.
									</td>
								</tr>
							) : (
								rows.map((r) => (
									<tr key={r.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
										<td className="px-6 py-3 font-mono text-zinc-500">{r.id}</td>
										<td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-100">{r.name}</td>
										<td className="px-6 py-3">
											<span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
												{r.type}
											</span>
										</td>
										<td className="px-6 py-3">
											<span
												className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
													(r.status || '').toUpperCase() === 'PASS'
														? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
														: (r.status || '').toUpperCase() === 'FAIL'
															? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
															: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100'
												}`}
											>
												{r.status}
											</span>
										</td>
										<td className="px-6 py-3 text-zinc-600 dark:text-zinc-300">
											{r.testSuite?.name || r.testSuiteName || r.testSuite?.id || r.testSuiteId || '—'}
										</td>
										<td className="max-w-[220px] truncate px-6 py-3 text-zinc-600 dark:text-zinc-300">
											{r.url || '—'}
										</td>
										<td className="max-w-[220px] truncate px-6 py-3 text-zinc-600 dark:text-zinc-300">
											{r.expectedTitle || '—'}
										</td>
										<td className="px-6 py-3">
											<button
												type="button"
												onClick={() => openEdit(r)}
												className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
											>
												Edit
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{editing && (
				<div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
					<form
						onSubmit={onEditSubmit}
						className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
					>
						<h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Edit test case #{editing.id}</h3>
						<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">PATCH /api/testcases/{'{id}'}</p>
						<div className="mt-6 grid gap-4 sm:grid-cols-2">
							<label className="block sm:col-span-2">
								<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
									Name
								</span>
								<input
									required
									value={editing.name}
									onChange={(e) => setEditing((f) => ({ ...f, name: e.target.value }))}
									className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
								/>
							</label>
							<label className="block sm:col-span-2">
								<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
									Description
								</span>
								<textarea
									rows={2}
									value={editing.description}
									onChange={(e) => setEditing((f) => ({ ...f, description: e.target.value }))}
									className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
								/>
							</label>
							<label className="block">
								<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
									Type
								</span>
								<select
									value={editing.type}
									onChange={(e) => setEditing((f) => ({ ...f, type: e.target.value }))}
									className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
								>
									<option value="UI">UI</option>
									<option value="API">API</option>
								</select>
							</label>
							<label className="block">
								<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
									Status
								</span>
								<select
									value={editing.status}
									onChange={(e) => setEditing((f) => ({ ...f, status: e.target.value }))}
									className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
								>
									<option value="PENDING">PENDING</option>
									<option value="PASS">PASS</option>
									<option value="FAIL">FAIL</option>
								</select>
							</label>
							<label className="block sm:col-span-2">
								<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
									Test suite
								</span>
								<select
									required
									value={editing.testSuiteId}
									onChange={(e) => setEditing((f) => ({ ...f, testSuiteId: e.target.value }))}
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
							<label className="block sm:col-span-2">
								<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
									URL (UI tests)
								</span>
								<input
									value={editing.url}
									onChange={(e) => setEditing((f) => ({ ...f, url: e.target.value }))}
									className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
								/>
							</label>
							<label className="block sm:col-span-2">
								<span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
									Expected title (UI tests)
								</span>
								<input
									value={editing.expectedTitle}
									onChange={(e) => setEditing((f) => ({ ...f, expectedTitle: e.target.value }))}
									className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
								/>
							</label>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={closeEdit}
								className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={updating}
								className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
							>
								{updating ? 'Saving…' : 'Save changes'}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
