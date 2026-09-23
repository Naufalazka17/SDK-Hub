import { supabase } from '../lib/supabase';
import { Project, ProjectWithDetails, SDK_PROJECT_STAGES, Role } from '../types';
import { assertPermission } from '../lib/permissions';

interface TemplateStarterTask {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_hours: number;
}

export const TEMPLATE_STARTER_TASKS: Record<string, TemplateStarterTask[]> = {
  'Healthcare System': [
    {
      title: 'Analisis Kebutuhan SIRS & Regulasi SatuSehat FHIR',
      description: 'Review regulasi Kemenkes KMK No. HK.01.07/MENKES/1423/2022 dan pemetaan variabel data pasien.',
      priority: 'CRITICAL',
      estimated_hours: 24,
    },
    {
      title: 'Desain Arsitektur BPJS Trustmark & Bridging System',
      description: 'Penyusunan diagram integrasi VClaim, Antrean RS, dan E-Klaim.',
      priority: 'HIGH',
      estimated_hours: 16,
    },
    {
      title: 'Setup Skema Database Pasien & Rekam Medis Elektronik (RME)',
      description: 'Pembuatan skema PostgreSQL ICD-10, ICD-9-CM, anamnesa, dan observasi klinis.',
      priority: 'HIGH',
      estimated_hours: 20,
    },
    {
      title: 'Implementasi Modul Pendaftaran & Poliklinik Rawat Jalan',
      description: 'Pengembangan workflow check-in antrean, triase awal, dan rekam medis dokter.',
      priority: 'HIGH',
      estimated_hours: 32,
    },
    {
      title: 'Integrasi API SatuSehat Kemenkes FHIR R4',
      description: 'Bridging resource Encounter, Condition, MedicationRequest ke sandbox SatuSehat.',
      priority: 'CRITICAL',
      estimated_hours: 24,
    },
    {
      title: 'Regression Testing Modul Farmasi & E-Prescription',
      description: 'Validasi resep elektronik, pengecekan stok obat FIFO, dan integrasi kasir.',
      priority: 'MEDIUM',
      estimated_hours: 16,
    },
  ],
  'Social Analysis': [
    {
      title: 'Perancangan Pipeline Crawling Data & Scraper Social Media',
      description: 'Setup crawler Twitter/X, Instagram, dan online news portal dengan proxy rotation.',
      priority: 'CRITICAL',
      estimated_hours: 24,
    },
    {
      title: 'Setup Data Lake & Ingestion Index Elasticsearch',
      description: 'Konfigurasi Kafka stream dan cluster Elasticsearch untuk text search berkecepatan tinggi.',
      priority: 'HIGH',
      estimated_hours: 20,
    },
    {
      title: 'Implementasi NLP Sentiment Analysis Engine',
      description: 'Training model IndoBERT / lexicon sentiment positive, negative, and neutral.',
      priority: 'HIGH',
      estimated_hours: 32,
    },
    {
      title: 'Desain Dashboard Visualisasi Tren & Wordcloud',
      description: 'Widget interaktif grafik share-of-voice, top hashtags, dan influencer metrics.',
      priority: 'MEDIUM',
      estimated_hours: 20,
    },
    {
      title: 'Stress Testing Ingestion 10,000 Events/Sec',
      description: 'Benchmark performa queue RabbitMQ/Kafka dan throughput Elasticsearch.',
      priority: 'HIGH',
      estimated_hours: 16,
    },
  ],
  'Digital Public Service': [
    {
      title: 'Penyusunan Arsitektur SPBE & Integrasi SSO Nasional',
      description: 'Kepatuhan standar arsitektur SPBE Kemenpan-RB dan integrasi Identitas Kependudukan Digital.',
      priority: 'CRITICAL',
      estimated_hours: 24,
    },
    {
      title: 'Desain Antarmuka Layanan Aspirasi & Pengaduan Warga',
      description: 'Wireframing responsive portal pengaduan warga dengan geolokasi dan bukti foto.',
      priority: 'HIGH',
      estimated_hours: 16,
    },
    {
      title: 'Pengembangan Modul Pengajuan Berkas Digital & TTE',
      description: 'Integrasi sertifikat digital BSrE untuk tanda tangan elektronik berkas perizinan.',
      priority: 'CRITICAL',
      estimated_hours: 30,
    },
    {
      title: 'Security Vulnerability Assessment & Pen-Test',
      description: 'Pengujian celah OWASP Top 10, SQLi, XSS, dan CSRF pada portal publik.',
      priority: 'HIGH',
      estimated_hours: 18,
    },
    {
      title: 'UAT Stakeholder Dinas & Sosialisasi Pengguna',
      description: 'Sesi pengujian bersama perwakilan dinas terkait dan penyesuaian feedback.',
      priority: 'MEDIUM',
      estimated_hours: 16,
    },
  ],
  'Custom Application': [
    {
      title: 'Requirement Gathering & System Architecture Document',
      description: 'Identifikasi user stories, system boundaries, and non-functional requirements.',
      priority: 'HIGH',
      estimated_hours: 16,
    },
    {
      title: 'Database Schema Design & ERD Modeling',
      description: 'Normalisasi tabel relasional, foreign keys, and indexing strategy.',
      priority: 'HIGH',
      estimated_hours: 16,
    },
    {
      title: 'Setup Authentication, RBAC & Security Middleware',
      description: 'Implementasi JWT session management, role guards, and audit trail.',
      priority: 'CRITICAL',
      estimated_hours: 20,
    },
    {
      title: 'Core Feature Module Development Sprint 1',
      description: 'Implementasi endpoint REST API dan antarmuka komponen UI utama.',
      priority: 'HIGH',
      estimated_hours: 32,
    },
    {
      title: 'Unit & End-to-End Integration Testing',
      description: 'Pengujian fungsional modul dan penanganan error boundary.',
      priority: 'MEDIUM',
      estimated_hours: 16,
    },
  ],
  'API Integration': [
    {
      title: 'Audit Dokumentasi API Partner & Endpoint Mapping',
      description: 'Review format request/response, rate limit, dan mekanisme otentikasi (OAuth2 / HMAC).',
      priority: 'CRITICAL',
      estimated_hours: 16,
    },
    {
      title: 'Implementasi API Gateway, Rate Limiting & Auth Tokens',
      description: 'Setup reverse proxy, caching layer Redis, dan validasi signature token.',
      priority: 'HIGH',
      estimated_hours: 24,
    },
    {
      title: 'Middleware Transformer Request/Response Payload',
      description: 'Standardisasi format response JSON error handling dan retry mechanism exponential backoff.',
      priority: 'HIGH',
      estimated_hours: 20,
    },
    {
      title: 'Contract Testing API Mock vs Sandbox Partner',
      description: 'Verifikasi skenario edge case: timeout, 5xx server error, duplicate idempotency key.',
      priority: 'MEDIUM',
      estimated_hours: 16,
    },
    {
      title: 'Staging Deployment & Webhook Monitoring Setup',
      description: 'Konfigurasi alert webhook latency and uptime monitoring via Prometheus/Grafana.',
      priority: 'HIGH',
      estimated_hours: 16,
    },
  ],
};

