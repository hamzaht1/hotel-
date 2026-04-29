# Plan de travail — Diyafah

Basé sur le document PDF client « الأخطاء والتعديلات التقنية » (12 pages) croisé avec l'état actuel du code.

Légende statut code :
- ✅ Existe et conforme
- 🟡 Existe partiellement / à corriger
- 🔴 Manquant / à créer entièrement
- 🐛 Bug listé par le client (page 12 du PDF)

---

## Phase 0 — Bugs bloquants (Sprint 1, ~1 semaine)

Liste prise du « سجل الأخطاء » (page 12). À traiter en priorité.

### Super-Admin (ضيافة)

| # | Bug client | Localisation code | Action |
|---|-----------|-------------------|--------|
| 0.1 | 🐛 Ouverture du reçu (إيصال) dans une demande ne fonctionne pas | `super-admin/app/Http/Controllers/SuperAdmin/TenantController.php` + pages tenants | Vérifier la route / le lien vers `receipt_path` (stockage `public/storage`) et ajouter une modal de prévisualisation |
| 0.2 | 🐛 Formulaire « Ajouter mestaajir » ne reflète pas le formulaire client (pas de pièces jointes, pas de mot de passe) | `super-admin/.../TenantController.php:75-81` | Aligner le schéma du formulaire avec `SetupController`, ajouter champs password + attachments non-obligatoires |
| 0.3 | 🐛 Page login — absence de « mot de passe oublié » | `super-admin/routes/auth.php` + `super-admin/resources/js/pages/auth/login.tsx` | Vérifier que `password.request` est bien câblé ; ajouter le lien dans l'UI login |
| 0.4 | 🐛 Renouvellement : la facture n'est pas créée, la méthode de paiement souhaitée n'apparaît pas | `app/Http/Controllers/ClientAdmin/RenewalController.php:176-189` + super-admin approve | Sur `approve()` / webhook Tap, créer `Invoice` avec lien `renewal_request_id` ; afficher `payment_method` dans la vue admin |
| 0.5 | 🐛 Packages : le prix n'est pas mis à jour au paiement | `super-admin/.../PlanController.php` + `SetupController` | Relire le prix depuis la DB au moment du `createCharge` au lieu de la session |
| 0.6 | 🐛 Facture : impossible de modifier/supprimer après envoi | `super-admin/.../InvoiceController.php` | Autoriser edit tant que `status != paid` ; ajouter flag `locked_at` |
| 0.7 | 🐛 Facture : design non éditable, titre/numéro fiscal non personnalisables | `app/Models/Invoice.php` + Blade PDF | Ajouter colonnes : `company_header`, `tax_number`, `billing_address`, `footer_notes` |
| 0.8 | 🐛 Facture : impossible de demander un document (reçu) au client | nouveau | Ajouter champ `requires_receipt` et workflow d'upload côté client-admin |
| 0.9 | 🐛 Pages (النظام > الصفحات) ne fonctionnent pas + URL de la page inconnue | `super-admin/.../PageController.php` | Vérifier la route publique `/pages/{slug}`, exposer le slug dans l'UI |
| 0.10 | 🐛 Menus / قوائم ne fonctionnent pas | `super-admin/.../MenuController.php` | Corriger le rendu dans `resources/js/pages/*/header-menu` côté public |
| 0.11 | 🐛 Hoté identité (هوية الموقع) incomplète | `super-admin/.../SiteSettingController.php` | Compléter logo dark mode, couleurs par thème, texte du site |
| 0.12 | 🐛 Messages/support : ordre d'affichage incorrect | `super-admin/.../ReportController.php:101-176` (table `support_messages`) | Changer `orderBy('created_at', 'asc')` au lieu de desc dans le thread |
| 0.13 | 🐛 Paramètres (⚙️ menu compte) affiche une page blanche | router super-admin | Créer/corriger la route `super-admin/settings` et la page Inertia associée |

### Client-Admin

