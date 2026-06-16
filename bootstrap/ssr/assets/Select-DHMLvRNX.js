import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/components/ui/Select.tsx
function Select({ label, error, options, placeholder, className = "", id, ...props }) {
	const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-1",
		children: [
			label && /* @__PURE__ */ jsx("label", {
				htmlFor: selectId,
				className: "block text-sm font-medium text-patuju-green",
				children: label
			}),
			/* @__PURE__ */ jsxs("select", {
				id: selectId,
				className: `block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green ${error ? "border-patuju-red" : "border-gray-300"} ${className}`,
				...props,
				children: [placeholder && /* @__PURE__ */ jsx("option", {
					value: "",
					children: placeholder
				}), options.map((opt) => /* @__PURE__ */ jsx("option", {
					value: opt.value,
					children: opt.label
				}, opt.value))]
			}),
			error && /* @__PURE__ */ jsx("p", {
				className: "text-xs text-patuju-red",
				children: error
			})
		]
	});
}
//#endregion
export { Select as t };
