import { jsx } from "react/jsx-runtime";
//#region resources/js/components/ui/Card.tsx
var paddingClasses = {
	sm: "p-4",
	md: "p-6",
	lg: "p-8"
};
function Card({ padding = "md", className = "", children, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: `rounded-xl bg-patuju-cream shadow-sm border border-patuju-green/10 ${paddingClasses[padding]} ${className}`,
		...props,
		children
	});
}
//#endregion
export { Card as t };
