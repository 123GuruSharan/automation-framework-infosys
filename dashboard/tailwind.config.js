/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
			},
			boxShadow: {
				card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
				'card-lg': '0 10px 40px -10px rgb(0 0 0 / 0.12)',
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
				},
			},
			animation: {
				'fade-in': 'fade-in 0.35s ease-out forwards',
				'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
			},
		},
	},
	plugins: [],
}
