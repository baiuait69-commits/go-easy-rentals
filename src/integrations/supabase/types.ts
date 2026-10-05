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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alertas_fraude: {
        Row: {
          created_at: string
          descricao: string
          gravidade: string
          id: string
          referencia: string | null
          resolvido: boolean
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          gravidade?: string
          id?: string
          referencia?: string | null
          resolvido?: boolean
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          gravidade?: string
          id?: string
          referencia?: string | null
          resolvido?: boolean
          tipo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      anuncio_fotos: {
        Row: {
          anuncio_id: string
          created_at: string
          id: string
          ordem: number
          url: string
        }
        Insert: {
          anuncio_id: string
          created_at?: string
          id?: string
          ordem?: number
          url: string
        }
        Update: {
          anuncio_id?: string
          created_at?: string
          id?: string
          ordem?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "anuncio_fotos_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
        ]
      }
      anuncios: {
        Row: {
          ano: number | null
          bem_verificado: boolean
          carga_m3: number | null
          categoria: Database["public"]["Enums"]["anuncio_categoria"]
          caucao: number
          codigo_verificacao: string | null
          com_motorista: boolean
          combustivel: string | null
          condicoes: string | null
          created_at: string
          descricao: string | null
          destaque: boolean
          disponivel: boolean
          doc_inspecao: string | null
          doc_seguro: string | null
          doc_titularidade: string | null
          e_proprietario: boolean
          entrega: boolean
          estado: Database["public"]["Enums"]["anuncio_estado"]
          fotos_verificacao: Json
          horas_uso: number | null
          id: string
          imagem: string | null
          lugares: number | null
          marca: string | null
          matricula: string | null
          modelo: string | null
          municipio: string
          numero_serie: string | null
          operador_incluido: boolean
          owner_id: string
          preco_dia: number
          preco_hora: number | null
          preco_mes: number | null
          preco_semana: number | null
          qualidade_titular: string | null
          quilometragem: number | null
          subcategoria: string
          titulo: string
          transmissao: string | null
          updated_at: string
          vin: string | null
        }
        Insert: {
          ano?: number | null
          bem_verificado?: boolean
          carga_m3?: number | null
          categoria: Database["public"]["Enums"]["anuncio_categoria"]
          caucao?: number
          codigo_verificacao?: string | null
          com_motorista?: boolean
          combustivel?: string | null
          condicoes?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          disponivel?: boolean
          doc_inspecao?: string | null
          doc_seguro?: string | null
          doc_titularidade?: string | null
          e_proprietario?: boolean
          entrega?: boolean
          estado?: Database["public"]["Enums"]["anuncio_estado"]
          fotos_verificacao?: Json
          horas_uso?: number | null
          id?: string
          imagem?: string | null
          lugares?: number | null
          marca?: string | null
          matricula?: string | null
          modelo?: string | null
          municipio: string
          numero_serie?: string | null
          operador_incluido?: boolean
          owner_id: string
          preco_dia: number
          preco_hora?: number | null
          preco_mes?: number | null
          preco_semana?: number | null
          qualidade_titular?: string | null
          quilometragem?: number | null
          subcategoria: string
          titulo: string
          transmissao?: string | null
          updated_at?: string
          vin?: string | null
        }
        Update: {
          ano?: number | null
          bem_verificado?: boolean
          carga_m3?: number | null
          categoria?: Database["public"]["Enums"]["anuncio_categoria"]
          caucao?: number
          codigo_verificacao?: string | null
          com_motorista?: boolean
          combustivel?: string | null
          condicoes?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          disponivel?: boolean
          doc_inspecao?: string | null
          doc_seguro?: string | null
          doc_titularidade?: string | null
          e_proprietario?: boolean
          entrega?: boolean
          estado?: Database["public"]["Enums"]["anuncio_estado"]
          fotos_verificacao?: Json
          horas_uso?: number | null
          id?: string
          imagem?: string | null
          lugares?: number | null
          marca?: string | null
          matricula?: string | null
          modelo?: string | null
          municipio?: string
          numero_serie?: string | null
          operador_incluido?: boolean
          owner_id?: string
          preco_dia?: number
          preco_hora?: number | null
          preco_mes?: number | null
          preco_semana?: number | null
          qualidade_titular?: string | null
          quilometragem?: number | null
          subcategoria?: string
          titulo?: string
          transmissao?: string | null
          updated_at?: string
          vin?: string | null
        }
        Relationships: []
      }
      auth_tentativas: {
        Row: {
          created_at: string
          email: string
          erro: string | null
          id: string
          origem: string
          sucesso: boolean
        }
        Insert: {
          created_at?: string
          email: string
          erro?: string | null
          id?: string
          origem?: string
          sucesso: boolean
        }
        Update: {
          created_at?: string
          email?: string
          erro?: string | null
          id?: string
          origem?: string
          sucesso?: boolean
        }
        Relationships: []
      }
      diagnosticos_acesso: {
        Row: {
          autor_id: string
          created_at: string
          descricao: string
          email_alvo: string
          id: string
          resultado: Json
        }
        Insert: {
          autor_id?: string
          created_at?: string
          descricao: string
          email_alvo: string
          id?: string
          resultado: Json
        }
        Update: {
          autor_id?: string
          created_at?: string
          descricao?: string
          email_alvo?: string
          id?: string
          resultado?: Json
        }
        Relationships: []
      }
      historico_alteracoes: {
        Row: {
          antigo: string | null
          autor_id: string | null
          campo: string
          created_at: string
          id: string
          novo: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          antigo?: string | null
          autor_id?: string | null
          campo: string
          created_at?: string
          id?: string
          novo?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          antigo?: string | null
          autor_id?: string | null
          campo?: string
          created_at?: string
          id?: string
          novo?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kyc_fornecedor: {
        Row: {
          alvara: string | null
          banco: string | null
          certidao: string | null
          contacto_empresa: string | null
          created_at: string
          denominacao: string | null
          endereco: string | null
          estado: Database["public"]["Enums"]["kyc_estado"]
          iban: string | null
          motivo: string | null
          nif: string | null
          representante: string | null
          representante_bi: string | null
          tipo: string
          titular_conta: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alvara?: string | null
          banco?: string | null
          certidao?: string | null
          contacto_empresa?: string | null
          created_at?: string
          denominacao?: string | null
          endereco?: string | null
          estado?: Database["public"]["Enums"]["kyc_estado"]
          iban?: string | null
          motivo?: string | null
          nif?: string | null
          representante?: string | null
          representante_bi?: string | null
          tipo?: string
          titular_conta?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          alvara?: string | null
          banco?: string | null
          certidao?: string | null
          contacto_empresa?: string | null
          created_at?: string
          denominacao?: string | null
          endereco?: string | null
          estado?: Database["public"]["Enums"]["kyc_estado"]
          iban?: string | null
          motivo?: string | null
          nif?: string | null
          representante?: string | null
          representante_bi?: string | null
          tipo?: string
          titular_conta?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          created_at: string
          id: string
          municipio: string | null
          nome: string | null
          telefone: string | null
          tipo_conta: Database["public"]["Enums"]["tipo_conta"]
          updated_at: string
          verificado: boolean
        }
        Insert: {
          created_at?: string
          id: string
          municipio?: string | null
          nome?: string | null
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta"]
          updated_at?: string
          verificado?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          municipio?: string | null
          nome?: string | null
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta"]
          updated_at?: string
          verificado?: boolean
        }
        Relationships: []
      }
      reservas: {
        Row: {
          anuncio_id: string | null
          avaliacao: number | null
          caucao: number
          cliente_id: string
          comentario: string | null
          comissao: number | null
          created_at: string
          em_analise: boolean
          estado: Database["public"]["Enums"]["reserva_estado"]
          estado_pagamento: Database["public"]["Enums"]["pagamento_estado"]
          extras: Json
          fim: string
          fornecedor_id: string | null
          id: string
          imagem: string | null
          inicio: string
          item_ref: string
          local: string | null
          metodo_pagamento: string
          numero: string
          referencia_pagamento: string | null
          risco: string
          titulo: string
          total: number
          updated_at: string
        }
        Insert: {
          anuncio_id?: string | null
          avaliacao?: number | null
          caucao?: number
          cliente_id?: string
          comentario?: string | null
          comissao?: number | null
          created_at?: string
          em_analise?: boolean
          estado?: Database["public"]["Enums"]["reserva_estado"]
          estado_pagamento?: Database["public"]["Enums"]["pagamento_estado"]
          extras?: Json
          fim: string
          fornecedor_id?: string | null
          id?: string
          imagem?: string | null
          inicio: string
          item_ref: string
          local?: string | null
          metodo_pagamento: string
          numero?: string
          referencia_pagamento?: string | null
          risco?: string
          titulo: string
          total: number
          updated_at?: string
        }
        Update: {
          anuncio_id?: string | null
          avaliacao?: number | null
          caucao?: number
          cliente_id?: string
          comentario?: string | null
          comissao?: number | null
          created_at?: string
          em_analise?: boolean
          estado?: Database["public"]["Enums"]["reserva_estado"]
          estado_pagamento?: Database["public"]["Enums"]["pagamento_estado"]
          extras?: Json
          fim?: string
          fornecedor_id?: string | null
          id?: string
          imagem?: string | null
          inicio?: string
          item_ref?: string
          local?: string | null
          metodo_pagamento?: string
          numero?: string
          referencia_pagamento?: string | null
          risco?: string
          titulo?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_anuncio_id_fkey"
            columns: ["anuncio_id"]
            isOneToOne: false
            referencedRelation: "anuncios"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          target_email: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          target_email?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          target_email?: string | null
          target_user_id?: string
        }
        Relationships: []
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
      verificacoes: {
        Row: {
          contacto_emergencia: string | null
          created_at: string
          data_nascimento: string | null
          doc_frente: string | null
          doc_numero: string | null
          doc_tipo: string
          doc_verso: string | null
          estado: Database["public"]["Enums"]["kyc_estado"]
          morada: string | null
          motivo: string | null
          nome_completo: string | null
          pagamento_validado: boolean
          selfie: string | null
          telefone: string | null
          telefone_verificado: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contacto_emergencia?: string | null
          created_at?: string
          data_nascimento?: string | null
          doc_frente?: string | null
          doc_numero?: string | null
          doc_tipo?: string
          doc_verso?: string | null
          estado?: Database["public"]["Enums"]["kyc_estado"]
          morada?: string | null
          motivo?: string | null
          nome_completo?: string | null
          pagamento_validado?: boolean
          selfie?: string | null
          telefone?: string | null
          telefone_verificado?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          contacto_emergencia?: string | null
          created_at?: string
          data_nascimento?: string | null
          doc_frente?: string | null
          doc_numero?: string | null
          doc_tipo?: string
          doc_verso?: string | null
          estado?: Database["public"]["Enums"]["kyc_estado"]
          morada?: string | null
          motivo?: string | null
          nome_completo?: string | null
          pagamento_validado?: boolean
          selfie?: string | null
          telefone?: string | null
          telefone_verificado?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reputacao_fornecedor: { Args: { _uid: string }; Returns: Json }
    }
    Enums: {
      anuncio_categoria:
        | "veiculos"
        | "transporte"
        | "pesados"
        | "maquinas"
        | "servicos"
      anuncio_estado:
        | "rascunho"
        | "pendente"
        | "aprovado"
        | "rejeitado"
        | "bloqueado"
      app_role: "admin" | "empresa" | "suporte"
      kyc_estado: "nao_iniciado" | "pendente" | "aprovado" | "rejeitado"
      pagamento_estado:
        | "pendente"
        | "pago_retido"
        | "entregue"
        | "recebido"
        | "liberado"
        | "reembolsado"
      reserva_estado:
        | "pendente"
        | "confirmada"
        | "em_utilizacao"
        | "concluida"
        | "cancelada"
        | "rejeitada"
      tipo_conta: "cliente" | "proprietario" | "empresa"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      anuncio_categoria: [
        "veiculos",
        "transporte",
        "pesados",
        "maquinas",
        "servicos",
      ],
      anuncio_estado: [
        "rascunho",
        "pendente",
        "aprovado",
        "rejeitado",
        "bloqueado",
      ],
      app_role: ["admin", "empresa", "suporte"],
      kyc_estado: ["nao_iniciado", "pendente", "aprovado", "rejeitado"],
      pagamento_estado: [
        "pendente",
        "pago_retido",
        "entregue",
        "recebido",
        "liberado",
        "reembolsado",
      ],
      reserva_estado: [
        "pendente",
        "confirmada",
        "em_utilizacao",
        "concluida",
        "cancelada",
        "rejeitada",
      ],
      tipo_conta: ["cliente", "proprietario", "empresa"],
    },
  },
} as const
