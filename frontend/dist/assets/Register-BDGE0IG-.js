import {
    t as R,
    u as S,
    k as X,
    r as i,
    j as s,
    B as k,
    U as q,
    L as m,
    y as x,
    G as B,
    D,
} from "./index-DveDrhqs.js";
import { u as F } from "./useDocumentTitle-DHScRDTH.js";
import { A as I } from "./AuthLayout-C7aQhVgs.js";
import { I as b } from "./Input-DKgPnRuc.js";
import { P as A } from "./PhoneInput-AKbBHTFZ.js";
import { P as y } from "./PasswordInput-jOhgkTGG.js";
import { c as u, B as O } from "./constants-Dxsm1106.js";
import { t as j, i as l } from "./validation-BzUdk1tg.js";
import "./shield-check-DAMtTwPF.js";
import "./badge-check-Bf5ADlrj.js";
import "./eye-Y6h7RFQ_.js";
const v = {
    name: "reg-name",
    phone: "reg-phone",
    password: "reg-password",
    confirm: "reg-confirm",
    referral_code: "reg-referral",
};
function K() {
    F("Create an account");
    const { register: P } = R(),
        C = S(),
        p = X(),
        [e, E] = i.useState({
            name: "",
            phone: "",
            password: "",
            confirm: "",
            referral_code: "",
        }),
        [a, c] = i.useState({}),
        [f, h] = i.useState(""),
        [N, g] = i.useState(!1),
        t = (r) => (n) => {
            E((o) => ({ ...o, [r]: n.target.value })),
                a[r] && c((o) => ({ ...o, [r]: void 0 }));
        },
        _ = () => {
            const r = {};
            return (
                l(e.name) && (r.name = "Full name is required."),
                l(e.phone)
                    ? (r.phone = "Mobile number is required.")
                    : O.test(e.phone) ||
                      (r.phone =
                          "Mobile number must be 11 digits and start with 01 (e.g. 017XXXXXXXX)."),
                l(e.password)
                    ? (r.password = "Password is required.")
                    : e.password.length < u &&
                      (r.password = `Password must be at least ${u} characters.`),
                l(e.confirm)
                    ? (r.confirm = "Please confirm your password.")
                    : e.confirm !== e.password &&
                      (r.confirm = "Passwords do not match."),
                c(r),
                Object.keys(r).length && j(r, v),
                Object.keys(r).length === 0
            );
        },
        L = async (r) => {
            var n;
            if ((r.preventDefault(), h(""), !!_())) {
                g(!0);
                try {
                    await P(
                        e.name.trim(),
                        e.phone,
                        e.password,
                        e.referral_code.trim()
                    ),
                        x.success("Your account is ready."),
                        C(B(p), { replace: !0 });
                } catch (o) {
                    const d = D(o);
                    if ((c(d), Object.keys(d).length)) j(d, v);
                    else {
                        const w = o.response
                            ? ((n = o.response.data) == null
                                  ? void 0
                                  : n.message) ||
                              "Registration failed. Please try again."
                            : "No connection to the server. Check your internet and try again.";
                        h(w), x.error(w);
                    }
                } finally {
                    g(!1);
                }
            }
        };
    return s.jsxs(I, {
        title: "Create your account",
        subtitle: "Free to join. Post listings, save pets and message sellers.",
        footer: s.jsxs(s.Fragment, {
            children: [
                "Already have an account?",
                " ",
                s.jsx(m, {
                    to: "/login",
                    state: p.state,
                    className: "font-semibold text-primary hover:underline",
                    children: "Log in",
                }),
            ],
        }),
        children: [
            f &&
                s.jsx("div", {
                    className:
                        "mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700",
                    role: "alert",
                    children: f,
                }),
            s.jsxs("form", {
                onSubmit: L,
                noValidate: !0,
                className: "space-y-5",
                children: [
                    s.jsx(b, {
                        id: "reg-name",
                        placeholder: "e.g. Mr. Jhon",
                        label: "Full name",
                        required: !0,
                        autoComplete: "name",
                        value: e.name,
                        onChange: t("name"),
                        error: a.name,
                    }),
                    s.jsx(A, {
                        id: "reg-phone",
                        label: "Mobile number",
                        required: !0,
                        autoComplete: "username",
                        value: e.phone,
                        onChange: t("phone"),
                        error: a.phone,
                        hint: "Buyers will contact you on this number.",
                    }),
                    s.jsxs("div", {
                        className: "grid grid-cols-1 gap-5 sm:grid-cols-2",
                        children: [
                            s.jsx(y, {
                                id: "reg-password",
                                label: "Password",
                                required: !0,
                                autoComplete: "new-password",
                                placeholder: "Create a password",
                                value: e.password,
                                onChange: t("password"),
                                error: a.password,
                                hint: `At least ${u} characters`,
                            }),
                            s.jsx(y, {
                                id: "reg-confirm",
                                label: "Confirm password",
                                required: !0,
                                autoComplete: "new-password",
                                placeholder: "Re-enter your password",
                                value: e.confirm,
                                onChange: t("confirm"),
                                error: a.confirm,
                            }),
                        ],
                    }),
                    s.jsx(b, {
                        id: "reg-referral",
                        placeholder: "Enter a code if someone invited you",
                        label: "Referral code (optional)",
                        value: e.referral_code,
                        onChange: t("referral_code"),
                        error: a.referral_code,
                    }),
                    s.jsx(k, {
                        type: "submit",
                        size: "lg",
                        className: "w-full",
                        loading: N,
                        iconLeft: s.jsx(q, { size: 18 }),
                        children: "Create account",
                    }),
                    s.jsxs("p", {
                        className: "text-center text-xs text-muted",
                        children: [
                            "By creating an account you agree to our",
                            " ",
                            s.jsx(m, {
                                to: "/terms",
                                className: "underline hover:text-ink",
                                children: "Terms",
                            }),
                            " ",
                            "and",
                            " ",
                            s.jsx(m, {
                                to: "/privacy",
                                className: "underline hover:text-ink",
                                children: "Privacy Policy",
                            }),
                            ".",
                        ],
                    }),
                ],
            }),
        ],
    });
}
export { K as default };
