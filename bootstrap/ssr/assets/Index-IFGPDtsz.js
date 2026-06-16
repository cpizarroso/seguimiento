import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { t as Modal } from "./Modal-B6sdQon2.js";
import { useForm } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region resources/js/pages/Contador/Index.tsx
function ContadorIndex({ contadores }) {
	const [selectedPuesto, setSelectedPuesto] = useState(null);
	const reiniciarForm = useForm({
		puesto_id: "",
		glosa: ""
	});
	const abrirReinicio = (contador) => {
		setSelectedPuesto(contador);
		reiniciarForm.setData("puesto_id", String(contador.puesto.id));
		reiniciarForm.setData("glosa", "");
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsx("h2", {
				className: "text-2xl font-bold text-patuju-green",
				children: "Administrar Contadores"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-sm text-gray-500",
				children: "Los contadores se reinician automáticamente cada año. Aquí puedes ver el estado actual y reiniciar manualmente si es necesario."
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
				children: contadores.map((item) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col h-full",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-lg font-semibold text-patuju-green",
							children: item.puesto.nombre
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-3 space-y-2 flex-1",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-gray-500",
										children: "Año:"
									}), /* @__PURE__ */ jsx("span", {
										className: "font-medium",
										children: item.contador?.year ?? now()
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-gray-500",
										children: "Último N°:"
									}), /* @__PURE__ */ jsx("span", {
										className: "font-medium",
										children: item.contador?.ultimo_numero ?? 0
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-gray-500",
										children: "Siguiente N°:"
									}), /* @__PURE__ */ jsx("span", {
										className: "font-bold text-patuju-green",
										children: (item.contador?.ultimo_numero ?? 0) + 1
									})]
								}),
								item.contador?.ultimo_reset_at && /* @__PURE__ */ jsxs("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-gray-500",
										children: "Último reinicio:"
									}), /* @__PURE__ */ jsx("span", {
										className: "font-medium text-xs",
										children: item.contador.ultimo_reset_at
									})]
								}),
								item.contador?.reset_glosa && /* @__PURE__ */ jsxs("div", {
									className: "mt-2 p-2 rounded bg-patuju-yellow/10 text-xs text-gray-600",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-medium",
										children: "Glosa de reinicio:"
									}), /* @__PURE__ */ jsx("p", { children: item.contador.reset_glosa })]
								})
							]
						}),
						/* @__PURE__ */ jsx(Button, {
							size: "sm",
							variant: "secondary",
							className: "mt-4 w-full",
							onClick: () => abrirReinicio(item),
							children: "Reiniciar Contador"
						})
					]
				}) }, item.puesto.id))
			}),
			contadores.length === 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx("p", {
				className: "text-center text-sm text-gray-500 py-4",
				children: "No hay puestos registrados. Crea un puesto primero."
			}) }),
			/* @__PURE__ */ jsx(Modal, {
				open: selectedPuesto !== null,
				onClose: () => setSelectedPuesto(null),
				title: `Reiniciar Contador - ${selectedPuesto?.puesto.nombre ?? ""}`,
				children: /* @__PURE__ */ jsxs("form", {
					onSubmit: (e) => {
						e.preventDefault();
						reiniciarForm.post("/contador/reiniciar", { onSuccess: () => setSelectedPuesto(null) });
					},
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsx(Input, {
							label: "Glosa del reinicio",
							placeholder: "Indique el motivo del reinicio...",
							value: reiniciarForm.data.glosa,
							onChange: (e) => reiniciarForm.setData("glosa", e.target.value)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-patuju-red/80",
							children: "⚠ Esta acción reiniciará el contador a 0. Los trámites existentes no se verán afectados."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex gap-3 pt-2",
							children: [/* @__PURE__ */ jsx(Button, {
								type: "submit",
								loading: reiniciarForm.processing,
								variant: "danger",
								children: "Reiniciar"
							}), /* @__PURE__ */ jsx(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => setSelectedPuesto(null),
								children: "Cancelar"
							})]
						})
					]
				})
			})
		]
	});
}
function now() {
	return (/* @__PURE__ */ new Date()).getFullYear();
}
//#endregion
export { ContadorIndex as default };
