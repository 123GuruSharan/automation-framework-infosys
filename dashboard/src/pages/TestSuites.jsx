import { useEffect, useState } from 'react';
import { testSuitesApi } from '../services/api';

export default function TestSuites() {
	const [suites, setSuites] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');

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
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Organize cases into runnable suites.</p>
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
						</div>
					))
				)}
			</div>
		</div>
	);
}
