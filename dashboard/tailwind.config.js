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
		},
	},
	plugins: [],
}
