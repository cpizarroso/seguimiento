import { jsx } from "react/jsx-runtime";
//#region resources/js/components/ui/Badge.tsx
var variantClasses = {
	default: "bg-gray-100 text-gray-700",
	success: "bg-patuju-green/10 text-patuju-green",
	warning: "bg-patuju-yellow/10 text-patuju-yellow",
	danger: "bg-patuju-red/10 text-patuju-red",
	info: "bg-blue-100 text-blue-700"
};
function Badge({ variant = "default", className = "", children, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`,
		...props,
		children
	});
}
//#endregion
export { Badge as t };