| # | Bug client | Localisation code | Action |
|---|-----------|-------------------|--------|
| 0.14 | 🐛 Chambres : champs « équipements » et description cassés | `app/Http/Controllers/ClientAdmin/RoomController.php` + `resources/js/pages/client-admin/rooms/form.tsx` | Corriger la sérialisation du champ `amenities` (array) et la validation |
| 0.15 | 🐛 Galerie : image uploadée ne s'affiche pas sur le site | `GalleryController.php` + `resources/js/pages/public/*/Gallery.tsx` | Vérifier le chemin `storage/app/public` et `php artisan storage:link` en prod |
| 0.16 | 🐛 Textes du site : édition sans effet | `SiteTextController.php` | Vérifier clés `value_ar/value_en` et cache côté template |
| 0.17 | 🐛 Ordre des sections et ajout de sections non fonctionnels | `SiteSectionController.php:10-42` | Ajouter endpoint `store` (actuellement absent) + bouton UI + corriger `reorder` |
| 0.18 | 🐛 Formulaire « Contact » + réglages contact ne marchent pas | `ContactController.php` + `ContactSettingController.php` | Vérifier route publique `POST /contact` et persistance |
| 0.19 | 🐛 Réglages de l'hôtel : partiellement cassés | `HotelSettingController.php` | Corriger le flux de mise à jour (upload logo/favicon) |
| 0.20 | 🐛 Services + catégories de services : ne fonctionnent pas | `ServiceController.php` + `ServiceCategoryController.php` | Re-tester CRUD complet + affichage côté template |
| 0.21 | 🐛 Permissions : ne fonctionnent pas correctement | `RoleController.php` + middleware `can:*` | Revoir le seed des permissions, tester chaque rôle |

---

## Phase 1 — Fonctionnalités majeures manquantes (Sprint 2-3, ~2-3 semaines)

### 1.1 🔴 Module Avis Clients (آراء العملاء)
**Spec PDF pages 9-11**. Aucun modèle `Review` n'existe actuellement.

**À créer** :
- Migration `reviews` : `id, tenant_id, guest_name, rating (1-5), comment, status (new|in_progress|replied|needs_followup|positive|negative), is_published, created_at`
- Migration `review_forms` : formulaire de sondage configurable par hôtel
- Modèles `Review`, `ReviewForm`, `ReviewFormField`
- **Super-admin** : `super-admin/app/Http/Controllers/SuperAdmin/ReviewController.php` + page listing (filtres positif/négatif/nouveau/en cours/répondu/à suivre) + détails client
- **Client-admin** : `app/Http/Controllers/ClientAdmin/ReviewController.php` + page (total, moyenne, filtres, bouton « Publier/Masquer ») + builder de formulaire
- **Public** : route `/review/{token}` pour soumission par le guest
- **Popup automatique** : après 7 jours d'abonnement, display popup au client principal (pas employés). Si note < 2 → demander motif. Implémenter via middleware + flag `review_popup_shown_at`

### 1.2 🔴 Gestion de domaine côté client-admin
**Spec PDF page 10**. Le client doit pouvoir lier son propre nom de domaine.

- Contrôleur `ClientAdmin/DomainController.php`
- Page avec DNS instructions (A/CNAME records)
- Intégration optionnelle avec un registrar (à lister)
- Vérification automatique via job périodique

### 1.3 🔴 Création de templates depuis le super-admin
**Spec PDF page 4**. Actuellement seulement lecture/toggle.

- Ajouter `TemplateController::store()` + formulaire : `id, name, city, domain, preview_image, is_active, is_coming_soon`
- Exposer dans le flux de choix client
- Dashboard super-admin : cartes « Templates actifs / inactifs / total »

### 1.4 🟡 Factures évoluées
En plus des points 0.6 à 0.8 :
- Multi-template PDF (choix par le client-admin)
- Champ « tax_number », `billing_address`, `company_logo`
- Workflow « demande de reçu au client »
- Génération automatique lors renouvellement (0.4)

---

## Phase 2 — Améliorations sur fonctionnalités existantes (Sprint 4, ~1.5 semaine)

### 2.1 Dashboard super-admin (PDF page 1)
- Navigation « voir plus » vers sections (Demandes, Factures, Clients)
- Métrique « Satisfaction clients = moyenne rating » (dépend de 1.1)

### 2.2 Tenants — améliorations (PDF pages 1-3)
- 🟡 Bouton « Nouvelle demande » : formulaire de l'admin (tous champs non obligatoires)
- 🟡 Icône crayon : modal détails complets (paiement + client + messages)
- 🟡 Filtres additionnels cumulables (statut × ville × plan × template × date)
- 🔴 Onglet « Rapports client » en cartes : nb sections, images, services, pièces jointes, visites site, pages, employés, messages
- 🔴 Onglet Paiements (tableau : n° opération, date, méthode, statut, action)
- 🔴 Onglet Factures (n° facture, date, méthode, type, montant, statut, actions)
- 🔴 Onglet Demandes (n° demande, date, package, ville, template, statut, action)
- 🔴 Onglet Messages hôtel ↔ admin

