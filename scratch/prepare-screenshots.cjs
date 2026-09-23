const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'qa-screenshots');
const docsDir = path.join(__dirname, '..', 'docs');
const targetScreenshotsDir = path.join(docsDir, 'screenshots');
const targetAssetsDir = path.join(docsDir, 'assets');

// Ensure directories
fs.mkdirSync(targetScreenshotsDir, { recursive: true });
fs.mkdirSync(targetAssetsDir, { recursive: true });

// Copy logo
const logoSrc = path.join(__dirname, '..', 'public', 'logo.png');
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, path.join(targetScreenshotsDir, 'logo-sdk.png'));
  fs.copyFileSync(logoSrc, path.join(targetAssetsDir, 'favicon.png'));
  console.log('✅ Copied logo to docs/screenshots/logo-sdk.png and docs/assets/favicon.png');
}

// Mapping of standardized target screenshot names to source files in qa-screenshots
const mapping = {
  // Auth & General
  '01-login-page.png': 'test_1_1_login_initial.png',
  '01b-login-role-simulator.png': 'test_1_1_role_presets_tested.png',
  '01c-login-validation.png': 'test_1_1_empty_login_validation.png',
  '01d-login-password-shown.png': 'test_1_1_password_shown.png',
  '03-admin-profile-dropdown.png': 'test_2_2_profile_dropdown_open.png',
  'global-search-modal.png': 'test_2_2_search_modal_open.png',
  'global-search-shortcut.png': 'test_8_8_ctrl_k_modal_open.png',

  // Admin Dashboard & Overview
  '02-admin-dashboard.png': 'phase1_admin_dashboard___root.png',
  '04-admin-dashboard-full.png': 'test_2_1_dashboard_main.png',
  '04b-admin-kpi-hover.png': 'test_8_9_kpi_card_hovered.png',
  '04c-admin-chart-tooltip.png': 'test_2_1_chart_hover_tooltip.png',
  '05-admin-project-detail-modal.png': 'test_2_1_project_detail_modal_open.png',

  // Projects Directory & Details
  '04-admin-projects-list.png': 'phase1_admin_projects_directory.png',
  '04b-admin-projects-filtered.png': 'test_2_4_search_filtered.png',
  '05-admin-project-detail.png': 'test_2_6_project_detail_overview.png',
  '05b-admin-create-project.png': 'test_2_5_create_project_initial.png',
  '05c-admin-create-project-filled.png': 'test_2_5_form_filled.png',
  '05d-admin-project-delete-modal.png': 'test_2_4_delete_modal_open.png',

  // Kanban & Orchestration
  '06-admin-kanban.png': 'phase1_admin_orchestration_board.png',
  '06b-admin-kanban-board.png': 'test_2_7_kanban_board.png',
  '07-admin-kanban-create-task.png': 'test_2_7_create_task_modal_open.png',
  '07b-admin-kanban-task-blocked.png': 'test_2_7_task_blocked_checked.png',
  '07c-admin-kanban-filtered.png': 'test_2_7_priority_filtered.png',

  // Timeline & Gantt
  '08-admin-timeline.png': 'phase1_admin_timeline___gantt.png',
  '08b-admin-timeline-gantt.png': 'test_2_8_timeline_gantt_initial.png',
  '08c-admin-global-timeline.png': 'phase1_admin_global_timeline.png',
  '08d-admin-global-timeline-year.png': 'test_2_9_global_timeline_initial.png',

  // Resources & Team
  '09-admin-resources.png': 'phase1_admin_resources.png',
  '09b-admin-resource-drawer.png': 'test_2_10_resource_drawer_open.png',
  '09c-admin-resource-tab.png': 'test_2_10_resource_drawer_tab.png',

  // Users Management
  '10-admin-users-list.png': 'phase1_admin_users_management.png',
  '11-admin-users-add-modal.png': 'test_2_11_add_user_modal_open.png',
  '11b-admin-user-drawer.png': 'test_2_11_user_drawer_open.png',

  // Clients Management
  '12-admin-clients-list.png': 'phase1_admin_clients_management.png',
  '13-admin-clients-add-modal.png': 'test_2_12_add_client_modal_open.png',
  '13b-admin-client-form-filled.png': 'test_2_12_add_client_modal_filled.png',
  '13c-admin-client-credentials.png': 'test_2_12_client_credentials_modal.png',

  // Templates
  '14-admin-templates.png': 'phase1_admin_templates.png',
  '14b-admin-template-preview.png': 'test_2_13_template_preview_modal.png',

  // Realtime Chat
  '15-admin-chat.png': 'phase1_admin_realtime_chat.png',
  '15b-admin-chat-message-sent.png': 'test_2_14_message_sent.png',
  '15c-admin-chat-group-modal.png': 'test_2_14_new_group_modal_open.png',

  // Files Repository
  '16-admin-files.png': 'phase1_admin_files_repository.png',
  '16b-admin-files-category.png': 'test_2_15_category_tab_clicked.png',

  // Time Tracking
  '17-admin-time-tracking.png': 'phase1_admin_time_tracking.png',
  '17b-admin-time-analytics.png': 'test_2_16_tab_analytics.png',
  '17c-admin-time-audit.png': 'test_2_16_tab_audit.png',

  // Reports & Analytics
  '18-admin-reports.png': 'phase1_admin_reports___analytics.png',
  '18b-admin-reports-filtered.png': 'test_2_17_reports_filtered.png',

  // Activity Log
  '19-admin-activity.png': 'phase1_admin_activity_log.png',
  '19b-admin-activity-pill.png': 'test_2_18_category_pill_selected.png',

  // Notifications
  '20-admin-notifications.png': 'phase1_admin_notifications.png',
  '20b-admin-notification-drawer.png': 'test_2_19_notification_drawer_open.png',

  // Settings & Profile
  '21-admin-settings.png': 'phase1_admin_settings.png',
  '21b-admin-settings-account.png': 'test_2_20_settings_account_tab.png',
  '21c-admin-avatar-crop.png': 'test_2_20_avatar_crop_modal_open.png',
  '21d-admin-theme-dark.png': 'test_2_20_theme_dark.png',
  '21e-admin-theme-light.png': 'test_2_20_theme_light.png',

  // PROJECT_LEAD
  '22-lead-dashboard.png': 'test_3_1_lead_dashboard_initial.png',
  '22b-lead-pie-chart.png': 'test_3_1_lead_pie_chart.png',
  '22c-lead-project-modal.png': 'test_3_1_lead_project_detail_modal.png',
  '23-lead-sidebar.png': 'test_3_2_lead_sidebar.png',
  '23-lead-overdue-alert.png': 'test_3_1_lead_kpis_clicked.png',
  '23b-lead-clients.png': 'test_3_3_lead_clients_accessible.png',
  '23c-lead-reports.png': 'test_3_3_lead_reports_accessible.png',
  '23d-lead-templates.png': 'test_3_3_lead_templates_accessible.png',
  '23e-lead-rbac-blocked.png': 'test_3_3_lead_users_blocked.png',

  // STAFF
  '24-staff-dashboard.png': 'phase3_staff_dashboard.png',
  '24b-staff-dashboard-initial.png': 'test_4_1_staff_dashboard_initial.png',
  '25-staff-clock-in.png': 'test_4_1_staff_clocked_in.png',
  '25b-staff-clock-out.png': 'test_4_1_staff_clocked_out.png',
  '25c-staff-tasks.png': 'test_4_1_staff_task_filters.png',
  '25d-staff-kanban-move.png': 'test_4_1_staff_task_moved.png',
  '25e-staff-sidebar.png': 'test_4_2_staff_sidebar.png',
  '25f-staff-chat.png': 'test_4_4_staff_chat.png',
  '25g-staff-kanban.png': 'test_4_4_staff_kanban.png',
  '25h-staff-timetracking.png': 'test_4_4_staff_timetracking.png',
  '25i-staff-rbac-blocked.png': 'test_4_3_staff_clients_blocked.png',

  // CLIENT
  '26-client-cockpit.png': 'phase1_client_cockpit.png',
  '26b-client-cockpit-initial.png': 'test_5_1_client_cockpit_initial.png',
  '27-client-upload.png': 'test_5_1_client_upload_modal_open.png',
  '27b-client-upload-filled.png': 'test_5_1_client_upload_modal_filled.png',
  '28-client-revision.png': 'test_2_6_tab_kokpit.png',
  '29-client-approve.png': 'test_5_1_client_chat_tim_redirect.png',
  '29b-client-chat.png': 'test_5_4_client_chat_sent.png',
  '29c-client-sidebar.png': 'test_5_3_client_sidebar.png',
  '29d-client-rbac-blocked.png': 'test_5_2_client_rbac_dashboard_blocked.png',

  // E2E Flow
  'flow-01-admin-clients.png': 'phase3_clients.png',
  'flow-02-admin-add-client.png': 'test_2_12_add_client_modal_open.png',
  'flow-03-admin-credentials.png': 'test_2_12_client_credentials_modal.png',
  'flow-04-lead-create-project.png': 'test_2_5_create_project_initial.png',
  'flow-05-staff-kanban-board.png': 'test_4_4_staff_kanban.png',
  'flow-06-staff-clock-in.png': 'test_4_1_staff_clocked_in.png',
  'flow-07-client-cockpit-view.png': 'test_5_1_client_cockpit_initial.png',
  'flow-08-client-upload-modal.png': 'test_5_1_client_upload_modal_filled.png',

  // Responsive & PWA
  'responsive-desktop-1920.png': 'test_7_desktop-1920_dashboard.png',
  'responsive-desktop-1440.png': 'test_7_desktop-1440_dashboard.png',
  'responsive-tablet-768.png': 'test_7_tablet-768_dashboard.png',
  'responsive-mobile-375.png': 'test_7_mobile-375_dashboard.png',
  'responsive-mobile-360.png': 'test_7_mobile-360_dashboard.png',
  'responsive-mobile-drawer.png': 'test_7_mobile_drawer_open.png',
  'cockpit-mobile.png': 'phase5_cockpit_mobile.png',
  'cover-image.png': 'test_1_1_login_initial.png'
};

let copiedCount = 0;
for (const [targetName, srcName] of Object.entries(mapping)) {
  const sourcePath = path.join(srcDir, srcName);
  const targetPath = path.join(targetScreenshotsDir, targetName);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    copiedCount++;
  } else {
    console.warn(`⚠ Missing source: ${srcName} (for ${targetName})`);
  }
}

console.log(`✅ Successfully mapped and copied ${copiedCount} screenshots to ${targetScreenshotsDir}`);
