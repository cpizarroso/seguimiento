import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/components/ui/Pagination.tsx
function Pagination({ currentPage, lastPage, onPageChange }) {
	if (lastPage <= 1) return null;
	const pages = [];
	for (let i = 1; i <= lastPage; i++) pages.push(i);
	return /* @__PURE__ */ jsxs("nav", {
		className: "flex items-center justify-center gap-1 mt-4",
		children: [
			/* @__PURE__ */ jsx("button", {
				onClick: () => onPageChange(currentPage - 1),
				disabled: currentPage === 1,
				className: "px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-patuju-cream",
				children: "Anterior"
			}),
			pages.map((page) => /* @__PURE__ */ jsx("button", {
				onClick: () => onPageChange(page),
				className: `px-3 py-1 text-sm rounded border ${page === currentPage ? "bg-patuju-green text-white border-patuju-green" : "border-gray-300 hover:bg-patuju-cream"}`,
				children: page
			}, page)),
			/* @__PURE__ */ jsx("button", {
				onClick: () => onPageChange(currentPage + 1),
				disabled: currentPage === lastPage,
				className: "px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-patuju-cream",
				children: "Siguiente"
			})
		]
	});
}
//#endregion
export { Pagination as t };
