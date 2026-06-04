import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import SetupBanner from "@/components/public/setup/SetupBanner";
import FormInput from "@/components/public/setup/FormInput";
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'

interface Props {
  setup: Record<string, string>
}

export default function Account({ setup }: Props) {
  const { __ } = useLang()
  const serverErrors = usePage().props.errors as Record<string, string>;

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
    if (!firstName.trim()) e.first_name = required;
    if (!lastName.trim()) e.last_name = required;
    if (!city.trim()) e.city = required;
    if (!phone.trim()) e.phone = required;
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormInput
                  id="first_name"
                  label={__("messages.setup.account.first_name_label")}
                  placeholder={__("messages.setup.account.first_name_placeholder")}
                  value={firstName}
                  onChange={setFirstName}
                  required
                  error={errors.first_name ?? null}
                />
                <FormInput
                  id="last_name"
                  label={__("messages.setup.account.last_name_label")}
                  placeholder={__("messages.setup.account.last_name_placeholder")}
                  value={lastName}
                  onChange={setLastName}
                  required
                  error={errors.last_name ?? null}
                />
              </div>
              <FormInput
                id="city"
                label={__("messages.setup.account.city_label")}
                placeholder={__("messages.setup.account.city_placeholder")}
                value={city}
                onChange={setCity}
                required
                error={errors.city ?? null}
              />
              <FormInput
                id="phone"
                label={__("messages.setup.account.phone_label")}
                placeholder={__("messages.setup.account.phone_placeholder")}
                value={phone}
                onChange={setPhone}
                required
                error={errors.phone ?? serverErrors?.phone ?? null}
                inputMode="tel"
                prefix="+966"
              />
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
