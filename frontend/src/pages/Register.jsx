import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Input } from "../components/ui/Input";
import { PhoneInput } from "../components/ui/PhoneInput";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { BD_PHONE_REGEX, MIN_PASSWORD_LENGTH } from "../lib/constants";
import { fieldErrors, getRedirectTarget } from "../lib/auth";
import { isBlank, toastErrors } from "../lib/validation";

const FIELD_IDS = {
    name: "reg-name",
    phone: "reg-phone",
    password: "reg-password",
    confirm: "reg-confirm",
    referral_code: "reg-referral",
};

export default function Register() {
    useDocumentTitle("Create an account");
    const { register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        name: "",
        phone: "",
        password: "",
        confirm: "",
        referral_code: "",
    });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (isBlank(form.name)) e.name = "Full name is required.";
        if (isBlank(form.phone)) e.phone = "Mobile number is required.";
        else if (!BD_PHONE_REGEX.test(form.phone))
            e.phone =
                "Mobile number must be 11 digits and start with 01 (e.g. 017XXXXXXXX).";
        // Minimum length is a server rule (RegisterRequest: min:6), checked here so the user sees it before submitting
        if (isBlank(form.password)) e.password = "Password is required.";
        else if (form.password.length < MIN_PASSWORD_LENGTH)
            e.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        if (isBlank(form.confirm)) e.confirm = "Please confirm your password.";
        else if (form.confirm !== form.password)
            e.confirm = "Passwords do not match.";
        setErrors(e);
        if (Object.keys(e).length) toastErrors(e, FIELD_IDS);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        if (!validate()) return;
        setLoading(true);
        try {
            await register(
                form.name.trim(),
                form.phone,
                form.password,
                form.referral_code.trim()
            );
            toast.success("Your account is ready.");
            navigate(getRedirectTarget(location), { replace: true });
        } catch (err) {
            const fe = fieldErrors(err);
            setErrors(fe);
            if (Object.keys(fe).length) {
                toastErrors(fe, FIELD_IDS);
            } else {
                const msg = !err.response
                    ? "No connection to the server. Check your internet and try again."
                    : err.response.data?.message ||
                      "Registration failed. Please try again.";
                setFormError(msg);
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Free to join. Post listings, save pets and message sellers."
            footer={
                <>
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        state={location.state}
                        className="font-semibold text-primary hover:underline"
                    >
                        Log in
                    </Link>
                </>
            }
        >
            {formError && (
                <div
                    className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                    role="alert"
                >
                    {formError}
                </div>
            )}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                    id="reg-name"
                    placeholder="e.g. Mr. Jhon"
                    label="Full name"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={set("name")}
                    error={errors.name}
                />
                <PhoneInput
                    id="reg-phone"
                    label="Mobile number"
                    required
                    autoComplete="username"
                    value={form.phone}
                    onChange={set("phone")}
                    error={errors.phone}
                    hint="Buyers will contact you on this number."
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <PasswordInput
                        id="reg-password"
                        label="Password"
                        required
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={set("password")}
                        error={errors.password}
                        hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    />
                    <PasswordInput
                        id="reg-confirm"
                        label="Confirm password"
                        required
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={form.confirm}
                        onChange={set("confirm")}
                        error={errors.confirm}
                    />
                </div>
                <Input
                    id="reg-referral"
                    placeholder="Enter a code if someone invited you"
                    label="Referral code (optional)"
                    value={form.referral_code}
                    onChange={set("referral_code")}
                    error={errors.referral_code}
                />
                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    iconLeft={<UserPlus size={18} />}
                >
                    Create account
                </Button>
                <p className="text-center text-xs text-muted">
                    By creating an account you agree to our{" "}
                    <Link to="/terms" className="underline hover:text-ink">
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="underline hover:text-ink">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </form>
        </AuthLayout>
    );
}
