/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
    ],
    theme: {
        extend: {
            colors: {
                ptf: {
                    red: '#b91c1c',     /* Primary Red */
                    maroon: '#800000',  /* Darker Red/Maroon */
                    light: '#fef2f2',   /* Very light red (red-50) */
                    accent: '#e67e22',
                },
            },
            fontFamily: {
                serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
            }
        },
    },
    plugins: [],
}
