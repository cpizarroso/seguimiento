import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/components/ui/Table.tsx
function Table({ columns, data, keyExtractor, emptyMessage = "No hay datos disponibles." }) {
	if (data.length === 0) return /* @__PURE__ */ jsx("div", {
		className: "py-8 text-center text-sm text-gray-500",
		children: emptyMessage
	});
	return /* @__PURE__ */ jsx("div", {
		className: "overflow-x-auto rounded-lg border border-gray-200",
		children: /* @__PURE__ */ jsxs("table", {
			className: "min-w-full divide-y divide-gray-200 text-sm",
			children: [/* @__PURE__ */ jsx("thead", {
				className: "bg-patuju-green text-white",
				children: /* @__PURE__ */ jsx("tr", { children: columns.map((col) => /* @__PURE__ */ jsx("th", {
					className: "px-4 py-3 text-left font-medium",
					children: col.header
				}, col.key)) })
			}), /* @__PURE__ */ jsx("tbody", {
				className: "divide-y divide-gray-100 bg-white",
				children: data.map((item) => /* @__PURE__ */ jsx("tr", {
					className: "hover:bg-patuju-cream/50 transition-colors",
					children: columns.map((col) => /* @__PURE__ */ jsx("td", {
						className: "px-4 py-3 text-gray-700",
						children: col.render ? col.render(item) : String(item[col.key] ?? "")
					}, col.key))
				}, keyExtractor(item)))
			})]
		})
	});
}
//#endregion
export { Table as t };
