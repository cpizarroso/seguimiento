import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { t as Modal } from "./Modal-B6sdQon2.js";
import { t as Select } from "./Select-DHMLvRNX.js";
import { t as Table } from "./Table-BdngzARu.js";
import { t as Badge } from "./Badge-Dbmpxxc9.js";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region resources/js/pages/Tramites/Show.tsx
var estadoColors = {
	iniciado: "info",
	proceso: "warning",
	observado: "default",
	finalizado: "success"
};
var estadoLabels = {
	iniciado: "Iniciado",
	proceso: "Proceso",
	observado: "Observado",
	finalizado: "Finalizado"
};
function TramitesShow({ tramite, funcionarios }) {
	const { auth } = usePage().props;
	const funcionarioId = auth?.user?.funcionario_id;
	const [derivarOpen, setDerivarOpen] = useState(false);
	const [recepcionarOpen, setRecepcionarOpen] = useState(null);
	const derivarForm = useForm({
		derivado_a: "",
		glosa_derivacion: ""
	});
	const recepcionarForm = useForm({ glosa_recepcion: "" });
	const puedeDerivar = [
		"iniciado",
		"proceso",
		"observado"
	].includes(tramite.estado) && tramite.asignado?.id === funcionarioId;
	const puedeObservar = tramite.estado === "proceso" && tramite.asignado?.id === funcionarioId;
	const puedeFinalizar = ["proceso", "observado"].includes(tramite.estado) && tramite.asignado?.id === funcionarioId;
	const ultimaDerivacion = tramite.derivaciones?.at(-1);
	const puedeRecepcionar = ultimaDerivacion && !ultimaDerivacion.fecha_recepcion && ultimaDerivacion.derivado_a?.id === funcionarioId && tramite.estado !== "finalizado";
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ jsxs("h2", {
					className: "text-2xl font-bold text-patuju-green",
					children: [
						"Trámite N° ",
						tramite.numero_formateado,
						"/",
						tramite.year
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-2",
					children: [
						puedeDerivar && /* @__PURE__ */ jsx(Button, {
							onClick: () => setDerivarOpen(true),
							children: "Derivar"
						}),
						puedeRecepcionar && /* @__PURE__ */ jsx(Button, {
							onClick: () => setRecepcionarOpen(ultimaDerivacion.id),
							variant: "secondary",
							children: "Recepcionar"
						}),
						puedeObservar && /* @__PURE__ */ jsx(Button, {
							variant: "secondary",
							onClick: () => {
								if (confirm("¿Marcar el trámite como Observado?")) router.put(`/tramites/${tramite.id}/estado`, { estado: "observado" });
							},
							children: "Observar"
						}),
						puedeFinalizar && /* @__PURE__ */ jsx(Button, {
							variant: "danger",
							onClick: () => {
								if (confirm("¿Marcar el trámite como Finalizado?")) router.put(`/tramites/${tramite.id}/estado`, { estado: "finalizado" });
							},
							children: "Finalizar"
						}),
						/* @__PURE__ */ jsx(Link, {
							href: "/tramites",
							children: /* @__PURE__ */ jsx(Button, {
								variant: "secondary",
								children: "Volver"
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs(Card, { children: [
				/* @__PURE__ */ jsx("h3", {
					className: "mb-4 text-lg font-semibold text-patuju-green",
					children: "Detalles del Trámite"
				}),
				/* @__PURE__ */ jsxs("dl", {
					className: "grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between sm:flex-col",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "text-sm text-gray-500",
								children: "N° Trámite"
							}), /* @__PURE__ */ jsxs("dd", {
								className: "text-sm font-medium",
								children: [
									tramite.numero_formateado,
									"/",
									tramite.year
								]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between sm:flex-col",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "text-sm text-gray-500",
								children: "Fecha"
							}), /* @__PURE__ */ jsx("dd", {
								className: "text-sm font-medium",
								children: tramite.fecha
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between sm:flex-col",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "text-sm text-gray-500",
								children: "Estado"
							}), /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx(Badge, {
								variant: estadoColors[tramite.estado] ?? "default",
								children: estadoLabels[tramite.estado] ?? tramite.estado
							}) })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between sm:flex-col",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "text-sm text-gray-500",
								children: "Puesto"
							}), /* @__PURE__ */ jsx("dd", {
								className: "text-sm font-medium",
								children: tramite.puesto?.nombre ?? "—"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between sm:flex-col",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "text-sm text-gray-500",
								children: "N° Diamante"
							}), /* @__PURE__ */ jsx("dd", {
								className: "text-sm font-medium",
								children: tramite.numero_diamante ?? "—"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between sm:flex-col",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "text-sm text-gray-500",
								children: "Creado por"
							}), /* @__PURE__ */ jsx("dd", {
								className: "text-sm font-medium",
								children: tramite.creador?.nombre ?? "—"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between sm:flex-col",
							children: [/* @__PURE__ */ jsx("dt", {
								className: "text-sm text-gray-500",
								children: "Derivado a"
							}), /* @__PURE__ */ jsx("dd", {
								className: "text-sm font-medium",
								children: tramite.asignado?.nombre ?? "—"
							})]
						})
					]
				}),
				tramite.glosa && /* @__PURE__ */ jsxs("div", {
					className: "mt-4 border-t border-gray-200 pt-4",
					children: [/* @__PURE__ */ jsx("dt", {
						className: "text-sm text-gray-500 mb-1",
						children: "Glosa"
					}), /* @__PURE__ */ jsx("dd", {
						className: "text-sm text-gray-700 whitespace-pre-wrap",
						children: tramite.glosa
					})]
				}),
				tramite.descripcion && /* @__PURE__ */ jsxs("div", {
					className: "mt-4 border-t border-gray-200 pt-4",
					children: [/* @__PURE__ */ jsx("dt", {
						className: "text-sm text-gray-500 mb-1",
						children: "Descripción"
					}), /* @__PURE__ */ jsx("dd", {
						className: "text-sm text-gray-700 whitespace-pre-wrap",
						children: tramite.descripcion
					})]
				})
			] }),
			tramite.derivaciones && tramite.derivaciones.length > 0 && /* @__PURE__ */ jsx(Table, {
				columns: [
					{
						key: "numero_derivacion",
						header: "Derivacion",
						render: (d) => /* @__PURE__ */ jsxs("span", {
							className: "font-medium",
							children: ["#", d.numero_derivacion]
						})
					},
					{
						key: "derivado_de",
						header: "De:",
						render: (d) => d.derivado_de?.nombre ?? "—"
					},
					{
						key: "fecha_derivacion",
						header: "Derivado:",
						render: (d) => d.fecha_derivacion
					},
					{
						key: "dias_en_derivacion",
						header: "Dias:",
						render: (d) => `${d.dias_en_derivacion} días`
					},
					{
						key: "glosa_derivacion",
						header: "Glosa de Derivacion:",
						render: (d) => d.glosa_derivacion ?? "—"
					},
					{
						key: "glosa_recepcion",
						header: "Glosa de Recepcion:",
						render: (d) => d.glosa_recepcion ?? "—"
					},
					{
						key: "derivado_a",
						header: "A:",
						render: (d) => d.derivado_a?.nombre ?? "—"
					},
					{
						key: "fecha_recepcion",
						header: "Recepcionado:",
						render: (d) => d.fecha_recepcion ?? "—"
					},
					{
						key: "estado",
						header: "ESTADO",
						render: (d) => /* @__PURE__ */ jsx(Badge, {
							variant: d.fecha_recepcion ? "success" : "warning",
							children: d.fecha_recepcion ? "Recepcionado" : "Derivado"
						})
					}
				],
				data: tramite.derivaciones,
				keyExtractor: (d) => d.id,
				emptyMessage: "No hay derivaciones registradas."
			}),
			/* @__PURE__ */ jsx(Modal, {
				open: derivarOpen,
				onClose: () => setDerivarOpen(false),
				title: "Derivar Trámite",
				children: /* @__PURE__ */ jsxs("form", {
					onSubmit: (e) => {
						e.preventDefault();
						derivarForm.post(`/tramites/${tramite.id}/derivar`, { onSuccess: () => setDerivarOpen(false) });
					},
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsx(Select, {
							label: "Derivar a",
							placeholder: "Seleccione funcionario",
							options: funcionarios.data.map((f) => ({
								value: String(f.id),
								label: f.nombre
							})),
							value: derivarForm.data.derivado_a,
							onChange: (e) => derivarForm.setData("derivado_a", e.target.value),
							error: derivarForm.errors.derivado_a
						}),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							htmlFor: "glosa_derivacion",
							className: "block text-sm font-medium text-patuju-green",
							children: "Glosa de derivación"
						}), /* @__PURE__ */ jsx("textarea", {
							id: "glosa_derivacion",
							rows: 3,
							className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
							value: derivarForm.data.glosa_derivacion,
							onChange: (e) => derivarForm.setData("glosa_derivacion", e.target.value)
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "flex gap-3 pt-2",
							children: [/* @__PURE__ */ jsx(Button, {
								type: "submit",
								loading: derivarForm.processing,
								children: "Derivar"
							}), /* @__PURE__ */ jsx(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => setDerivarOpen(false),
								children: "Cancelar"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ jsx(Modal, {
				open: recepcionarOpen !== null,
				onClose: () => setRecepcionarOpen(null),
				title: "Recepcionar Trámite",
				children: /* @__PURE__ */ jsxs("form", {
					onSubmit: (e) => {
						e.preventDefault();
						if (recepcionarOpen === null) return;
						recepcionarForm.put(`/derivaciones/${recepcionarOpen}/recepcionar`, { onSuccess: () => setRecepcionarOpen(null) });
					},
					className: "space-y-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
						htmlFor: "glosa_recepcion",
						className: "block text-sm font-medium text-patuju-green",
						children: "Glosa de recepción"
					}), /* @__PURE__ */ jsx("textarea", {
						id: "glosa_recepcion",
						rows: 3,
						className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
						value: recepcionarForm.data.glosa_recepcion,
						onChange: (e) => recepcionarForm.setData("glosa_recepcion", e.target.value)
					})] }), /* @__PURE__ */ jsxs("div", {
						className: "flex gap-3 pt-2",
						children: [/* @__PURE__ */ jsx(Button, {
							type: "submit",
							loading: recepcionarForm.processing,
							children: "Recepcionar"
						}), /* @__PURE__ */ jsx(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => setRecepcionarOpen(null),
							children: "Cancelar"
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { TramitesShow as default };
