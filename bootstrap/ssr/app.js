import { Link, createInertiaApp, usePage } from "@inertiajs/react";
import { hydrateRoot } from "react-dom/client";
import { jsx, jsxs } from "react/jsx-runtime";
//#region node_modules/laravel-vite-plugin/inertia-helpers/index.js
async function resolvePageComponent(path, pages) {
	for (const p of Array.isArray(path) ? path : [path]) {
		const page = pages[p];
		if (typeof page === "undefined") continue;
		return typeof page === "function" ? page() : page;
	}
	throw new Error(`Page not found: ${path}`);
}
//#endregion
//#region resources/js/components/layout/Sidebar.tsx
var menuItems = [
	{
		label: "Dashboard",
		href: "/dashboard",
		icon: "📊"
	},
	{
		label: "Trámites",
		href: "/tramites",
		icon: "📋"
	},
	{
		label: "Funcionarios",
		href: "/funcionarios",
		icon: "👥"
	},
	{
		label: "Puestos",
		href: "/puestos",
		icon: "🏢"
	},
	{
		label: "Contador",
		href: "/contador",
		icon: "🔢"
	},
	{
		label: "Reporte",
		href: "/reporte",
		icon: "📈"
	}
];
function Sidebar() {
	const { url } = usePage();
	const isActive = (href) => {
		if (href === "/dashboard") return url === "/dashboard";
		return url.startsWith(href);
	};
	return /* @__PURE__ */ jsxs("aside", {
		className: "flex h-full w-64 flex-col bg-white border-r border-gray-200",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex h-16 items-center gap-2 px-6 border-b border-gray-100",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-2xl",
					children: "📌"
				}), /* @__PURE__ */ jsx("h1", {
					className: "text-lg font-bold text-patuju-green",
					children: "Seguimiento"
				})]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "flex-1 space-y-1 px-3 py-4",
				children: menuItems.map((item) => /* @__PURE__ */ jsxs(Link, {
					href: item.href,
					className: `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive(item.href) ? "bg-patuju-green text-white" : "text-gray-600 hover:bg-patuju-green/10 hover:text-patuju-green"}`,
					children: [/* @__PURE__ */ jsx("span", { children: item.icon }), /* @__PURE__ */ jsx("span", { children: item.label })]
				}, item.href))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "border-t border-gray-100 p-3",
				children: /* @__PURE__ */ jsxs(Link, {
					href: "/logout",
					method: "post",
					as: "button",
					className: "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-patuju-red/10 hover:text-patuju-red transition-colors",
					children: [/* @__PURE__ */ jsx("span", { children: "🚪" }), /* @__PURE__ */ jsx("span", { children: "Cerrar sesión" })]
				})
			})
		]
	});
}
//#endregion
//#region resources/js/components/layout/Header.tsx
function Header() {
	const { auth } = usePage().props;
	return /* @__PURE__ */ jsxs("header", {
		className: "flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6",
		children: [/* @__PURE__ */ jsx("div", {}), /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex h-8 w-8 items-center justify-center rounded-full bg-patuju-green text-white text-sm font-medium",
				children: auth.user?.name?.charAt(0).toUpperCase() || "U"
			}), /* @__PURE__ */ jsx("span", {
				className: "text-sm font-medium text-gray-700",
				children: auth.user?.name || "Usuario"
			})]
		})]
	});
}
//#endregion
//#region resources/js/components/layout/DashboardLayout.tsx
function DashboardLayout({ children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen bg-patuju-white",
		children: [/* @__PURE__ */ jsx(Sidebar, {}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-1 flex-col overflow-hidden",
			children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsx("main", {
				className: "flex-1 overflow-y-auto p-6",
				children
			})]
		})]
	});
}
//#endregion
//#region resources/js/app.tsx
var appName = "Seguimiento de Trámites";
createInertiaApp({
	title: (title) => `${title} — ${appName}`,
	resolve: async (name) => {
		const page = await resolvePageComponent(`./pages/${name}.tsx`, /* #__PURE__ */ Object.assign({
			"./pages/Auth/Login.tsx": () => import("./assets/Login-CbFkbGUP.js"),
			"./pages/Contador/Index.tsx": () => import("./assets/Index-IFGPDtsz.js"),
			"./pages/Dashboard.tsx": () => import("./assets/Dashboard-DF06dWRi.js"),
			"./pages/Funcionarios/Create.tsx": () => import("./assets/Create-CzaKkKIi.js"),
			"./pages/Funcionarios/Edit.tsx": () => import("./assets/Edit-20l6yArM.js"),
			"./pages/Funcionarios/Index.tsx": () => import("./assets/Index-B0yU8rHO.js"),
			"./pages/Puestos/Create.tsx": () => import("./assets/Create-GAFZHWN4.js"),
			"./pages/Puestos/Edit.tsx": () => import("./assets/Edit-Bda1XdVB.js"),
			"./pages/Puestos/Index.tsx": () => import("./assets/Index-Wl-737Wj.js"),
			"./pages/Reporte/Index.tsx": () => import("./assets/Index-C8z2dWq-.js"),
			"./pages/Tramites/Create.tsx": () => import("./assets/Create-NhDXIWRQ.js"),
			"./pages/Tramites/Index.tsx": () => import("./assets/Index-DHLKQofn.js"),
			"./pages/Tramites/Show.tsx": () => import("./assets/Show-CwULR3kQ.js")
		}));
		if (!["Auth/Login", "Auth/Register"].includes(name)) page.default.layout = page.default.layout || DashboardLayout;
		return page;
	},
	setup({ el, App, props }) {
		hydrateRoot(el, /* @__PURE__ */ jsx(App, { ...props }));
	},
	progress: { color: "#2D6A4F" }
});
//#endregion
export {};
