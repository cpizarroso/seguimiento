import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { t as Select } from "./Select-DHMLvRNX.js";
import { t as Table } from "./Table-BdngzARu.js";
import { t as Pagination } from "./Pagination-C-7cevfm.js";
import { t as Badge } from "./Badge-Dbmpxxc9.js";
import { Link, router, usePage } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region resources/js/pages/Tramites/Index.tsx
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
function TramitesIndex({ tramites, puestos }) {
	const { url } = usePage();
	const params = new URLSearchParams(url.split("?")[1] ?? "");
	const [search, setSearch] = useState(params.get("search") ?? "");
	const [estadoFiltro, setEstadoFiltro] = useState(params.get("estado") ?? "");
	const buscar = () => {
		router.get("/tramites", {
			search,
			estado: estadoFiltro
		}, { preserveState: true });
	};
	const columns = [
		{
			key: "numero_tramite",
			header: "N° Trámite",
			render: (t) => /* @__PURE__ */ jsxs(Link, {
				href: `/tramites/${t.id}`,
				className: "text-patuju-green hover:underline font-medium",
				children: [
					t.numero_formateado,
					"/",
					t.year
				]
			})
		},
		{
			key: "fecha",
			header: "Fecha",
			render: (t) => t.fecha ?? "—"
		},
		{
			key: "descripcion",
			header: "Descripción",
			render: (t) => /* @__PURE__ */ jsx("span", {
				className: "line-clamp-2 max-w-xs",
				children: t.descripcion
			})
		},
		{
			key: "asignado",
			header: "Derivado a",
			render: (t) => t.asignado?.nombre ?? t.creador?.nombre ?? "—"
		},
		{
			key: "numero_diamante",
			header: "Diamante",
			render: (t) => t.numero_diamante ?? "—"
		},
		{
			key: "ultima_respuesta",
			header: "Respuesta",
			render: (t) => t.ultima_respuesta ?? "—"
		},
		{
			key: "estado",
			header: "Estado",
			render: (t) => /* @__PURE__ */ jsx(Badge, {
				variant: estadoColors[t.estado] ?? "default",
				children: estadoLabels[t.estado] ?? t.estado
			})
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-bold text-patuju-green",
					children: "Trámites"
				}), /* @__PURE__ */ jsx(Link, {
					href: "/tramites/create",
					children: /* @__PURE__ */ jsx(Button, { children: "Nuevo Trámite" })
				})]
			}),
			/* @__PURE__ */ jsx(Card, {
				padding: "sm",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-3 items-end",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "flex-1 min-w-48",
							children: /* @__PURE__ */ jsx(Input, {
								label: "Buscar",
								placeholder: "Buscar por cualquier campo...",
								value: search,
								onChange: (e) => setSearch(e.target.value),
								onKeyDown: (e) => e.key === "Enter" && buscar()
							})
						}),
						/* @__PURE__ */ jsx(Select, {
							label: "Estado",
							options: [{
								value: "",
								label: "Todos"
							}, ...Object.entries(estadoLabels).map(([value, label]) => ({
								value,
								label
							}))],
							value: estadoFiltro,
							onChange: (e) => setEstadoFiltro(e.target.value)
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: buscar,
							children: "Buscar"
						})
					]
				})
			}),
			/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(Table, {
				columns,
				data: tramites.data,
				keyExtractor: (t) => t.id,
				emptyMessage: "No hay trámites registrados."
			}), /* @__PURE__ */ jsx(Pagination, {
				currentPage: tramites.meta.current_page,
				lastPage: tramites.meta.last_page,
				onPageChange: (page) => router.get("/tramites", {
					page,
					search,
					estado: estadoFiltro
				}, { preserveState: true })
			})] })
		]
	});
}
//#endregion
export { TramitesIndex as default };
