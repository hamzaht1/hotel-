import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import SetupBanner from "@/components/public/setup/SetupBanner";
import FormInput from "@/components/public/setup/FormInput";
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'

interface FieldCfg { enabled: boolean; required: boolean }
interface FormConfig {
  fields: Record<string, FieldCfg>
  require_email_verification: boolean
  require_phone_verification: boolean
}

interface Props {
  setup: Record<string, string>
  formConfig: FormConfig
}

export default function Account({ setup, formConfig }: Props) {
  const { __ } = useLang()
  const serverErrors = usePage().props.errors as Record<string, string>;

  // Field visibility / requiredness driven by the super-admin registration config.
  const fields = formConfig?.fields ?? {};
  const shown = (k: string) => fields[k]?.enabled ?? true;
  const req = (k: string) => (fields[k]?.enabled ?? true) && (fields[k]?.required ?? false);

  const [firstName, setFirstName] = useState(setup?.first_name || "");
  const [lastName, setLastName] = useState(setup?.last_name || "");
  const [city, setCity] = useState(setup?.city || "");
  const [phone, setPhone] = useState(setup?.phone || "");
  const [username, setUsername] = useState(setup?.username || "");
  const [email, setEmail] = useState(setup?.email || "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    const required = __("messages.setup.account_information.required_field");
    if (req('first_name') && !firstName.trim()) e.first_name = required;
    if (req('last_name') && !lastName.trim()) e.last_name = required;
    if (req('city') && !city.trim()) e.city = required;
    if (req('phone') && !phone.trim()) e.phone = required;
    if (!username.trim()) e.username = required;
    if (!email.trim()) e.email = required;
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = __("messages.setup.account_information.invalid_email");
    if (!password) e.password = required;
    else if (password.length < 8) e.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goPrev = () => {
    router.visit("/setup/org");
  };

  const submitNext = () => {
    if (!validate()) return;

    setProcessing(true);
    router.post("/setup/account", {
      username,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      city,
      phone,
    }, {
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <PublicLayout>
      <section className="py-10">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SetupBanner />
          <div className="mx-auto rounded-3xl border border-public-border bg-white p-6 sm:p-8 shadow-sm">
            <AnimatedHeading dir="up" delay={0.30}>
              <h1 className="mb-6 text-center text-2xl sm:text-3xl font-extrabold text-public-primary">
                {__("messages.setup.account_information.title")}
              </h1>
            </AnimatedHeading>
            <div className="grid gap-5">
              {(shown('first_name') || shown('last_name')) && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {shown('first_name') && (
                    <FormInput
                      id="first_name"
                      label={__("messages.setup.account.first_name_label")}
                      placeholder={__("messages.setup.account.first_name_placeholder")}
                      value={firstName}
                      onChange={setFirstName}
                      required={req('first_name')}
                      error={errors.first_name ?? null}
                    />
                  )}
                  {shown('last_name') && (
                    <FormInput
                      id="last_name"
                      label={__("messages.setup.account.last_name_label")}
                      placeholder={__("messages.setup.account.last_name_placeholder")}
                      value={lastName}
                      onChange={setLastName}
                      required={req('last_name')}
                      error={errors.last_name ?? null}
                    />
                  )}
                </div>
              )}
              {shown('city') && (
                <FormInput
                  id="city"
                  label={__("messages.setup.account.city_label")}
                  placeholder={__("messages.setup.account.city_placeholder")}
                  value={city}
                  onChange={setCity}
                  required={req('city')}
                  error={errors.city ?? null}
                />
              )}
              {shown('phone') && (
                <FormInput
                  id="phone"
                  label={__("messages.setup.account.phone_label")}
                  placeholder={__("messages.setup.account.phone_placeholder")}
                  value={phone}
                  onChange={setPhone}
                  required={req('phone')}
                  error={errors.phone ?? serverErrors?.phone ?? null}
                  inputMode="tel"
                  prefix="+966"
                />
              )}
              <FormInput
                id="username"
                label={__("messages.setup.account_information.username_label")}
                placeholder={__("messages.setup.account_information.username_placeholder")}
                value={username}
                onChange={setUsername}
                required
                error={errors.username ?? null}
              />
              <FormInput
                id="email"
                type="email"
                label={__("messages.setup.account_information.email_label")}
                placeholder={__("messages.setup.account_information.email_placeholder")}
                value={email}
                onChange={setEmail}
                required
                error={errors.email ?? serverErrors?.email ?? null}
              />
              <FormInput
                id="password"
                type="password"
                label={__("messages.setup.account_information.password_label")}
                placeholder={__("messages.setup.account_information.password_placeholder")}
                value={password}
                onChange={setPassword}
                required
                error={errors.password ?? serverErrors?.password ?? null}
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={goPrev} className="rounded-xl border border-public-primary bg-white px-5 py-2 font-semibold text-public-primary hover:bg-public-primary/5">
                {__("messages.setup.account_information.previous")}
              </button>
              <button type="button" onClick={submitNext} disabled={processing} className="rounded-xl bg-public-primary px-6 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {processing ? "جاري الإرسال..." : __("messages.setup.account_information.next")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
