import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { t as Select } from "./Select-DHMLvRNX.js";
import { useForm } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/pages/Funcionarios/Create.tsx
function FuncionariosCreate({ puestos }) {
	const { data, setData, post, processing, errors } = useForm({
		nombre: "",
		email: "",
		puesto_id: ""
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		post("/funcionarios");
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "text-2xl font-bold text-patuju-green",
			children: "Nuevo Funcionario"
		}), /* @__PURE__ */ jsx(Card, {
			className: "max-w-2xl",
			children: /* @__PURE__ */ jsxs("form", {
				onSubmit: handleSubmit,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-1 gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ jsx(Input, {
							label: "Nombre",
							value: data.nombre,
							onChange: (e) => setData("nombre", e.target.value),
							error: errors.nombre
						}), /* @__PURE__ */ jsx(Input, {
							label: "Email",
							type: "email",
							value: data.email,
							onChange: (e) => setData("email", e.target.value),
							error: errors.email
						})]
					}),
					/* @__PURE__ */ jsx(Select, {
						label: "Puesto de Trabajo",
						placeholder: "Seleccione un puesto",
						options: puestos.map((p) => ({
							value: String(p.id),
							label: p.nombre
						})),
						value: data.puesto_id,
						onChange: (e) => setData("puesto_id", e.target.value),
						error: errors.puesto_id
					}),
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
export { FuncionariosCreate as default };
