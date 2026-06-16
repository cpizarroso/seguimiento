import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { t as Table } from "./Table-BdngzARu.js";
import { t as Pagination } from "./Pagination-C-7cevfm.js";
import { Link, router } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region resources/js/pages/Puestos/Index.tsx
function PuestosIndex({ puestos }) {
	const [search, setSearch] = useState("");
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-bold text-patuju-green",
					children: "Puestos de Trabajo"
				}), /* @__PURE__ */ jsx(Link, {
					href: "/puestos/create",
					children: /* @__PURE__ */ jsx(Button, { children: "Nuevo Puesto" })
				})]
			}),
			/* @__PURE__ */ jsx(Card, {
				padding: "sm",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex gap-3 items-end",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex-1 max-w-sm",
						children: /* @__PURE__ */ jsx(Input, {
							label: "Buscar",
							placeholder: "Buscar por nombre...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && router.get("/puestos", { search }, { preserveState: true })
						})
					}), /* @__PURE__ */ jsx(Button, {
						onClick: () => router.get("/puestos", { search }, { preserveState: true }),
						children: "Buscar"
					})]
				})
			}),
			/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(Table, {
				columns: [
					{
						key: "nombre",
						header: "Nombre"
					},
					{
						key: "descripcion",
						header: "Descripción",
						render: (p) => p.descripcion ?? "—"
					},
					{
						key: "funcionarios_count",
						header: "Funcionarios",
						render: (p) => p.funcionarios_count?.toString() ?? "0"
					},
					{
						key: "acciones",
						header: "Acciones",
						render: (p) => /* @__PURE__ */ jsx("div", {
							className: "flex gap-2",
							children: /* @__PURE__ */ jsx(Link, {
								href: `/puestos/${p.id}/edit`,
								children: /* @__PURE__ */ jsx(Button, {
									size: "sm",
									variant: "secondary",
									children: "Editar"
								})
							})
						})
					}
				],
				data: puestos.data,
				keyExtractor: (p) => p.id,
				emptyMessage: "No hay puestos registrados."
			}), /* @__PURE__ */ jsx(Pagination, {
				currentPage: puestos.meta.current_page,
				lastPage: puestos.meta.last_page,
				onPageChange: (page) => router.get("/puestos", {
					page,
					search
				}, { preserveState: true })
			})] })
		]
	});
}
//#endregion
export { PuestosIndex as default };
