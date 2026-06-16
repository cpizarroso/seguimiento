import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { useForm } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/pages/Puestos/Edit.tsx
function PuestosEdit({ puesto }) {
	const { data, setData, put, processing, errors } = useForm({
		nombre: puesto.nombre,
		descripcion: puesto.descripcion ?? ""
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		put(`/puestos/${puesto.id}`);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "text-2xl font-bold text-patuju-green",
			children: "Editar Puesto"
		}), /* @__PURE__ */ jsx(Card, {
			className: "max-w-2xl",
			children: /* @__PURE__ */ jsxs("form", {
				onSubmit: handleSubmit,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsx(Input, {
						label: "Nombre",
						value: data.nombre,
						onChange: (e) => setData("nombre", e.target.value),
						error: errors.nombre
					}),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("label", {
							htmlFor: "descripcion",
							className: "block text-sm font-medium text-patuju-green",
							children: "Descripción"
						}),
						/* @__PURE__ */ jsx("textarea", {
							id: "descripcion",
							rows: 3,
							className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green",
							value: data.descripcion,
							onChange: (e) => setData("descripcion", e.target.value)
						}),
						errors.descripcion && /* @__PURE__ */ jsx("p", {
							className: "text-xs text-patuju-red",
							children: errors.descripcion
						})
					] }),
					/* @__PURE__ */ jsxs("div", {
						className: "flex gap-3 pt-4",
						children: [/* @__PURE__ */ jsx(Button, {
							type: "submit",
							loading: processing,
							children: "Actualizar"
						}), /* @__PURE__ */ jsx(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => window.history.back(),
							children: "Cancelar"
						})]
					})
				]
			})
		})]
	});
}
//#endregion
export { PuestosEdit as default };