export const projectService = {
  async getProjects(): Promise<ProjectWithDetails[]> {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        lead:profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    // Fetch task counts for each project to calculate live progress
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, project_id, stage_key');

    return (projects || []).map((proj) => {
      const projTasks = tasks?.filter((t) => t.project_id === proj.id) || [];
      const completed = projTasks.filter((t) => t.stage_key === 'DONE').length;
      return {
        ...proj,
        task_count: projTasks.length,
        completed_task_count: completed,
      } as ProjectWithDetails;
    });
  },

  async getProjectById(id: string): Promise<ProjectWithDetails | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        lead:profiles(*),
        stages:project_stages(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project by ID:', error);
      return null;
    }

    return data as ProjectWithDetails;
  },

  async createProject(
    projectData: {
      title: string;
      client_id?: string;
      lead_id?: string;
      delivery_model: string;
      template_type: string;
      budget?: number;
      start_date?: string;
      target_end_date?: string;
      description?: string;
      memberIds?: string[];
    },
    callerRole?: Role
  ): Promise<Project> {
    if (callerRole) {
      assertPermission(callerRole, 'project:create', 'Hanya Administrator atau Project Lead yang dapat membuat proyek baru.');
    }

    const code = `SDK-PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        code,
        title: projectData.title.trim(),
        client_id: projectData.client_id || null,
        lead_id: projectData.lead_id || null,
        delivery_model: projectData.delivery_model,
        template_type: projectData.template_type,
        stage: 'PITCHING',
        health_score: 95,
        budget: projectData.budget || 0,
        progress_percentage: 0,
        start_date: projectData.start_date || new Date().toISOString().split('T')[0],
        target_end_date: projectData.target_end_date || null,
        description: projectData.description || '',
      })
      .select()
      .single();

    if (error || !newProject) {
      console.error('Error creating project:', error);
      throw new Error(`Gagal membuat project: ${error?.message || 'Database error'}`);
    }

    // Auto-generate the 15 SDK stages for this project
    const stageInserts = SDK_PROJECT_STAGES.map((s, idx) => ({
      project_id: newProject.id,
      stage_key: s.key,
      sequence_order: s.step,
      name: s.label,
      status: idx === 0 ? 'IN_PROGRESS' : 'PENDING',
      is_current: idx === 0,
    }));

    await supabase.from('project_stages').insert(stageInserts);

    // Auto-create initial project conversations (internal and client)
    await supabase.from('conversations').insert([
      {
        project_id: newProject.id,
        title: `${newProject.title} - Client Channel`,
        is_internal: false,
        type: 'PROJECT_CLIENT',
      },
      {
        project_id: newProject.id,
        title: `${newProject.title} - Team Internal`,
        is_internal: true,
        type: 'PROJECT_INTERNAL',
      },
    ]);

    // Insert team members if provided
    if (projectData.memberIds && projectData.memberIds.length > 0) {
      await supabase.from('project_members').insert(
        projectData.memberIds.map((uid) => ({
          project_id: newProject.id,
          user_id: uid,
          role_in_project: 'MEMBER',
          allocated_hours_per_week: 20,
        }))
      );
    }

    // Seed starter tasks for the chosen template (all strictly starting at BACKLOG / TODO, 0% progress)
    const isBlank = !projectData.template_type || 
      projectData.template_type.toLowerCase().includes('blank');

    if (!isBlank) {
      const templateTasks = TEMPLATE_STARTER_TASKS[projectData.template_type] || 
        TEMPLATE_STARTER_TASKS['Custom Application'] || [];

      if (templateTasks.length > 0) {
        const leadAssignee = projectData.lead_id || 
          (projectData.memberIds && projectData.memberIds.length > 0 ? projectData.memberIds[0] : null);

        const tasksToInsert = templateTasks.map((t, idx) => ({
          project_id: newProject.id,
          stage_key: 'BACKLOG' as const,
          status: 'TODO' as const,
          title: t.title,
          description: t.description,
          priority: t.priority,
          estimated_hours: t.estimated_hours,
          actual_hours: 0,
          position_order: idx,
          assignee_id: leadAssignee || null,
          reporter_id: projectData.lead_id || null,
          start_date: projectData.start_date || new Date().toISOString().split('T')[0],
          due_date: projectData.target_end_date || null,
        }));

        const { error: seedError } = await supabase.from('tasks').insert(tasksToInsert);
        if (seedError) {
          console.warn('Warning: Failed to seed starter tasks for template:', seedError);
        }
      }
    }

    // Log Activity
    if (projectData.lead_id) {
      await supabase.from('activity_logs').insert({
        project_id: newProject.id,
        actor_id: projectData.lead_id,
        action: 'PROJECT_CREATED',
        entity_type: 'PROJECT',
        entity_id: newProject.id,
        details: { title: newProject.title, code: newProject.code, template: projectData.template_type },
      });
    }

    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>, callerRole?: Role): Promise<Project> {
    if (callerRole) {
      assertPermission(callerRole, 'project:edit', 'Hanya Administrator atau Project Lead yang dapat mengubah proyek.');
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string, callerRole?: Role): Promise<void> {
    if (callerRole) {
      assertPermission(callerRole, 'project:delete', 'Hanya Administrator yang memiliki wewenang untuk menghapus proyek.');
    }

    // Clean up dependent child tables safely in order
    await supabase.from('tasks').delete().eq('project_id', id);
    await supabase.from('project_stages').delete().eq('project_id', id);
    await supabase.from('project_members').delete().eq('project_id', id);
    await supabase.from('milestones').delete().eq('project_id', id);
    await supabase.from('project_timelines').delete().eq('project_id', id);
    await supabase.from('conversations').delete().eq('project_id', id);
    await supabase.from('activity_logs').delete().eq('project_id', id);

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  calculateHealthScore(metrics: {
    timelineAdherencePercent: number; // 0 - 100
    taskCompletionPercent: number;    // 0 - 100
    clientResponseScore: number;       // 0 - 100
    resourceUtilizationScore: number;  // 0 - 100
  }): { score: number; status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL' } {
    const score = Math.round(
      metrics.timelineAdherencePercent * 0.3 +
      metrics.taskCompletionPercent * 0.3 +
      metrics.clientResponseScore * 0.2 +
      metrics.resourceUtilizationScore * 0.2
    );

    let status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL' = 'HEALTHY';
    if (score < 70) status = 'CRITICAL';
    else if (score < 90) status = 'AT_RISK';

    return { score, status };
  },
};
