<?php

namespace App\Support;

use App\Models\SiteSetting;

/**
 * Mirror of the main app's RegistrationForm definition (shared DB, separate
 * codebases). The super-admin panel edits this config; the main setup wizard
 * reads it. Keep the FIELDS list in sync with the main app.
 */
class RegistrationForm
{
    public const SETTING_KEY = 'registration_form_config';

    public const FIELDS = [
        'commercial_activity'          => ['step' => 'org',     'label_ar' => 'النشاط التجاري',            'label_en' => 'Commercial activity'],
        'branches_count'               => ['step' => 'org',     'label_ar' => 'عدد الفروع',                'label_en' => 'Branches count'],
        'manager_type'                 => ['step' => 'org',     'label_ar' => 'صفة مقدم الطلب',            'label_en' => 'Manager type'],
        'responsible_position'         => ['step' => 'org',     'label_ar' => 'المنصب',                    'label_en' => 'Responsible position'],
        'cr_number'                    => ['step' => 'org',     'label_ar' => 'السجل التجاري',             'label_en' => 'Commercial registration'],
        'vat_number'                   => ['step' => 'org',     'label_ar' => 'الرقم الضريبي',             'label_en' => 'VAT number'],
        'license_number'               => ['step' => 'org',     'label_ar' => 'رخصة السياحة',              'label_en' => 'Tourism licence'],
        'license_expiry'               => ['step' => 'org',     'label_ar' => 'انتهاء رخصة السياحة',       'label_en' => 'Licence expiry'],
        'municipality_license_number'  => ['step' => 'org',     'label_ar' => 'رخصة البلدية',              'label_en' => 'Municipality licence'],
        'municipality_license_expiry'  => ['step' => 'org',     'label_ar' => 'انتهاء رخصة البلدية',       'label_en' => 'Municipality expiry'],
        'first_name'                   => ['step' => 'account', 'label_ar' => 'الاسم الأول',               'label_en' => 'First name'],
        'last_name'                    => ['step' => 'account', 'label_ar' => 'اسم العائلة',               'label_en' => 'Last name'],
        'city'                         => ['step' => 'account', 'label_ar' => 'المدينة',                   'label_en' => 'City'],
        'phone'                        => ['step' => 'account', 'label_ar' => 'رقم الجوال',                'label_en' => 'Phone'],
    ];

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
}
