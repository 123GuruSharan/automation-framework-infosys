export default function ImagePreviewModal({ isOpen, imageUrl, title, onClose }) {
	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Screenshot preview"
		>
			<button
				type="button"
				className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-[2px]"
				onClick={onClose}
				aria-label="Close overlay"
			/>
			<div className="relative z-10 flex max-h-[90vh] w-full max-w-[80vw] animate-fade-in-up flex-col rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:ring-zinc-700">
				<div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-2 pb-2 dark:border-zinc-700">
					<p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{title || 'Screenshot'}</p>
					<button
						type="button"
						onClick={onClose}
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
						aria-label="Close"
					>
						<span className="text-xl leading-none">&times;</span>
					</button>
				</div>
				<div className="overflow-auto p-2">
					{imageUrl ? (
						<div className="group relative mx-auto overflow-hidden rounded-lg">
							<img
								src={imageUrl}
								alt={title || 'Screenshot'}
								className="mx-auto max-h-[min(80vh,900px)] w-auto max-w-full rounded-lg object-contain shadow-lg transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.03]"
							/>
						</div>
					) : (
						<p className="py-8 text-center text-sm text-zinc-500">No image URL</p>
					)}
				</div>
			</div>
		</div>
	);
}
