import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { t as Select } from "./Select-DHMLvRNX.js";
import { useForm } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/pages/Tramites/Create.tsx
function TramitesCreate({ puestos }) {
	const { data, setData, post, processing, errors } = useForm({
		fecha: "",
		descripcion: "",
		numero_diamante: "",
		glosa: "",
		puesto_id: ""
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		post("/tramites");
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "text-2xl font-bold text-patuju-green",
			children: "Nuevo Trámite"
		}), /* @__PURE__ */ jsx(Card, {
			className: "max-w-2xl",
			children: /* @__PURE__ */ jsxs("form", {
				onSubmit: handleSubmit,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsx(Input, {
						label: "Fecha",
						type: "date",
						value: data.fecha,
						onChange: (e) => setData("fecha", e.target.value),
						error: errors.fecha
					}),
					/* @__PURE__ */ jsx(Select, {
						label: "Puesto (para numeración)",
						placeholder: "Seleccione un puesto",
						options: puestos.map((p) => ({
							value: String(p.id),
							label: p.nombre
						})),
						value: data.puesto_id,
						onChange: (e) => setData("puesto_id", e.target.value),
						error: errors.puesto_id
					}),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("label", {
							htmlFor: "descripcion",
							className: "block text-sm font-medium text-patuju-green",
							children: "Descripción"
						}),
						/* @__PURE__ */ jsx("textarea", {
							id: "descripcion",
							rows: 4,
							className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green",
							value: data.descripcion,
							onChange: (e) => setData("descripcion", e.target.value)
						}),
						errors.descripcion && /* @__PURE__ */ jsx("p", {
							className: "text-xs text-patuju-red",
							children: errors.descripcion
						})
					] }),
					/* @__PURE__ */ jsx(Input, {
						label: "Número Diamante",
						value: data.numero_diamante,
						onChange: (e) => setData("numero_diamante", e.target.value),
						error: errors.numero_diamante,
						placeholder: "Opcional"
					}),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("label", {
							htmlFor: "glosa",
							className: "block text-sm font-medium text-patuju-green",
							children: "Glosa"
						}),
						/* @__PURE__ */ jsx("textarea", {
							id: "glosa",
							rows: 3,
							className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green",
							value: data.glosa,
							onChange: (e) => setData("glosa", e.target.value)
						}),
						errors.glosa && /* @__PURE__ */ jsx("p", {
							className: "text-xs text-patuju-red",
							children: errors.glosa
						})
					] }),
					/* @__PURE__ */ jsxs("div", {
						className: "flex gap-3 pt-4",
						children: [/* @__PURE__ */ jsx(Button, {
							type: "submit",
							loading: processing,
							children: "Guardar"
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
export { TramitesCreate as default };
