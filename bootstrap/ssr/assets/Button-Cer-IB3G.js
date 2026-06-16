import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/components/ui/Button.tsx
var variantClasses = {
	primary: "bg-patuju-green text-white hover:bg-patuju-green/90",
	secondary: "bg-patuju-cream text-patuju-green border border-patuju-green/30 hover:bg-patuju-cream/80",
	danger: "bg-patuju-red text-white hover:bg-patuju-red/90"
};
var sizeClasses = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-sm",
	lg: "px-6 py-3 text-base"
};
function Button({ variant = "primary", size = "md", loading = false, disabled, children, className = "", ...props }) {
	return /* @__PURE__ */ jsxs("button", {
		className: `inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-patuju-green/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`,
		disabled: disabled || loading,
		...props,
		children: [loading && /* @__PURE__ */ jsxs("svg", {
			className: "mr-2 h-4 w-4 animate-spin",
			viewBox: "0 0 24 24",
			children: [/* @__PURE__ */ jsx("circle", {
				className: "opacity-25",
				cx: "12",
				cy: "12",
				r: "10",
				stroke: "currentColor",
				strokeWidth: "4",
				fill: "none"
			}), /* @__PURE__ */ jsx("path", {
				className: "opacity-75",
				fill: "currentColor",
				d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			})]
		}), children]
	});
}
//#endregion
export { Button as t };
