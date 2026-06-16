import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/components/ui/Input.tsx
function Input({ label, error, className = "", id, ...props }) {
	const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-1",
		children: [
			label && /* @__PURE__ */ jsx("label", {
				htmlFor: inputId,
				className: "block text-sm font-medium text-patuju-green",
				children: label
			}),
			/* @__PURE__ */ jsx("input", {
				id: inputId,
				className: `block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green ${error ? "border-patuju-red" : "border-gray-300"} ${className}`,
				...props
			}),
			error && /* @__PURE__ */ jsx("p", {
				className: "text-xs text-patuju-red",
				children: error
			})
		]
	});
}
//#endregion
export { Input as t };
