/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand & UI Palette
        primary: {
          DEFAULT: "#334155", // slate
          dark: "#1E293B",
        },
        accent: {
          DEFAULT: "#0EA5E9", // sky
          dark: "#0284C7",
        },
        background: {
          DEFAULT: "#F8FAFC", // off-white
          card: "#FFFFFF",    // card surfaces
          hover: "#F1F5F9",   // hovers/row highlight
          overlay: "rgba(0,0,0,0.4)", // mobile sidebar overlay
        },
        muted: {
          DEFAULT: "#94A3B8", // borders, labels
        },
        success: {
          DEFAULT: "#22C55E",
          dark: "#16A34A",
        },
        error: {
          DEFAULT: "#D63352",
          dark: "#E11D48",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
        },
        textcolor: {
          DEFAULT: "#111827",    // primary text
          secondary: "#475569",  // secondary text
          muted: "#94A3B8",      // disabled/labels
        },
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        // ======================
        // 🔹 LAYOUT HELPERS
        // ======================
        ".layout-wrapper": {
          display: "flex",
          minHeight: "100vh",
          backgroundColor: theme("colors.background.DEFAULT"),
        },
        ".sidebar-base": {
          backgroundColor: theme("colors.background.card"),
          borderRight: `1px solid ${theme("colors.background.hover")}`,
          transition: "all 0.3s ease",
          height: "100vh",
        },
        ".sidebar-link": {
          display: "flex",
          alignItems: "center",
          padding: `${theme("spacing.2")} ${theme("spacing.3")}`,
          borderRadius: theme("borderRadius.lg"),
          transition: "all 0.2s ease",
          fontSize: theme("fontSize.sm")[0],
          color: theme("colors.textcolor.secondary"),
        },
        ".sidebar-link:hover": {
          backgroundColor: theme("colors.background.hover"),
        },
        ".sidebar-link-active": {
          backgroundColor: theme("colors.background.hover"),
          color: theme("colors.primary.DEFAULT"),
          fontWeight: theme("fontWeight.medium"),
        },
        ".navbar-base": {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${theme("spacing.4")} ${theme("spacing.6")}`,
          borderBottom: `1px solid ${theme("colors.background.hover")}`,
          backgroundColor: theme("colors.background.card"),
          position: "sticky",
          top: "0",
          zIndex: "20",
        },
        ".overlay": {
          backgroundColor: theme("colors.background.overlay"),
          position: "fixed",
          inset: "0",
          zIndex: "30",
        },

        // ======================
        // 🔹 BUTTONS
        // ======================
        ".btn-base": {
          padding: `${theme("spacing.2")} ${theme("spacing.5")}`,
          borderRadius: theme("borderRadius.lg"),
          fontWeight: theme("fontWeight.medium"),
          transition: "all 0.2s ease",
        },
        ".btn-primary": {
          "@apply btn-base": {},
          backgroundColor: theme("colors.primary.DEFAULT"),
          color: theme("colors.white"),
          "&:hover": { backgroundColor: theme("colors.primary.dark") },
        },
        ".btn-secondary": {
          "@apply btn-base": {},
          backgroundColor: theme("colors.background.card"),
          border: `1px solid ${theme("colors.muted.DEFAULT")}`,
          color: theme("colors.primary.DEFAULT"),
          "&:hover": { backgroundColor: theme("colors.background.hover") },
        },
        ".btn-danger": {
          "@apply btn-base": {},
          backgroundColor: theme("colors.error.DEFAULT"),
          color: theme("colors.white"),
          "&:hover": { backgroundColor: theme("colors.error.dark") },
        },
        ".btn-success": {
          "@apply btn-base": {},
          backgroundColor: theme("colors.success.DEFAULT"),
          color: theme("colors.white"),
          "&:hover": { backgroundColor: theme("colors.success.dark") },
        },
        ".btn-warning": {
          "@apply btn-base": {},
          backgroundColor: theme("colors.warning.DEFAULT"),
          color: theme("colors.white"),
          "&:hover": { backgroundColor: theme("colors.warning.dark") },
        },

//         // ======================
//         // 🔹 INPUTS
//         // ======================
//         // inside addComponents
// ".input-base": {
//   width: "100%",
//   padding: `${theme("spacing.3")} ${theme("spacing.4")}`,
//   borderRadius: theme("borderRadius.lg"), // thoda aur rounded
//   borderWidth: "1px",
//   borderColor: theme("colors.gray.300"),  // halka gray border
//   backgroundColor: theme("colors.white"), // pure white bg
//   color: theme("colors.textcolor.DEFAULT"),
//   fontSize: theme("fontSize.sm")[0],
//   lineHeight: theme("lineHeight.snug"),
//   transition: "all 0.2s ease",
//   "&::placeholder": {
//     color: theme("colors.textcolor.muted"),
//     opacity: "0.8",
//   },
//   "&:hover": {
//     borderColor: theme("colors.gray.400"),
//   },
//   "&:focus": {
//     outline: "none",
//     borderColor: theme("colors.accent.DEFAULT"), // sky blue focus
//     boxShadow: `0 0 0 3px ${theme("colors.accent.DEFAULT")}33`,
//   },
// },


// ".input-with-icon": {
//   "@apply input-base": {},
//   paddingLeft: theme("spacing.10"),
//   position: "relative",
// },

// ".input-success": {
//   "@apply input-base": {},
//   borderColor: theme("colors.success.DEFAULT"),
//   backgroundColor: `${theme("colors.success.DEFAULT")}0d`,
//   "&:focus": {
//     borderColor: theme("colors.success.dark"),
//     boxShadow: `0 0 0 3px ${theme("colors.success.DEFAULT")}33`,
//   },
// },

// ".input-error": {
//   "@apply input-base": {},
//   borderColor: theme("colors.error.DEFAULT"),
//   backgroundColor: `${theme("colors.error.DEFAULT")}0d`,
//   "&:focus": {
//     borderColor: theme("colors.error.dark"),
//     boxShadow: `0 0 0 3px ${theme("colors.error.DEFAULT")}33`,
//   },
// },



        // ======================
        // 🔹 CARDS
        // ======================
        ".card": {
          backgroundColor: theme("colors.background.card"),
          borderRadius: theme("borderRadius.lg"),
          boxShadow: theme("boxShadow.md"),
          padding: theme("spacing.6"),
        },
        ".card-header": {
          fontWeight: theme("fontWeight.semibold"),
          fontSize: theme("fontSize.lg")[0],
          marginBottom: theme("spacing.4"),
          color: theme("colors.textcolor.DEFAULT"),
        },
        ".card-body": {
          fontSize: theme("fontSize.sm")[0],
          color: theme("colors.textcolor.secondary"),
        },

        // ======================
        // 🔹 BADGES
        // ======================
        ".badge": {
          display: "inline-block",
          padding: `${theme("spacing.1")} ${theme("spacing.2")}`,
          borderRadius: theme("borderRadius.full"),
          fontSize: theme("fontSize.xs")[0],
          fontWeight: theme("fontWeight.medium"),
          textTransform: "uppercase",
        },
        ".badge-success": {
          "@apply badge": {},
          backgroundColor: `${theme("colors.success.DEFAULT")}22`,
          color: theme("colors.success.dark"),
        },
        ".badge-error": {
          "@apply badge": {},
          backgroundColor: `${theme("colors.error.DEFAULT")}22`,
          color: theme("colors.error.dark"),
        },
        ".badge-warning": {
          "@apply badge": {},
          backgroundColor: `${theme("colors.warning.DEFAULT")}22`,
          color: theme("colors.warning.dark"),
        },
        ".badge-info": {
          "@apply badge": {},
          backgroundColor: `${theme("colors.accent.DEFAULT")}22`,
          color: theme("colors.accent.dark"),
        },
      });
    },
  ],
};
