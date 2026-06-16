import { t as Card } from "./Card-B3vey6t_.js";
import { t as Select } from "./Select-DHMLvRNX.js";
import { n as SemanalChart, t as TramitesPorFuncionarioChart } from "./TramitesPorFuncionarioChart-038mha2P.js";
import { router } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/pages/Dashboard.tsx
var estadoConfig = {
	iniciado: {
		label: "Iniciados",
		color: "text-blue-600"
	},
	proceso: {
		label: "En Proceso",
		color: "text-patuju-yellow"
	},
	observado: {
		label: "Observados",
		color: "text-gray-600"
	},
	finalizado: {
		label: "Finalizados",
		color: "text-patuju-green"
	}
};
function Dashboard({ total_tramites, por_estado, iniciados_por_dia, finalizados_por_dia, tramites_por_funcionario, funcionarios, filtro_funcionario_id }) {
	const handleFiltroChange = (e) => {
		const value = e.target.value;
		router.get("/dashboard", { funcionario_id: value || void 0 }, {
			preserveState: true,
			replace: true
		});
	};
	const options = [{
		value: "",
		label: "Todos los funcionarios"
	}, ...funcionarios.map((f) => ({
		value: String(f.id),
		label: f.nombre
	}))];
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-bold text-patuju-green",
					children: "Dashboard"
				}), /* @__PURE__ */ jsx("div", {
					className: "w-64",
					children: /* @__PURE__ */ jsx(Select, {
						label: "Filtrar por funcionario",
						options,
						value: filtro_funcionario_id ? String(filtro_funcionario_id) : "",
						onChange: handleFiltroChange
					})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
				children: [/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx("p", {
					className: "text-sm text-gray-500",
					children: "Total Trámites"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-3xl font-bold text-patuju-green",
					children: total_tramites
				})] }), Object.entries(estadoConfig).map(([estado, config]) => /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx("p", {
					className: "text-sm text-gray-500",
					children: config.label
				}), /* @__PURE__ */ jsx("p", {
					className: `mt-1 text-3xl font-bold ${config.color}`,
					children: por_estado[estado] ?? 0
				})] }, estado))]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ jsx(SemanalChart, {
					title: "Trámites Iniciados por Día de la Semana",
					data: iniciados_por_dia,
					color: "#2D6A4F"
				}), /* @__PURE__ */ jsx(SemanalChart, {
					title: "Trámites Finalizados por Día de la Semana",
					data: finalizados_por_dia,
					color: "#C1121F"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-1 gap-6 lg:grid-cols-2",
				children: /* @__PURE__ */ jsx(TramitesPorFuncionarioChart, { data: tramites_por_funcionario })
			})
		]
	});
}
//#endregion
export { Dashboard as default };
