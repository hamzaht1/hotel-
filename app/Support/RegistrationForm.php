<?php

namespace App\Support;

use App\Models\SiteSetting;

/**
 * Central definition of the client registration ("نموذج التسجيل") form.
 *
 * The super-admin can toggle each optional field on/off and required/optional,
 * plus require email / phone verification. The config is stored as a single
 * SiteSetting JSON key so both apps (main setup wizard + super-admin panel,
 * shared DB) read the same source of truth.
 */
class RegistrationForm
{
    public const SETTING_KEY = 'registration_form_config';

    /**
     * Configurable fields, grouped by wizard step. Core account fields
     * (username, email, password) and the org name are always required and are
     * intentionally NOT listed here — they can't be disabled.
     *
     * `rule` is the base validation (after required/nullable is prepended).
     */
    public const FIELDS = [
        // Organization step
        'commercial_activity'          => ['step' => 'org',     'rule' => 'string|max:255',            'label_ar' => 'النشاط التجاري',            'label_en' => 'Commercial activity'],
        'branches_count'               => ['step' => 'org',     'rule' => 'integer|min:0|max:9999',    'label_ar' => 'عدد الفروع',                'label_en' => 'Branches count'],
        'manager_type'                 => ['step' => 'org',     'rule' => 'in:owner,manager',          'label_ar' => 'صفة مقدم الطلب',            'label_en' => 'Manager type'],
        'responsible_position'         => ['step' => 'org',     'rule' => 'string|max:100',            'label_ar' => 'المنصب',                    'label_en' => 'Responsible position'],
        'cr_number'                    => ['step' => 'org',     'rule' => 'string|max:50',             'label_ar' => 'السجل التجاري',             'label_en' => 'Commercial registration'],
        'vat_number'                   => ['step' => 'org',     'rule' => 'string|max:50',             'label_ar' => 'الرقم الضريبي',             'label_en' => 'VAT number'],
        'license_number'               => ['step' => 'org',     'rule' => 'string|max:50',             'label_ar' => 'رخصة السياحة',              'label_en' => 'Tourism licence'],
        'license_expiry'               => ['step' => 'org',     'rule' => 'date',                      'label_ar' => 'انتهاء رخصة السياحة',       'label_en' => 'Licence expiry'],
        'municipality_license_number'  => ['step' => 'org',     'rule' => 'string|max:50',             'label_ar' => 'رخصة البلدية',              'label_en' => 'Municipality licence'],
        'municipality_license_expiry'  => ['step' => 'org',     'rule' => 'date',                      'label_ar' => 'انتهاء رخصة البلدية',       'label_en' => 'Municipality expiry'],

        // Account step
        'first_name'                   => ['step' => 'account', 'rule' => 'string|max:100',            'label_ar' => 'الاسم الأول',               'label_en' => 'First name'],
        'last_name'                    => ['step' => 'account', 'rule' => 'string|max:100',            'label_ar' => 'اسم العائلة',               'label_en' => 'Last name'],
        'city'                         => ['step' => 'account', 'rule' => 'string|max:100',            'label_ar' => 'المدينة',                   'label_en' => 'City'],
        'phone'                        => ['step' => 'account', 'rule' => 'string|max:30',             'label_ar' => 'رقم الجوال',                'label_en' => 'Phone'],
    ];

    /**
     * Defaults mirror the form's original hard-coded behaviour: every field
     * enabled; first/last name, city and phone required; establishment data
     * optional; email verification on, phone verification off.
     */
    public static function defaults(): array
    {
        $requiredByDefault = ['first_name', 'last_name', 'city', 'phone'];

        $fields = [];
        foreach (self::FIELDS as $key => $_meta) {
            $fields[$key] = [
                'enabled' => true,
                'required' => in_array($key, $requiredByDefault, true),
            ];
        }

        return [
            'fields' => $fields,
            'require_email_verification' => true,
            'require_phone_verification' => false,
        ];
    }

    /**
     * The effective config: stored settings merged over the defaults, so newly
     * added fields always have a sane default even if the stored blob is old.
     */
    public static function config(): array
    {
        $defaults = self::defaults();
        $raw = SiteSetting::get(self::SETTING_KEY);
        $stored = is_string($raw) ? json_decode($raw, true) : $raw;

        if (!is_array($stored)) {
            return $defaults;
        }

        $config = $defaults;
        $config['require_email_verification'] = (bool) ($stored['require_email_verification'] ?? $defaults['require_email_verification']);
        $config['require_phone_verification'] = (bool) ($stored['require_phone_verification'] ?? $defaults['require_phone_verification']);

        foreach ($defaults['fields'] as $key => $def) {
            $s = $stored['fields'][$key] ?? [];
            $config['fields'][$key] = [
                'enabled' => (bool) ($s['enabled'] ?? $def['enabled']),
                'required' => (bool) ($s['required'] ?? $def['required']),
            ];
        }

        return $config;
    }

    /** Config plus field metadata (labels/step), for the setup UI and admin editor. */
    public static function withMeta(): array
    {
        $config = self::config();
        $fields = [];
        foreach (self::FIELDS as $key => $meta) {
            $fields[$key] = array_merge($config['fields'][$key], [
                'key' => $key,
                'step' => $meta['step'],
                'label_ar' => $meta['label_ar'],
                'label_en' => $meta['label_en'],
            ]);
        }

        return [
            'fields' => $fields,
            'require_email_verification' => $config['require_email_verification'],
            'require_phone_verification' => $config['require_phone_verification'],
        ];
    }

    /**
     * Validation rules for one step ('org' or 'account'), honouring enabled +
     * required. Disabled fields get no rule (ignored); enabled fields are
     * required|... or nullable|... per config.
     *
     * @return array<string, string>
     */
    public static function rulesForStep(string $step): array
    {
        $config = self::config();
        $rules = [];

        foreach (self::FIELDS as $key => $meta) {
            if ($meta['step'] !== $step) {
                continue;
            }
            $field = $config['fields'][$key];
            if (!$field['enabled']) {
                continue;
            }
            $rules[$key] = ($field['required'] ? 'required' : 'nullable') . '|' . $meta['rule'];
        }

        return $rules;
    }
}
