import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
//#region resources/js/components/ui/Modal.tsx
function Modal({ open, onClose, title, children }) {
	useEffect(() => {
		if (open) document.body.style.overflow = "hidden";
		else document.body.style.overflow = "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);
	if (!open) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center",
		children: [/* @__PURE__ */ jsx("div", {
			className: "absolute inset-0 bg-black/50",
			onClick: onClose
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative z-10 w-full max-w-lg rounded-xl bg-patuju-white p-6 shadow-xl",
			children: [title && /* @__PURE__ */ jsxs("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold text-patuju-green",
					children: title
				}), /* @__PURE__ */ jsx("button", {
					onClick: onClose,
					className: "text-gray-400 hover:text-gray-600 text-xl leading-none",
					children: "×"
				})]
			}), children]
		})]
	});
}
//#endregion
export { Modal as t };
