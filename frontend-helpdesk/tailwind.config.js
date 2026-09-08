/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        "headline-sm": ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        "title-md": ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["var(--font-inter)", "Inter", "sans-serif"],
        "body-default": ["var(--font-inter)", "Inter", "sans-serif"],
        "label-md": ["var(--font-inter)", "Inter", "sans-serif"],
        "label-sm": ["var(--font-inter)", "Inter", "sans-serif"],
        button: ["var(--font-inter)", "Inter", "sans-serif"],
        caption: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      fontSize: {
        display: ["48px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-default": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1.2", fontWeight: "500" }],
        "label-sm": ["13px", { lineHeight: "1.2", fontWeight: "500" }],
        button: ["14px", { lineHeight: "1", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
    },
  },
};

module.exports = config;
