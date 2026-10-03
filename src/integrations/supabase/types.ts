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
          carga_m3: number | null
          categoria: Database["public"]["Enums"]["anuncio_categoria"]
          caucao: number
          com_motorista: boolean
          combustivel: string | null
          created_at: string
          descricao: string | null
          destaque: boolean
          disponivel: boolean
          entrega: boolean
          estado: Database["public"]["Enums"]["anuncio_estado"]
          id: string
          imagem: string | null
          lugares: number | null
          marca: string | null
          modelo: string | null
          municipio: string
          owner_id: string
          preco_dia: number
          preco_hora: number | null
          preco_mes: number | null
          preco_semana: number | null
          subcategoria: string
          titulo: string
          transmissao: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          carga_m3?: number | null
          categoria: Database["public"]["Enums"]["anuncio_categoria"]
          caucao?: number
          com_motorista?: boolean
          combustivel?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          disponivel?: boolean
          entrega?: boolean
          estado?: Database["public"]["Enums"]["anuncio_estado"]
          id?: string
          imagem?: string | null
          lugares?: number | null
          marca?: string | null
          modelo?: string | null
          municipio: string
          owner_id: string
          preco_dia: number
          preco_hora?: number | null
          preco_mes?: number | null
          preco_semana?: number | null
          subcategoria: string
          titulo: string
          transmissao?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          carga_m3?: number | null
          categoria?: Database["public"]["Enums"]["anuncio_categoria"]
          caucao?: number
          com_motorista?: boolean
          combustivel?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          disponivel?: boolean
          entrega?: boolean
          estado?: Database["public"]["Enums"]["anuncio_estado"]
          id?: string
          imagem?: string | null
          lugares?: number | null
          marca?: string | null
          modelo?: string | null
          municipio?: string
          owner_id?: string
          preco_dia?: number
          preco_hora?: number | null
          preco_mes?: number | null
          preco_semana?: number | null
          subcategoria?: string
          titulo?: string
          transmissao?: string | null
          updated_at?: string
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
          estado: Database["public"]["Enums"]["reserva_estado"]
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
          estado?: Database["public"]["Enums"]["reserva_estado"]
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
          estado?: Database["public"]["Enums"]["reserva_estado"]
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
