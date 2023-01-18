/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        slideTitle: "0.5s ease-out 0s 1 slideTitle",
        slideAvatar: "0.5s ease-out 0s 1 slideAvatar",
        slideBio: "0.75s ease-out 0s 1 slideBio",
        slideFindMe: "1s ease-out 0s 1 slideFindMe",
        slideRepositories: "1.25s ease-out 0s 1 slideRepositories",
      },
      keyframes: {
        slideTitle: {
          "0%": {
            transform: "translateY(-20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        slideAvatar: {
          "0%": {
            transform: "translateY(-20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        slideBio: {
          "0%": {
            transform: "translateX(-20px)",
            opacity: "0",
          },
          "33%": {
            transform: "translateX(-20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        slideFindMe: {
          "0%": {
            transform: "translateX(20px)",
            opacity: "0",
          },
          "50%": {
            transform: "translateX(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        slideRepositories: {
          "0%": {
            opacity: "0",
          },
          "60%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [],
};
