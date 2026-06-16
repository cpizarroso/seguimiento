import { jsx, jsxs } from "react/jsx-runtime";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
//#region resources/js/components/features/reporte/SemanalChart.tsx
var DAY_LABELS = {
	1: "Dom",
	2: "Lun",
	3: "Mar",
	4: "Mié",
	5: "Jue",
	6: "Vie",
	7: "Sáb"
};
var DAY_ORDER = [
	2,
	3,
	4,
	5,
	6,
	7,
	1
];
function SemanalChart({ title, data, color }) {
	const chartData = DAY_ORDER.map((dia) => ({
		dia: DAY_LABELS[dia],
		total: data[dia] ?? 0
	}));
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl bg-patuju-cream p-6 shadow-sm border border-patuju-green/10",
		children: [/* @__PURE__ */ jsx("h3", {
			className: "text-lg font-semibold text-patuju-green mb-4",
			children: title
		}), /* @__PURE__ */ jsx(ResponsiveContainer, {
			width: "100%",
			height: 300,
			children: /* @__PURE__ */ jsxs(BarChart, {
				data: chartData,
				children: [
					/* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
					/* @__PURE__ */ jsx(XAxis, { dataKey: "dia" }),
					/* @__PURE__ */ jsx(YAxis, { allowDecimals: false }),
					/* @__PURE__ */ jsx(Tooltip, {}),
					/* @__PURE__ */ jsx(Bar, {
						dataKey: "total",
						fill: color,
						radius: [
							4,
							4,
							0,
							0
						]
					})
				]
			})
		})]
	});
}
//#endregion
//#region resources/js/components/features/reporte/TramitesPorFuncionarioChart.tsx
function TramitesPorFuncionarioChart({ data }) {
	const chartData = data.map((f) => ({
		...f,
		label: `${f.nombre} (${f.puesto})`
	}));
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-xl bg-patuju-cream p-6 shadow-sm border border-patuju-green/10",
		children: [/* @__PURE__ */ jsx("h3", {
			className: "text-lg font-semibold text-patuju-green mb-4",
			children: "Trámites por Funcionario según su Puesto"
		}), /* @__PURE__ */ jsx(ResponsiveContainer, {
			width: "100%",
			height: Math.max(300, chartData.length * 40),
			children: /* @__PURE__ */ jsxs(BarChart, {
				data: chartData,
				layout: "vertical",
				margin: {
					left: 20,
					right: 20,
					top: 10,
					bottom: 10
				},
				children: [
					/* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
					/* @__PURE__ */ jsx(XAxis, {
						type: "number",
						allowDecimals: false
					}),
					/* @__PURE__ */ jsx(YAxis, {
						type: "category",
						dataKey: "label",
						width: 250,
						tick: { fontSize: 12 }
					}),
					/* @__PURE__ */ jsx(Tooltip, { formatter: (value) => [value, "Trámites"] }),
					/* @__PURE__ */ jsx(Bar, {
						dataKey: "total",
						fill: "#2D6A4F",
						radius: [
							0,
							4,
							4,
							0
						]
					})
				]
			})
		})]
	});
}
//#endregion
export { SemanalChart as n, TramitesPorFuncionarioChart as t };
