export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country: string | null;
          city: string | null;
          denomination: string | null;
          size: string | null;
          service_days: string[];
          pastor_name: string | null;
          pastor_email: string | null;
          pastor_role: string | null;
          pastor_phone: string | null;
          logo_url: string | null;
          tiene_grupos: boolean | null;
          cantidad_grupos_aprox: number | null;
          objetivo_principal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: "admin" | "member";
          /** null = legado (mirar JWT); true/false explícito para primer acceso */
          must_change_password: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at" | "must_change_password"
        > & {
          created_at?: string;
          updated_at?: string;
          must_change_password?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      personas: {
        Row: {
          id: string;
          organization_id: string;
          cedula: string | null;
          nombre: string;
          telefono: string | null;
          email: string | null;
          fecha_nacimiento: string | null;
          edad: number | null;
          estado_civil: string | null;
          ocupacion: string | null;
          direccion: string | null;
          grupo_id: string | null;
          participacion_en_grupo: string | null;
          rol: string;
          estado: string;
          fecha_registro: string | null;
          ultimo_contacto: string | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["personas"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["personas"]["Insert"]>;
      };
      grupos: {
        Row: {
          id: string;
          organization_id: string;
          nombre: string;
          descripcion: string | null;
          tipo: string;
          miembros_count: number;
          lider_id: string | null;
          dia: string | null;
          hora: string | null;
          ubicacion: string | null;
          imagen: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["grupos"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          miembros_count?: number;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["grupos"]["Insert"]>;
      };
      lideres: {
        Row: {
          id: string;
          organization_id: string;
          persona_id: string | null;
          auth_user_id: string | null;
          nombre: string;
          cedula: string | null;
          telefono: string | null;
          email: string | null;
          rol: string | null;
          estado: string;
          grupo_asignado: string | null;
          miembros_a_cargo: number;
          fecha_inicio_liderazgo: string | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lideres"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          auth_user_id?: string | null;
          miembros_a_cargo?: number;
          estado?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lideres"]["Insert"]>;
      };
      eventos: {
        Row: {
          id: string;
          organization_id: string;
          titulo: string;
          descripcion: string | null;
          tipo: string;
          fecha: string | null;
          hora: string | null;
          ubicacion: string | null;
          imagen: string | null;
          asistentes_esperados: number | null;
          responsable: string | null;
          recurrente: boolean;
          grupo_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["eventos"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          recurrente?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["eventos"]["Insert"]>;
      };
      persona_historial: {
        Row: {
          id: string;
          organization_id: string;
          persona_id: string;
          fecha: string;
          accion: string;
          responsable: string | null;
          tipo_seguimiento: string | null;
          resultado_seguimiento: string | null;
          notas: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["persona_historial"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["persona_historial"]["Insert"]>;
      };
      persona_notas: {
        Row: {
          id: string;
          organization_id: string;
          persona_id: string;
          contenido: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["persona_notas"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["persona_notas"]["Insert"]>;
      };
      persona_asistencia: {
        Row: {
          id: string;
          organization_id: string;
          persona_id: string;
          grupo_id: string;
          fecha: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["persona_asistencia"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["persona_asistencia"]["Insert"]>;
      };
    };
  };
}
