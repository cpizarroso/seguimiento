import { t as Button } from "./Button-Cer-IB3G.js";
import { t as Input } from "./Input-C0A7m-Lh.js";
import { t as Card } from "./Card-B3vey6t_.js";
import { useForm } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region resources/js/pages/Auth/Login.tsx
function Login() {
	const { data, setData, post, processing, errors } = useForm({
		email: "",
		password: ""
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		post("/login");
	};
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-patuju-white",
		children: /* @__PURE__ */ jsxs(Card, {
			padding: "lg",
			className: "w-full max-w-md",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "mb-6 text-center",
				children: [/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-bold text-patuju-green",
					children: "Seguimiento de Trámites"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-gray-500",
					children: "Inicia sesión para continuar"
				})]
			}), /* @__PURE__ */ jsxs("form", {
				onSubmit: handleSubmit,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsx(Input, {
						label: "Email",
						type: "email",
						value: data.email,
						onChange: (e) => setData("email", e.target.value),
						error: errors.email,
						autoFocus: true
					}),
					/* @__PURE__ */ jsx(Input, {
						label: "Contraseña",
						type: "password",
						value: data.password,
						onChange: (e) => setData("password", e.target.value),
						error: errors.password
					}),
					/* @__PURE__ */ jsx(Button, {
						type: "submit",
						loading: processing,
						className: "w-full",
						size: "lg",
						children: "Iniciar sesión"
					})
				]
			})]
		})
	});
}
//#endregion
export { Login as default };
