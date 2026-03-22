/**
 * Hover-only tooltip; absolutely positioned above the trigger so it does not affect layout.
 */
export default function Tooltip({ children, text }) {
	return (
		<span className="group/tooltip relative inline-flex">
			{children}
			<span
				role="tooltip"
				className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg shadow-black/30 transition-[opacity,transform] duration-200 ease-out group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 dark:bg-zinc-950"
			>
				{text}
			</span>
		</span>
	);
}
