export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          entity: string
          entity_id: string
          id: string
          ip_address: unknown | null
          payload_hash: string | null
          severity: string | null
          time: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          entity: string
          entity_id: string
          id?: string
          ip_address?: unknown | null
          payload_hash?: string | null
          severity?: string | null
          time?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          entity?: string
          entity_id?: string
          id?: string
          ip_address?: unknown | null
          payload_hash?: string | null
          severity?: string | null
          time?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_runs: {
        Row: {
          created_at: string
          file_url: string | null
          finished_at: string | null
          id: string
          notes: string | null
          org_id: string
          rows_count: number | null
          started_at: string
          status: string
          tables_count: number | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          rows_count?: number | null
          started_at?: string
          status: string
          tables_count?: number | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          rows_count?: number | null
          started_at?: string
          status?: string
          tables_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_settings: {
        Row: {
          access_key_encrypted: string | null
          access_key_nonce: string | null
          bucket: string
          created_at: string
          enabled: boolean
          org_id: string
          prefix: string
          provider: string
          region: string | null
          secret_key_encrypted: string | null
          secret_key_nonce: string | null
          updated_at: string
        }
        Insert: {
          access_key_encrypted?: string | null
          access_key_nonce?: string | null
          bucket: string
          created_at?: string
          enabled?: boolean
          org_id: string
          prefix?: string
          provider: string
          region?: string | null
          secret_key_encrypted?: string | null
          secret_key_nonce?: string | null
          updated_at?: string
        }
        Update: {
          access_key_encrypted?: string | null
          access_key_nonce?: string | null
          bucket?: string
          created_at?: string
          enabled?: boolean
          org_id?: string
          prefix?: string
          provider?: string
          region?: string | null
          secret_key_encrypted?: string | null
          secret_key_nonce?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_import_history: {
        Row: {
          bank_name: string | null
          business_id: string | null
          created_at: string
          error_details: Json | null
          failed_rows: number
          file_name: string
          id: string
          import_batch_id: string | null
          imported_by: string
          org_id: string
          successful_rows: number
          total_rows: number
        }
        Insert: {
          bank_name?: string | null
          business_id?: string | null
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name: string
          id?: string
          import_batch_id?: string | null
          imported_by: string
          org_id: string
          successful_rows?: number
          total_rows?: number
        }
        Update: {
          bank_name?: string | null
          business_id?: string | null
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name?: string
          id?: string
          import_batch_id?: string | null
          imported_by?: string
          org_id?: string
          successful_rows?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "bank_import_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_import_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_txns: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string
          date: string
          direction: Database["public"]["Enums"]["direction"]
          id: string
          import_batch_id: string | null
          matched_expense_id: string | null
          narration: string | null
          org_id: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string
          date: string
          direction: Database["public"]["Enums"]["direction"]
          id?: string
          import_batch_id?: string | null
          matched_expense_id?: string | null
          narration?: string | null
          org_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          date?: string
          direction?: Database["public"]["Enums"]["direction"]
          id?: string
          import_batch_id?: string | null
          matched_expense_id?: string | null
          narration?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_txns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_txns_matched_expense_id_fkey"
            columns: ["matched_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_txns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          deleted_at: string | null
          epz: boolean | null
          id: string
          mne_member: boolean | null
          name: string
          org_id: string
          owner_id: string
          sector: string | null
          small_company: boolean | null
          tin: string | null
          turnover_band: string | null
          vat_registered: boolean | null
          year_end: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          epz?: boolean | null
          id?: string
          mne_member?: boolean | null
          name: string
          org_id: string
          owner_id: string
          sector?: string | null
          small_company?: boolean | null
          tin?: string | null
          turnover_band?: string | null
          vat_registered?: boolean | null
          year_end?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          epz?: boolean | null
          id?: string
          mne_member?: boolean | null
          name?: string
          org_id?: string
          owner_id?: string
          sector?: string | null
          small_company?: boolean | null
          tin?: string | null
          turnover_band?: string | null
          vat_registered?: boolean | null
          year_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cgt_events: {
        Row: {
          asset_type: string
          business_id: string
          cost: number | null
          created_at: string
          exempt_reason: string | null
          gain: number | null
          id: string
          legal_ref: string | null
          proceeds: number | null
          reinvest_amount: number | null
        }
        Insert: {
          asset_type: string
          business_id: string
          cost?: number | null
          created_at?: string
          exempt_reason?: string | null
          gain?: number | null
          id?: string
          legal_ref?: string | null
          proceeds?: number | null
          reinvest_amount?: number | null
        }
        Update: {
          asset_type?: string
          business_id?: string
          cost?: number | null
          created_at?: string
          exempt_reason?: string | null
          gain?: number | null
          id?: string
          legal_ref?: string | null
          proceeds?: number | null
          reinvest_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cgt_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cit_calcs: {
        Row: {
          assessable_profits: number | null
          business_id: string
          cit_payable: number | null
          cit_rate: number | null
          created_at: string
          development_levy: number | null
          development_levy_rate: number | null
          etr_percent: number | null
          etr_topup: number | null
          id: string
          is_mne: boolean | null
          turnover_band: string | null
        }
        Insert: {
          assessable_profits?: number | null
          business_id: string
          cit_payable?: number | null
          cit_rate?: number | null
          created_at?: string
          development_levy?: number | null
          development_levy_rate?: number | null
          etr_percent?: number | null
          etr_topup?: number | null
          id?: string
          is_mne?: boolean | null
          turnover_band?: string | null
        }
        Update: {
          assessable_profits?: number | null
          business_id?: string
          cit_payable?: number | null
          cit_rate?: number | null
          created_at?: string
          development_levy?: number | null
          development_levy_rate?: number | null
          etr_percent?: number | null
          etr_topup?: number | null
          id?: string
          is_mne?: boolean | null
          turnover_band?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cit_calcs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          business_id: string | null
          created_at: string
          created_by_pro: string
          id: string
          org_id: string | null
          person_user_id: string | null
          status: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          created_by_pro: string
          id?: string
          org_id?: string | null
          person_user_id?: string | null
          status?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          created_by_pro?: string
          id?: string
          org_id?: string | null
          person_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_pro_fkey"
            columns: ["created_by_pro"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_person_user_id_fkey"
            columns: ["person_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_person_user_id_fkey"
            columns: ["person_user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          created_at: string
          error_message: string | null
          file_url: string | null
          finished_at: string | null
          id: string
          org_id: string
          requested_by: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          finished_at?: string | null
          id?: string
          org_id: string
          requested_by: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          finished_at?: string | null
          id?: string
          org_id?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      delete_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_by: string
          scope: Database["public"]["Enums"]["delete_scope"]
          scope_ref: string
          status: Database["public"]["Enums"]["delete_request_status"]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_by: string
          scope: Database["public"]["Enums"]["delete_scope"]
          scope_ref: string
          status?: Database["public"]["Enums"]["delete_request_status"]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_by?: string
          scope?: Database["public"]["Enums"]["delete_scope"]
          scope_ref?: string
          status?: Database["public"]["Enums"]["delete_request_status"]
        }
        Relationships: []
      }
      docs: {
        Row: {
          created_at: string
          doc_type: string | null
          file_path: string
          id: string
          linked_entity: string | null
          org_id: string
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          file_path: string
          id?: string
          linked_entity?: string | null
          org_id: string
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          file_path?: string
          id?: string
          linked_entity?: string | null
          org_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "docs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements: {
        Row: {
          authority_to_file: boolean | null
          authority_url: string | null
          business_id: string | null
          client_id: string
          created_at: string
          deleted_at: string | null
          due_dates_json: Json | null
          escrow_status: Database["public"]["Enums"]["escrow_status"] | null
          fee_type: Database["public"]["Enums"]["engagement_fee_type"] | null
          id: string
          loe_url: string | null
          parties: Json | null
          pro_id: string
          quote: number | null
          scope: string | null
        }
        Insert: {
          authority_to_file?: boolean | null
          authority_url?: string | null
          business_id?: string | null
          client_id: string
          created_at?: string
          deleted_at?: string | null
          due_dates_json?: Json | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"] | null
          fee_type?: Database["public"]["Enums"]["engagement_fee_type"] | null
          id?: string
          loe_url?: string | null
          parties?: Json | null
          pro_id: string
          quote?: number | null
          scope?: string | null
        }
        Update: {
          authority_to_file?: boolean | null
          authority_url?: string | null
          business_id?: string | null
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          due_dates_json?: Json | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"] | null
          fee_type?: Database["public"]["Enums"]["engagement_fee_type"] | null
          id?: string
          loe_url?: string | null
          parties?: Json | null
          pro_id?: string
          quote?: number | null
          scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string | null
          category: string | null
          created_at: string
          date: string
          description: string | null
          flags_json: Json | null
          id: string
          invoice_id: string | null
          merchant: string | null
          ocr_json: Json | null
          org_id: string
          receipt_url: string[] | null
          user_id: string | null
          vat_amount: number | null
          vat_recoverable_pct: number | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          category?: string | null
          created_at?: string
          date: string
          description?: string | null
          flags_json?: Json | null
          id?: string
          invoice_id?: string | null
          merchant?: string | null
          ocr_json?: Json | null
          org_id: string
          receipt_url?: string[] | null
          user_id?: string | null
          vat_amount?: number | null
          vat_recoverable_pct?: number | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          flags_json?: Json | null
          id?: string
          invoice_id?: string | null
          merchant?: string | null
          ocr_json?: Json | null
          org_id?: string
          receipt_url?: string[] | null
          user_id?: string | null
          vat_amount?: number | null
          vat_recoverable_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filing_events: {
        Row: {
          created_at: string
          due_date: string
          filed_at: string | null
          filing_type: string
          id: string
          org_id: string
          period: string
        }
        Insert: {
          created_at?: string
          due_date: string
          filed_at?: string | null
          filing_type: string
          id?: string
          org_id: string
          period: string
        }
        Update: {
          created_at?: string
          due_date?: string
          filed_at?: string | null
          filing_type?: string
          id?: string
          org_id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "filing_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          business_id: string | null
          created_at: string | null
          created_by: string
          document_metadata: Json | null
          downloaded_at: string | null
          file_size: number | null
          file_url: string
          id: string
          org_id: string
          period: string
          status: string
          template_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          created_by: string
          document_metadata?: Json | null
          downloaded_at?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          org_id: string
          period: string
          status?: string
          template_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          created_by?: string
          document_metadata?: Json | null
          downloaded_at?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          org_id?: string
          period?: string
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          counterparty_name: string | null
          counterparty_tin: string | null
          created_at: string
          description: string | null
          due_date: string | null
          efs_rejection_reason: string | null
          efs_status: Database["public"]["Enums"]["efs_status"] | null
          einvoice_id: string | null
          id: string
          issue_date: string
          locked: boolean | null
          net: number
          supply_type: Database["public"]["Enums"]["supply_type"]
          type: Database["public"]["Enums"]["invoice_type"]
          vat: number | null
          vat_rate: number | null
        }
        Insert: {
          business_id: string
          counterparty_name?: string | null
          counterparty_tin?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          efs_rejection_reason?: string | null
          efs_status?: Database["public"]["Enums"]["efs_status"] | null
          einvoice_id?: string | null
          id?: string
          issue_date: string
          locked?: boolean | null
          net: number
          supply_type: Database["public"]["Enums"]["supply_type"]
          type: Database["public"]["Enums"]["invoice_type"]
          vat?: number | null
          vat_rate?: number | null
        }
        Update: {
          business_id?: string
          counterparty_name?: string | null
          counterparty_tin?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          efs_rejection_reason?: string | null
          efs_status?: Database["public"]["Enums"]["efs_status"] | null
          einvoice_id?: string | null
          id?: string
          issue_date?: string
          locked?: boolean | null
          net?: number
          supply_type?: Database["public"]["Enums"]["supply_type"]
          type?: Database["public"]["Enums"]["invoice_type"]
          vat?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_chunks: {
        Row: {
          chunk_index: number
          created_at: string
          doc_id: string
          embedding: string | null
          id: string
          text: string
        }
        Insert: {
          chunk_index: number
          created_at?: string
          doc_id: string
          embedding?: string | null
          id?: string
          text: string
        }
        Update: {
          chunk_index?: number
          created_at?: string
          doc_id?: string
          embedding?: string | null
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "kb_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_docs: {
        Row: {
          created_at: string
          file_url: string
          id: string
          org_id: string | null
          source_url: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          org_id?: string | null
          source_url?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          org_id?: string | null
          source_url?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_docs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_ingest_jobs: {
        Row: {
          created_at: string
          doc_id: string | null
          error_message: string | null
          file_url: string
          finished_at: string | null
          id: string
          progress: number | null
          status: string
        }
        Insert: {
          created_at?: string
          doc_id?: string | null
          error_message?: string | null
          file_url: string
          finished_at?: string | null
          id?: string
          progress?: number | null
          status: string
        }
        Update: {
          created_at?: string
          doc_id?: string | null
          error_message?: string | null
          file_url?: string
          finished_at?: string | null
          id?: string
          progress?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_ingest_jobs_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "kb_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_task_runs: {
        Row: {
          details: Json | null
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          task_name: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          task_name: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          task_name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          engagement_id: string
          file_url: string | null
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          engagement_id: string
          file_url?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          engagement_id?: string
          file_url?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_steps: Json
          created_at: string
          current_step: number
          id: string
          skipped: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          skipped?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          skipped?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      org_users: {
        Row: {
          created_at: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          owner_id: string
          type: Database["public"]["Enums"]["org_type"]
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          owner_id: string
          type: Database["public"]["Enums"]["org_type"]
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          type?: Database["public"]["Enums"]["org_type"]
        }
        Relationships: []
      }
      pit_profiles: {
        Row: {
          annual_income: number | null
          bands_snapshot: Json | null
          created_at: string
          id: string
          rent_paid: number | null
          rent_relief: number | null
          user_id: string
        }
        Insert: {
          annual_income?: number | null
          bands_snapshot?: Json | null
          created_at?: string
          id?: string
          rent_paid?: number | null
          rent_relief?: number | null
          user_id: string
        }
        Update: {
          annual_income?: number | null
          bands_snapshot?: Json | null
          created_at?: string
          id?: string
          rent_paid?: number | null
          rent_relief?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pit_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pit_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          created_at: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          id?: string
          user_id: string
          version?: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      pro_invoices: {
        Row: {
          amount: number
          created_at: string
          engagement_id: string
          id: string
          payment_ref: string | null
          platform_fee_amount: number | null
          platform_fee_percent: number | null
          pro_payout_amount: number | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          amount: number
          created_at?: string
          engagement_id: string
          id?: string
          payment_ref?: string | null
          platform_fee_amount?: number | null
          platform_fee_percent?: number | null
          pro_payout_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          amount?: number
          created_at?: string
          engagement_id?: string
          id?: string
          payment_ref?: string | null
          platform_fee_amount?: number | null
          platform_fee_percent?: number | null
          pro_payout_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_invoices_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_reviews: {
        Row: {
          comment: string | null
          created_at: string
          engagement_id: string | null
          id: string
          pro_id: string
          rating: number
          reviewer_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          engagement_id?: string | null
          id?: string
          pro_id: string
          rating: number
          reviewer_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          engagement_id?: string | null
          id?: string
          pro_id?: string
          rating?: number
          reviewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_reviews_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: true
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_reviews_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services_requests: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          budget_range: string | null
          company_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          org_id: string | null
          preferred_date: string | null
          service_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          company_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          org_id?: string | null
          preferred_date?: string | null
          service_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          org_id?: string | null
          preferred_date?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_security_documentation: {
        Row: {
          description: string
          implementation: string
          last_reviewed_at: string | null
          security_control: string
        }
        Insert: {
          description: string
          implementation: string
          last_reviewed_at?: string | null
          security_control: string
        }
        Update: {
          description?: string
          implementation?: string
          last_reviewed_at?: string | null
          security_control?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          twofa_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          phone?: string | null
          twofa_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          twofa_enabled?: boolean | null
        }
        Relationships: []
      }
      pros: {
        Row: {
          avg_rating: number | null
          badges: string[] | null
          bio: string | null
          created_at: string
          hourly_rate: number | null
          id: string
          kyc_status: string | null
          org_id: string
          practice_name: string | null
          review_count: number | null
          services: string[] | null
          user_id: string
        }
        Insert: {
          avg_rating?: number | null
          badges?: string[] | null
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          kyc_status?: string | null
          org_id: string
          practice_name?: string | null
          review_count?: number | null
          services?: string[] | null
          user_id: string
        }
        Update: {
          avg_rating?: number | null
          badges?: string[] | null
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          kyc_status?: string | null
          org_id?: string
          practice_name?: string | null
          review_count?: number | null
          services?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pros_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_citations: {
        Row: {
          answer: string
          citations: Json | null
          created_at: string
          id: string
          question: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          answer: string
          citations?: Json | null
          created_at?: string
          id?: string
          question: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string
          citations?: Json | null
          created_at?: string
          id?: string
          question?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_reports: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          org_id: string
          query_json: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          query_json: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          query_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          details: Json | null
          id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          details?: Json | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          details?: Json | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      security_definer_functions: {
        Row: {
          function_name: string
          last_reviewed_at: string | null
          purpose: string
          required_role: Database["public"]["Enums"]["app_role"] | null
          security_notes: string | null
        }
        Insert: {
          function_name: string
          last_reviewed_at?: string | null
          purpose: string
          required_role?: Database["public"]["Enums"]["app_role"] | null
          security_notes?: string | null
        }
        Update: {
          function_name?: string
          last_reviewed_at?: string | null
          purpose?: string
          required_role?: Database["public"]["Enums"]["app_role"] | null
          security_notes?: string | null
        }
        Relationships: []
      }
      security_monitoring_config: {
        Row: {
          alert_threshold: number | null
          check_type: string
          created_at: string
          enabled: boolean
          id: string
          last_run_at: string | null
          next_run_at: string | null
          schedule_cron: string | null
          updated_at: string
        }
        Insert: {
          alert_threshold?: number | null
          check_type: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule_cron?: string | null
          updated_at?: string
        }
        Update: {
          alert_threshold?: number | null
          check_type?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          schedule_cron?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_view_documentation: {
        Row: {
          access_control: string
          last_reviewed_at: string | null
          purpose: string
          security_notes: string | null
          view_name: string
        }
        Insert: {
          access_control: string
          last_reviewed_at?: string | null
          purpose: string
          security_notes?: string | null
          view_name: string
        }
        Update: {
          access_control?: string
          last_reviewed_at?: string | null
          purpose?: string
          security_notes?: string | null
          view_name?: string
        }
        Relationships: []
      }
      stamp_instruments: {
        Row: {
          attachment: string | null
          business_id: string
          created_at: string
          deadline: string | null
          duty_due: number | null
          exec_date: string
          id: string
          liable_party: string | null
          stamped: boolean | null
          type: string
        }
        Insert: {
          attachment?: string | null
          business_id: string
          created_at?: string
          deadline?: string | null
          duty_due?: number | null
          exec_date: string
          id?: string
          liable_party?: string | null
          stamped?: boolean | null
          type: string
        }
        Update: {
          attachment?: string | null
          business_id?: string
          created_at?: string
          deadline?: string | null
          duty_due?: number | null
          exec_date?: string
          id?: string
          liable_party?: string | null
          stamped?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamp_instruments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string
          status: string
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan: string
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          auto_created: boolean | null
          created_at: string
          due_date: string | null
          id: string
          link_to: string | null
          org_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Insert: {
          auto_created?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          link_to?: string | null
          org_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Update: {
          auto_created?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          link_to?: string | null
          org_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_profiles: {
        Row: {
          business_id: string
          created_at: string
          etr_scope_note: string | null
          id: string
          notes: string | null
          vat_scheme: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          etr_scope_note?: string | null
          id?: string
          notes?: string | null
          vat_scheme?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          etr_scope_note?: string | null
          id?: string
          notes?: string | null
          vat_scheme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vat_returns: {
        Row: {
          business_id: string
          created_at: string
          due_date: string | null
          efs_batch_status: string | null
          id: string
          input_vat: number | null
          output_vat: number | null
          payable: number | null
          period: string
        }
        Insert: {
          business_id: string
          created_at?: string
          due_date?: string | null
          efs_batch_status?: string | null
          id?: string
          input_vat?: number | null
          output_vat?: number | null
          payable?: number | null
          period: string
        }
        Update: {
          business_id?: string
          created_at?: string
          due_date?: string | null
          efs_batch_status?: string | null
          id?: string
          input_vat?: number | null
          output_vat?: number | null
          payable?: number | null
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "vat_returns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      safe_profiles: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      scheduled_jobs_status: {
        Row: {
          active: boolean | null
          command: string | null
          database: string | null
          jobid: number | null
          jobname: string | null
          nodename: string | null
          nodeport: number | null
          schedule: string | null
          username: string | null
        }
        Insert: {
          active?: boolean | null
          command?: string | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          nodeport?: number | null
          schedule?: string | null
          username?: string | null
        }
        Update: {
          active?: boolean | null
          command?: string | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          nodeport?: number | null
          schedule?: string | null
          username?: string | null
        }
        Relationships: []
      }
      security_dashboard_enhanced: {
        Row: {
          active_users_24h: number | null
          critical_alerts: number | null
          critical_events_24h: number | null
          dashboard_updated_at: string | null
          events_24h: number | null
          last_security_check: string | null
          unresolved_alerts: number | null
        }
        Relationships: []
      }
      security_dashboard_summary: {
        Row: {
          active_users_24h: number | null
          backups_enabled: number | null
          critical_events_24h: number | null
          events_24h: number | null
          last_updated: string | null
          rate_limits_24h: number | null
          total_admins: number | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"] | null
          entity: string | null
          event_type: string | null
          id: string | null
          ip_address: unknown | null
          severity: string | null
          time: string | null
          user_email: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_role: {
        Args: {
          role_name: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      audit_profile_access_pattern: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_access: string
          profile_queries_count: number
          risk_level: string
          unique_profiles_accessed: number
          user_id: string
        }[]
      }
      audit_profile_enumeration: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      audit_sensitive_access: {
        Args: {
          _operation: string
          _record_id: string
          _severity?: string
          _table_name: string
        }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_enumeration_attacks: {
        Args: Record<PropertyKey, never>
        Returns: {
          first_query: string
          last_query: string
          query_count: number
          severity: string
          user_id: string
        }[]
      }
      check_rate_limit: {
        Args: {
          _action: string
          _max_requests: number
          _time_window_seconds: number
          _user_id: string
        }
        Returns: boolean
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_old_security_alerts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_monthly_vat_tasks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_backup_credential: {
        Args: { decryption_key: string; encrypted_credential: string }
        Returns: string
      }
      detect_backup_credential_theft_attempts: {
        Args: Record<PropertyKey, never>
        Returns: {
          attempt_count: number
          first_attempt: string
          last_attempt: string
          severity: string
          user_id: string
        }[]
      }
      detect_suspicious_access_patterns: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          first_request: string
          last_request: string
          request_count: number
          severity: string
          user_id: string
        }[]
      }
      encrypt_backup_credential: {
        Args: { credential: string }
        Returns: string
      }
      generate_security_report: {
        Args: { _end_date: string; _start_date: string }
        Returns: Json
      }
      get_backup_credentials: {
        Args: { _org_id: string }
        Returns: {
          access_key: string
          bucket: string
          prefix: string
          provider: string
          region: string
          secret_key: string
        }[]
      }
      get_backup_settings_metadata: {
        Args: { _org_id: string }
        Returns: {
          bucket: string
          created_at: string
          enabled: boolean
          org_id: string
          prefix: string
          provider: string
          region: string
          updated_at: string
        }[]
      }
      get_backup_settings_safe: {
        Args: { _org_id: string }
        Returns: {
          bucket: string
          created_at: string
          enabled: boolean
          org_id: string
          prefix: string
          provider: string
          region: string
          updated_at: string
        }[]
      }
      get_business_tin: {
        Args: { _business_id: string }
        Returns: {
          business_id: string
          tin: string
        }[]
      }
      get_maintenance_task_history: {
        Args: { _days?: number }
        Returns: {
          details: Json
          duration_seconds: number
          error_message: string
          finished_at: string
          id: string
          started_at: string
          status: string
          task_name: string
        }[]
      }
      get_pro_reviews: {
        Args: { _limit?: number; _pro_id: string }
        Returns: {
          comment: string
          created_at: string
          engagement_id: string
          id: string
          pro_id: string
          rating: number
          reviewer_user_id: string
        }[]
      }
      get_pro_safely: {
        Args: { _pro_id: string }
        Returns: {
          avg_rating: number
          badges: string[]
          bio: string
          created_at: string
          hourly_rate: number
          id: string
          kyc_status: string
          org_id: string
          practice_name: string
          review_count: number
          services: string[]
          user_id: string
        }[]
      }
      get_professional_services_requests: {
        Args: { _limit?: number }
        Returns: {
          admin_notes: string
          assigned_to: string
          budget_range: string
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          description: string
          id: string
          org_id: string
          preferred_date: string
          service_type: string
          status: string
          updated_at: string
          user_id: string
        }[]
      }
      get_profile_display_name: {
        Args: { _user_id: string }
        Returns: string
      }
      get_profile_safely: {
        Args: { _profile_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_pros_list: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          avg_rating: number
          badges: string[]
          bio: string
          created_at: string
          hourly_rate: number
          id: string
          kyc_status: string
          org_id: string
          practice_name: string
          review_count: number
          services: string[]
          user_id: string
        }[]
      }
      get_safe_profile_name: {
        Args: { _user_id: string }
        Returns: string
      }
      get_scheduled_jobs_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          command: string
          database: string
          jobid: number
          jobname: string
          nodename: string
          nodeport: number
          schedule: string
          username: string
        }[]
      }
      get_security_dashboard_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users_24h: number
          critical_alerts: number
          critical_events_24h: number
          dashboard_updated_at: string
          events_24h: number
          last_security_check: string
          unresolved_alerts: number
        }[]
      }
      get_security_dashboard_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users_24h: number
          backups_enabled: number
          critical_events_24h: number
          events_24h: number
          last_updated: string
          rate_limits_24h: number
          total_admins: number
        }[]
      }
      get_security_events: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: Database["public"]["Enums"]["audit_action"]
          entity: string
          event_type: string
          id: string
          ip_address: unknown
          severity: string
          time: string
          user_email: string
          user_name: string
        }[]
      }
      get_security_metrics: {
        Args: { _days?: number }
        Returns: {
          metric_name: string
          metric_value: number
          status: string
          trend: string
        }[]
      }
      get_security_summary: {
        Args: { _days_back?: number }
        Returns: {
          data_exports: number
          failed_rate_limits: number
          high_severity_events: number
          tin_accesses: number
          total_events: number
          unique_users: number
        }[]
      }
      get_unresolved_security_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          age_hours: number
          alert_type: string
          created_at: string
          description: string
          details: Json
          id: string
          severity: string
          title: string
        }[]
      }
      get_users_for_admin_dashboard: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
        }[]
      }
      get_view_security_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_control_method: string
          direct_access_allowed: boolean
          is_secure: boolean
          security_mode: string
          view_name: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_and_check_rate_limit: {
        Args: {
          _action: string
          _max_requests?: number
          _time_window_seconds?: number
        }
        Returns: boolean
      }
      match_kb_chunks: {
        Args: {
          filter_org_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          doc_id: string
          doc_title: string
          id: string
          score: number
          text: string
        }[]
      }
      resolve_security_alert: {
        Args: { _alert_id: string; _resolution_notes?: string }
        Returns: undefined
      }
      revoke_user_role: {
        Args: {
          role_name: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      run_automated_security_checks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          recommendation: string
          severity: string
          status: string
        }[]
      }
      send_task_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_backup_credentials: {
        Args: {
          _access_key: string
          _bucket?: string
          _org_id: string
          _prefix?: string
          _provider?: string
          _region?: string
          _secret_key: string
        }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_backup_metadata: {
        Args: {
          _bucket: string
          _enabled: boolean
          _org_id: string
          _prefix: string
          _provider: string
          _region: string
        }
        Returns: undefined
      }
      user_can_view_tin: {
        Args: { _business_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_backup_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_profile_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
      verify_safe_profiles_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
      verify_view_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_method: string
          has_rls_protection: boolean
          has_security_barrier: boolean
          security_status: string
          view_name: string
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "staff" | "viewer" | "admin"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "export"
        | "submit"
        | "read"
        | "access"
      delete_request_status: "pending" | "approved" | "denied" | "processed"
      delete_scope: "user" | "org" | "engagement"
      direction: "debit" | "credit"
      efs_status: "draft" | "queued" | "accepted" | "rejected"
      engagement_fee_type: "fixed" | "hourly" | "milestone"
      escrow_status: "unfunded" | "funded" | "released" | "refunded"
      invoice_type: "sale" | "purchase"
      org_type: "business" | "practice"
      payment_status: "pending" | "paid" | "released" | "refunded"
      supply_type: "standard" | "zero" | "exempt"
      task_status: "open" | "done" | "snoozed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "staff", "viewer", "admin"],
      audit_action: [
        "create",
        "update",
        "delete",
        "export",
        "submit",
        "read",
        "access",
      ],
      delete_request_status: ["pending", "approved", "denied", "processed"],
      delete_scope: ["user", "org", "engagement"],
      direction: ["debit", "credit"],
      efs_status: ["draft", "queued", "accepted", "rejected"],
      engagement_fee_type: ["fixed", "hourly", "milestone"],
      escrow_status: ["unfunded", "funded", "released", "refunded"],
      invoice_type: ["sale", "purchase"],
      org_type: ["business", "practice"],
      payment_status: ["pending", "paid", "released", "refunded"],
      supply_type: ["standard", "zero", "exempt"],
      task_status: ["open", "done", "snoozed"],
    },
  },
} as const