### 2.3 Plans & Templates (PDF pages 3-4)
- Ajouter flag `is_coming_soon` sur `Plan`
- Contrôle de styling des features : couleur texte, poids de police, icône à côté
- Statuts templates : actif / inactif / coming_soon + visible sur site oui/non
- Champs custom (dropdown, checkbox) pour le formulaire d'inscription

### 2.4 Codes promo (PDF page 5)
- 🐛 Bug date « قبلي » (date passée) : revoir la validation `valid_from < valid_until` et les casts de date dans `DiscountCode` model

### 2.5 Paramètres système (PDF pages 6-7)
- Option « afficher header/footer » à la création d'une page
- Hoté identité : dark mode logos + couleurs + textes + inspiration vidéo fournie
- Listes : liaison à une page OU à une section d'une page (ancre)
- Intégrations : si une passerelle de paiement activée → désactiver les autres automatiquement (validation mutuelle)
- Click sur logo Diyafah/client → retour accueil plateforme
- Formulaire d'inscription : gestion des champs custom (texte ou pièce jointe), champs obligatoires figés (nom, téléphone, email, logo, mdp, template, domaine, RIB)

### 2.6 Utilisateurs (PDF pages 7-8)
- Employés : champs (nom, tel, email, rôle, photo, mdp). Admin peut reset mdp
- Clients : mêmes champs + bloc « Données plateforme » (template, domaine) + affichage des logos clients dans la liste

### 2.7 Messages & Support (PDF page 8)
- 🔴 Pièces jointes (migration `support_message_attachments`)
- 🔴 Section « urgence » configurable depuis l'admin (répercutée chez client)
- Marquage lu / répondu
- Section non-supprimable « Messages contact-us » reçus via le formulaire public

---

## Phase 3 — Côté client-admin : Services & Compte (Sprint 5, ~1 semaine)

**PDF pages 10-11**.

### 3.1 Services management
- ✅ CRUD existe déjà
- 🟡 Ajouter bouton « Données requises » après création → champs custom demandés au guest final

### 3.2 Compte de l'établissement
- 🔴 Section unifiée « إدارة الاشتراك » : état abonnement + bouton « Renouveler » ouvrant le flux Tap
- 🟡 Factures : auto-générées + envoyées par l'admin (dépend de 0.4)
- ✅ Données de l'établissement : existe (HotelSettings)

### 3.3 Utilisateurs côté client-admin
- Aligner sur le modèle super-admin (création employé + permissions)

---

## Phase 4 — Polish & QA (Sprint 6, ~3-4 jours)

- Tests end-to-end flux setup + renouvellement + Tap
- Tests multi-tenant (isolation données)
- Revue i18n AR/EN sur toutes les nouvelles pages
- Mode RTL/LTR + dark mode
- Vérification responsive (mobile)
- Audit des routes non mappées (ex : `reports/financial` client-admin manquant dans `routes/web.php:168-171`)
- Lighthouse + cache templates

---

## Ordre d'exécution recommandé

1. **Sprint 1 (cette semaine)** : Phase 0 — débloquer les 21 bugs
2. **Sprint 2** : Module Reviews (1.1) — gros chunk métier
3. **Sprint 3** : Domaines (1.2) + Templates création (1.3) + Factures évoluées (1.4)
4. **Sprint 4** : Améliorations Tenants/Plans/Paramètres (2.1 → 2.7)
5. **Sprint 5** : Services + compte client (3.x)
6. **Sprint 6** : QA + polish

**Durée totale estimée : 7-8 semaines** à 1 développeur temps plein.

---

## Risques techniques

- **Migration de DB** : ajout de nombreux champs (reviews, factures, plans). Prévoir un script de migration propre + seed.
- **Webhook Tap** : actuellement crée uniquement la session renouvellement ; à étendre pour générer Invoice.
- **Multi-tenant isolation** : vérifier le scope global sur tous les nouveaux modèles (`BelongsToTenant` trait).
- **Stockage fichiers** : la galerie ne s'affiche pas en prod → probable absence de `storage:link` ou config Cloudflare R2 à finaliser (le projet supporte R2 depuis le commit `5e48db0`).
- **Permissions** : le système actuel est instable — une refonte courte peut être nécessaire avant d'ajouter de nouveaux modules.
