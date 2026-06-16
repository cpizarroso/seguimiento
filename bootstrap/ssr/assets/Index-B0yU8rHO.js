import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { t as Table } from "./Table-BdngzARu.js";
import { t as Pagination } from "./Pagination-C-7cevfm.js";
import { t as Badge } from "./Badge-Dbmpxxc9.js";
import { Link, router } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
//#region resources/js/pages/Funcionarios/Index.tsx
function FuncionariosIndex({ funcionarios }) {
	const [search, setSearch] = useState("");
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-bold text-patuju-green",
					children: "Funcionarios"
				}), /* @__PURE__ */ jsx(Link, {
					href: "/funcionarios/create",
					children: /* @__PURE__ */ jsx(Button, { children: "Nuevo Funcionario" })
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
							onKeyDown: (e) => e.key === "Enter" && router.get("/funcionarios", { search }, { preserveState: true })
						})
					}), /* @__PURE__ */ jsx(Button, {
						onClick: () => router.get("/funcionarios", { search }, { preserveState: true }),
						children: "Buscar"
					})]
				})
			}),
			/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(Table, {
				columns: [
					{
						key: "nombre",
						header: "Nombre",
						render: (f) => /* @__PURE__ */ jsx(Link, {
							href: `/funcionarios/${f.id}/edit`,
							className: "text-patuju-green hover:underline font-medium",
							children: f.nombre
						})
					},
					{
						key: "email",
						header: "Email",
						render: (f) => f.email ?? "—"
					},
					{
						key: "puesto",
						header: "Puesto",
						render: (f) => /* @__PURE__ */ jsx(Badge, {
							variant: "info",
							children: f.puesto?.nombre ?? "—"
						})
					},
					{
						key: "acciones",
						header: "Acciones",
						render: (f) => /* @__PURE__ */ jsx("div", {
							className: "flex gap-2",
							children: /* @__PURE__ */ jsx(Link, {
								href: `/funcionarios/${f.id}/edit`,
								children: /* @__PURE__ */ jsx(Button, {
									size: "sm",
									variant: "secondary",
									children: "Editar"
								})
							})
						})
					}
				],
				data: funcionarios.data,
				keyExtractor: (f) => f.id,
				emptyMessage: "No hay funcionarios registrados."
			}), /* @__PURE__ */ jsx(Pagination, {
				currentPage: funcionarios.meta.current_page,
				lastPage: funcionarios.meta.last_page,
				onPageChange: (page) => router.get("/funcionarios", {
					page,
					search
				}, { preserveState: true })
			})] })
		]
	});
}
//#endregion
export { FuncionariosIndex as default };
