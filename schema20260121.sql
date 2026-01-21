
\restrict b0TdWcodBRFsMJETLyfbdMspMQN40qfaWYq4id7Fc4q8cf40UgWrxrTprWWb1g3


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_bowel_movements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_bowel_movements_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_water_intake_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_water_intake_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."body_measurements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "measurement_date" "date" NOT NULL,
    "measurement_time" time without time zone DEFAULT CURRENT_TIME,
    "waist" numeric(5,2),
    "neck" numeric(5,2),
    "chest" numeric(5,2),
    "hips" numeric(5,2),
    "left_thigh" numeric(5,2),
    "right_thigh" numeric(5,2),
    "left_bicep" numeric(5,2),
    "right_bicep" numeric(5,2),
    "left_calf" numeric(5,2),
    "right_calf" numeric(5,2),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "body_measurements_chest_check" CHECK ((("chest" > (0)::numeric) AND ("chest" < (300)::numeric))),
    CONSTRAINT "body_measurements_hips_check" CHECK ((("hips" > (0)::numeric) AND ("hips" < (300)::numeric))),
    CONSTRAINT "body_measurements_left_bicep_check" CHECK ((("left_bicep" > (0)::numeric) AND ("left_bicep" < (100)::numeric))),
    CONSTRAINT "body_measurements_left_calf_check" CHECK ((("left_calf" > (0)::numeric) AND ("left_calf" < (100)::numeric))),
    CONSTRAINT "body_measurements_left_thigh_check" CHECK ((("left_thigh" > (0)::numeric) AND ("left_thigh" < (200)::numeric))),
    CONSTRAINT "body_measurements_neck_check" CHECK ((("neck" > (0)::numeric) AND ("neck" < (150)::numeric))),
    CONSTRAINT "body_measurements_right_bicep_check" CHECK ((("right_bicep" > (0)::numeric) AND ("right_bicep" < (100)::numeric))),
    CONSTRAINT "body_measurements_right_calf_check" CHECK ((("right_calf" > (0)::numeric) AND ("right_calf" < (100)::numeric))),
    CONSTRAINT "body_measurements_right_thigh_check" CHECK ((("right_thigh" > (0)::numeric) AND ("right_thigh" < (200)::numeric))),
    CONSTRAINT "body_measurements_waist_check" CHECK ((("waist" > (0)::numeric) AND ("waist" < (300)::numeric)))
);


ALTER TABLE "public"."body_measurements" OWNER TO "postgres";


COMMENT ON TABLE "public"."body_measurements" IS 'Registro de medidas corporais do usuário ao longo do tempo';



COMMENT ON COLUMN "public"."body_measurements"."waist" IS 'Circunferência da cintura em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."neck" IS 'Circunferência do pescoço em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."chest" IS 'Circunferência do peitoral em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."hips" IS 'Circunferência do quadril em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."left_thigh" IS 'Circunferência da coxa esquerda em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."right_thigh" IS 'Circunferência da coxa direita em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."left_bicep" IS 'Circunferência do bíceps esquerdo em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."right_bicep" IS 'Circunferência do bíceps direito em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."left_calf" IS 'Circunferência da panturrilha esquerda em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."right_calf" IS 'Circunferência da panturrilha direita em centímetros';



COMMENT ON COLUMN "public"."body_measurements"."notes" IS 'Observações sobre a medição (opcional)';



CREATE TABLE IF NOT EXISTS "public"."bowel_movements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "occurred_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "bristol_type" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "bowel_movements_bristol_type_check" CHECK ((("bristol_type" >= 1) AND ("bristol_type" <= 7)))
);


ALTER TABLE "public"."bowel_movements" OWNER TO "postgres";


COMMENT ON TABLE "public"."bowel_movements" IS 'Registros de evacuações para monitoramento de inflamação intestinal';



COMMENT ON COLUMN "public"."bowel_movements"."occurred_at" IS 'Data/hora da evacuação';



COMMENT ON COLUMN "public"."bowel_movements"."bristol_type" IS 'Tipo de fezes segundo Escala de Bristol (1-7)';



COMMENT ON COLUMN "public"."bowel_movements"."notes" IS 'Notas opcionais (dor, urgência, sangue, etc)';



CREATE TABLE IF NOT EXISTS "public"."coach_analyses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "analysis_date" timestamp without time zone DEFAULT "now"(),
    "context_data" "jsonb" NOT NULL,
    "analysis_text" "text" NOT NULL,
    "recommendations" "text"[],
    "insights" "text"[],
    "warnings" "text"[],
    "model_used" character varying(50) DEFAULT 'gemini-2.0-flash-exp'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."coach_analyses" OWNER TO "postgres";


COMMENT ON TABLE "public"."coach_analyses" IS 'Histórico de análises do Coach IA';



COMMENT ON COLUMN "public"."coach_analyses"."context_data" IS 'Snapshot dos dados do 
  usuário no momento da análise (JSON)';



COMMENT ON COLUMN "public"."coach_analyses"."analysis_text" IS 'Texto completo da 
  análise gerada pela IA';



COMMENT ON COLUMN "public"."coach_analyses"."recommendations" IS 'Array de 
  recomendações práticas';



COMMENT ON COLUMN "public"."coach_analyses"."insights" IS 'Array de insights 
  identificados';



COMMENT ON COLUMN "public"."coach_analyses"."warnings" IS 'Array de alertas (se 
  houver)';



CREATE TABLE IF NOT EXISTS "public"."food_bank" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "brand" character varying(255),
    "serving_size" character varying(100),
    "photo_url" "text",
    "calories" numeric(10,2),
    "protein" numeric(10,2),
    "carbs" numeric(10,2),
    "fat" numeric(10,2),
    "fiber" numeric(10,2),
    "sodium" numeric(10,2),
    "sugar" numeric(10,2),
    "saturated_fat" numeric(10,2),
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp without time zone,
    "source" character varying(50) DEFAULT 'manual'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "cholesterol" numeric(10,2),
    "calcium" numeric(10,2),
    "magnesium" numeric(10,2),
    "phosphorus" numeric(10,2),
    "iron" numeric(10,2),
    "potassium" numeric(10,2),
    "zinc" numeric(10,2),
    "vitamin_c" numeric(10,2),
    "taco_id" integer,
    "purchasable" boolean DEFAULT false,
    "category" character varying(100),
    "copper" numeric(10,2),
    "manganese" numeric(10,2),
    "vitamin_a" numeric(10,2),
    "vitamin_b1" numeric(10,2),
    "vitamin_b2" numeric(10,2),
    "vitamin_b3" numeric(10,2),
    "vitamin_b6" numeric(10,2)
);


ALTER TABLE "public"."food_bank" OWNER TO "postgres";


COMMENT ON TABLE "public"."food_bank" IS 'Banco de alimentos frequentes com informações nutricionais';



COMMENT ON COLUMN "public"."food_bank"."tenant_id" IS 'ID do tenant (multi-tenancy)';



COMMENT ON COLUMN "public"."food_bank"."user_id" IS 'Usuário que cadastrou o alimento';



COMMENT ON COLUMN "public"."food_bank"."name" IS 'Nome do alimento';



COMMENT ON COLUMN "public"."food_bank"."brand" IS 'Marca do alimento (opcional)';



COMMENT ON COLUMN "public"."food_bank"."serving_size" IS 'Tamanho da porção (ex: 100g, 1 unidade)';



COMMENT ON COLUMN "public"."food_bank"."photo_url" IS 'URL da foto da tabela nutricional (opcional)';



COMMENT ON COLUMN "public"."food_bank"."usage_count" IS 'Contador de quantas vezes o alimento foi usado';



COMMENT ON COLUMN "public"."food_bank"."last_used_at" IS 'Data da última vez que o alimento foi usado';



COMMENT ON COLUMN "public"."food_bank"."source" IS 'Origem dos dados: manual ou ai_analyzed (tabela nutricional)';



COMMENT ON COLUMN "public"."food_bank"."taco_id" IS 'Referência ao alimento da tabela TACO (se aplicável)';



CREATE TABLE IF NOT EXISTS "public"."food_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "meal_id" "uuid" NOT NULL,
    "name" character varying(200) NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit" character varying(20) NOT NULL,
    "confidence_score" numeric(3,2),
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid",
    CONSTRAINT "food_items_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric)))
);


ALTER TABLE "public"."food_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "image_url" character varying(500),
    "meal_type" character varying(20) NOT NULL,
    "consumed_at" timestamp without time zone NOT NULL,
    "status" character varying(20) DEFAULT 'approved'::character varying NOT NULL,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid",
    "location_type" character varying(10),
    "restaurant_id" "uuid",
    CONSTRAINT "meals_location_type_check" CHECK ((("location_type")::"text" = ANY ((ARRAY['home'::character varying, 'out'::character varying])::"text"[]))),
    CONSTRAINT "meals_meal_type_check" CHECK ((("meal_type")::"text" = ANY ((ARRAY['breakfast'::character varying, 'lunch'::character varying, 'dinner'::character varying, 'snack'::character varying])::"text"[]))),
    CONSTRAINT "meals_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."meals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."meals"."image_url" IS 'Image URL (nullable). Images are not stored - used only for AI analysis';



COMMENT ON COLUMN "public"."meals"."location_type" IS 'Tipo de local: home (em casa) ou out (fora de casa)';



COMMENT ON COLUMN "public"."meals"."restaurant_id" IS 'Referência ao restaurante se location_type = out';



CREATE TABLE IF NOT EXISTS "public"."nutrition_data" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "food_item_id" "uuid" NOT NULL,
    "calories" numeric(10,2) DEFAULT 0 NOT NULL,
    "protein_g" numeric(10,2) DEFAULT 0 NOT NULL,
    "carbs_g" numeric(10,2) DEFAULT 0 NOT NULL,
    "fat_g" numeric(10,2) DEFAULT 0 NOT NULL,
    "fiber_g" numeric(10,2) DEFAULT 0 NOT NULL,
    "sodium_mg" numeric(10,2),
    "sugar_g" numeric(10,2),
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid",
    "cholesterol_mg" numeric(10,2),
    "saturated_fat_g" numeric(10,2),
    "calcium_mg" numeric(10,2),
    "magnesium_mg" numeric(10,2),
    "phosphorus_mg" numeric(10,2),
    "iron_mg" numeric(10,2),
    "potassium_mg" numeric(10,2),
    "zinc_mg" numeric(10,2),
    "copper_mg" numeric(10,2),
    "manganese_mg" numeric(10,2),
    "vitamin_c_mg" numeric(10,2),
    "vitamin_a_mcg" numeric(10,2),
    "vitamin_b1_mg" numeric(10,4),
    "vitamin_b2_mg" numeric(10,4),
    "vitamin_b3_mg" numeric(10,4),
    "vitamin_b6_mg" numeric(10,4)
);


ALTER TABLE "public"."nutrition_data" OWNER TO "postgres";


COMMENT ON COLUMN "public"."nutrition_data"."cholesterol_mg" IS 'Colesterol em mg';



COMMENT ON COLUMN "public"."nutrition_data"."saturated_fat_g" IS 'Gordura saturada em g';



COMMENT ON COLUMN "public"."nutrition_data"."calcium_mg" IS 'Cálcio em mg';



COMMENT ON COLUMN "public"."nutrition_data"."magnesium_mg" IS 'Magnésio em mg';



COMMENT ON COLUMN "public"."nutrition_data"."phosphorus_mg" IS 'Fósforo em mg';



COMMENT ON COLUMN "public"."nutrition_data"."iron_mg" IS 'Ferro em mg';



COMMENT ON COLUMN "public"."nutrition_data"."potassium_mg" IS 'Potássio em mg';



COMMENT ON COLUMN "public"."nutrition_data"."zinc_mg" IS 'Zinco em mg';



COMMENT ON COLUMN "public"."nutrition_data"."copper_mg" IS 'Cobre em mg';



COMMENT ON COLUMN "public"."nutrition_data"."manganese_mg" IS 'Manganês em mg';



COMMENT ON COLUMN "public"."nutrition_data"."vitamin_c_mg" IS 'Vitamina C em mg';



COMMENT ON COLUMN "public"."nutrition_data"."vitamin_a_mcg" IS 'Vitamina A (RAE) em mcg';



COMMENT ON COLUMN "public"."nutrition_data"."vitamin_b1_mg" IS 'Tiamina (B1) em mg';



COMMENT ON COLUMN "public"."nutrition_data"."vitamin_b2_mg" IS 'Riboflavina (B2) em mg';



COMMENT ON COLUMN "public"."nutrition_data"."vitamin_b3_mg" IS 'Niacina (B3) em mg';



COMMENT ON COLUMN "public"."nutrition_data"."vitamin_b6_mg" IS 'Piridoxina (B6) em mg';



CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "address" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


COMMENT ON TABLE "public"."restaurants" IS 'Cadastro de restaurantes para rastreamento de refeições externas';



COMMENT ON COLUMN "public"."restaurants"."tenant_id" IS 'ID do tenant (multi-tenancy)';



COMMENT ON COLUMN "public"."restaurants"."name" IS 'Nome do restaurante';



COMMENT ON COLUMN "public"."restaurants"."address" IS 'Endereço do restaurante (opcional)';



CREATE TABLE IF NOT EXISTS "public"."schema_migrations" (
    "name" "text" NOT NULL,
    "applied_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."schema_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" character varying(200) NOT NULL,
    "quantity" numeric(10,2) DEFAULT 1,
    "unit" character varying(50),
    "category" character varying(50),
    "is_purchased" boolean DEFAULT false,
    "purchased_at" timestamp without time zone,
    "source" character varying(20) DEFAULT 'manual'::character varying,
    "source_id" "uuid",
    "suggestion_status" character varying(20),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "price" numeric(10,2),
    "unit_price" numeric(10,2)
);


ALTER TABLE "public"."shopping_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_lists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "completed_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "store_id" "uuid"
);


ALTER TABLE "public"."shopping_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "address" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."taco_foods" (
    "id" integer NOT NULL,
    "taco_number" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "category" character varying(100),
    "humidity" numeric(6,2),
    "calories" numeric(8,2),
    "energy_kj" numeric(8,2),
    "protein" numeric(8,2),
    "fat" numeric(8,2),
    "carbs" numeric(8,2),
    "fiber" numeric(8,2),
    "cholesterol" numeric(8,2),
    "sodium" numeric(8,2),
    "calcium" numeric(8,2),
    "magnesium" numeric(8,2),
    "manganese" numeric(8,4),
    "phosphorus" numeric(8,2),
    "iron" numeric(8,2),
    "potassium" numeric(8,2),
    "copper" numeric(8,4),
    "zinc" numeric(8,2),
    "retinol" numeric(8,2),
    "retinol_equivalent" numeric(8,2),
    "rae" numeric(8,2),
    "thiamine" numeric(8,4),
    "riboflavin" numeric(8,4),
    "pyridoxine" numeric(8,4),
    "niacin" numeric(8,4),
    "vitamin_c" numeric(8,2),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."taco_foods" OWNER TO "postgres";


COMMENT ON TABLE "public"."taco_foods" IS 'Tabela TACO 4ª edição - valores nutricionais por 100g do alimento';



CREATE SEQUENCE IF NOT EXISTS "public"."taco_foods_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."taco_foods_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."taco_foods_id_seq" OWNED BY "public"."taco_foods"."id";



CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" character varying(100) NOT NULL,
    "name" character varying(200) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_quotas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "month" character varying(7) NOT NULL,
    "photo_analyses" integer DEFAULT 0 NOT NULL,
    "ocr_analyses" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "text_analyses" integer DEFAULT 0 NOT NULL,
    "report_analyses" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."usage_quotas" OWNER TO "postgres";


COMMENT ON TABLE "public"."usage_quotas" IS 'Rastreamento de uso mensal de recursos premium por usuário';



COMMENT ON COLUMN "public"."usage_quotas"."month" IS 'Mês de referência no formato YYYY-MM';



COMMENT ON COLUMN "public"."usage_quotas"."photo_analyses" IS 'Quantidade de análises de foto de refeições usadas no mês';



COMMENT ON COLUMN "public"."usage_quotas"."ocr_analyses" IS 'Quantidade de análises de tabela nutricional (OCR) usadas no mês';



COMMENT ON COLUMN "public"."usage_quotas"."report_analyses" IS 'Quantidade de análises de relatórios IA usadas no mês';



CREATE TABLE IF NOT EXISTS "public"."user_dietary_restrictions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "restriction_type" character varying(20) NOT NULL,
    "restriction_value" character varying(100) NOT NULL,
    "severity" character varying(20) DEFAULT 'moderate'::character varying,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_dietary_restrictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(200) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid",
    "password_hash" "text",
    "role" character varying(20) DEFAULT 'member'::character varying NOT NULL,
    "phone" character varying(20),
    "goal_calories" integer DEFAULT 2000,
    "goal_protein_g" integer DEFAULT 150,
    "goal_carbs_g" integer DEFAULT 250,
    "goal_fat_g" integer DEFAULT 65,
    "goal_water_ml" integer DEFAULT 2000,
    "plan" character varying(20) DEFAULT 'free'::character varying NOT NULL,
    "subscription_status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "subscription_started_at" timestamp without time zone,
    "subscription_expires_at" timestamp without time zone,
    "is_lifetime_premium" boolean DEFAULT false,
    "goal_type" character varying(20),
    "height_cm" integer,
    "age" integer,
    "gender" character varying(10),
    "activity_level" character varying(20),
    "target_weight_kg" numeric(5,2),
    "weekly_goal_kg" numeric(4,2),
    "revenuecat_app_user_id" character varying(255),
    "revenuecat_original_transaction_id" character varying(255),
    "subscription_product_id" character varying(100),
    "subscription_store" character varying(20),
    CONSTRAINT "users_goal_calories_check" CHECK ((("goal_calories" > 0) AND ("goal_calories" <= 10000))),
    CONSTRAINT "users_goal_carbs_g_check" CHECK ((("goal_carbs_g" > 0) AND ("goal_carbs_g" <= 1000))),
    CONSTRAINT "users_goal_fat_g_check" CHECK ((("goal_fat_g" > 0) AND ("goal_fat_g" <= 300))),
    CONSTRAINT "users_goal_protein_g_check" CHECK ((("goal_protein_g" > 0) AND ("goal_protein_g" <= 500))),
    CONSTRAINT "users_plan_check" CHECK ((("plan")::"text" = ANY ((ARRAY['free'::character varying, 'premium'::character varying, 'unlimited'::character varying])::"text"[]))),
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'member'::character varying])::"text"[]))),
    CONSTRAINT "users_subscription_status_check" CHECK ((("subscription_status")::"text" = ANY ((ARRAY['active'::character varying, 'canceled'::character varying, 'expired'::character varying, 'trial'::character varying, 'lifetime'::character varying])::"text"[]))),
    CONSTRAINT "users_subscription_store_check" CHECK ((("subscription_store" IS NULL) OR (("subscription_store")::"text" = ANY ((ARRAY['app_store'::character varying, 'play_store'::character varying])::"text"[]))))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."phone" IS 'User contact phone number (optional)';



COMMENT ON COLUMN "public"."users"."goal_calories" IS 'Daily calorie goal in kcal (default: 2000)';



COMMENT ON COLUMN "public"."users"."goal_protein_g" IS 'Daily protein goal in grams (default: 150)';



COMMENT ON COLUMN "public"."users"."goal_carbs_g" IS 'Daily carbohydrate goal in grams (default: 250)';



COMMENT ON COLUMN "public"."users"."goal_fat_g" IS 'Daily fat goal in grams (default: 65)';



COMMENT ON COLUMN "public"."users"."goal_water_ml" IS 'Meta diária de água em ml (padrão 2000ml = 8 copos)';



COMMENT ON COLUMN "public"."users"."plan" IS 'Plano do usuário: free ou premium (user-level, não tenant-level)';



COMMENT ON COLUMN "public"."users"."subscription_status" IS 'Status da assinatura: active, canceled, expired, trial';



COMMENT ON COLUMN "public"."users"."subscription_started_at" IS 'Data de início da assinatura premium (null para free)';



COMMENT ON COLUMN "public"."users"."subscription_expires_at" IS 'Data de expiração da assinatura (null = ilimitado para free)';



COMMENT ON COLUMN "public"."users"."is_lifetime_premium" IS 'Indica se o usuário tem PREMIUM grátis (vitalício ou trial). Quando TRUE, não verifica Stripe.';



COMMENT ON COLUMN "public"."users"."goal_type" IS 'Objetivo: lose_weight (emagrecer), gain_weight (ganhar peso), maintain_weight (manter peso)';



COMMENT ON COLUMN "public"."users"."height_cm" IS 'Altura em centímetros';



COMMENT ON COLUMN "public"."users"."age" IS 'Idade em anos';



COMMENT ON COLUMN "public"."users"."gender" IS 'Gênero: male, female, other';



COMMENT ON COLUMN "public"."users"."activity_level" IS 'Nível de atividade: sedentary, light, moderate, active, very_active';



COMMENT ON COLUMN "public"."users"."target_weight_kg" IS 'Peso alvo em kg';



COMMENT ON COLUMN "public"."users"."weekly_goal_kg" IS 'Meta de ganho/perda semanal em kg (ex: -0.5 para perder 500g/semana)';



CREATE TABLE IF NOT EXISTS "public"."water_intake" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "amount_ml" integer DEFAULT 250 NOT NULL,
    "consumed_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."water_intake" OWNER TO "postgres";


COMMENT ON TABLE "public"."water_intake" IS 'Registros de ingestão de água por usuário - zera a cada dia';



COMMENT ON COLUMN "public"."water_intake"."amount_ml" IS 'Quantidade em mililitros (padrão 250ml = 1 copo)';



COMMENT ON COLUMN "public"."water_intake"."consumed_at" IS 'Data/hora da ingestão';



COMMENT ON COLUMN "public"."water_intake"."notes" IS 'Notas opcionais sobre a ingestão';



CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" character varying(255) NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "user_id" "uuid",
    "app_user_id" character varying(255) NOT NULL,
    "product_id" character varying(100),
    "store" character varying(20),
    "environment" character varying(20),
    "price_cents" integer,
    "currency" character varying(3),
    "expiration_at" timestamp without time zone,
    "raw_payload" "jsonb",
    "processed_at" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weight_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "weight" numeric(5,2) NOT NULL,
    "log_date" "date" NOT NULL,
    "log_time" time without time zone DEFAULT CURRENT_TIME,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "weight_logs_weight_check" CHECK ((("weight" > (0)::numeric) AND ("weight" < (500)::numeric)))
);


ALTER TABLE "public"."weight_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."weight_logs" IS 'Registro diário de peso dos usuários';



COMMENT ON COLUMN "public"."weight_logs"."tenant_id" IS 'ID do tenant (multi-tenancy)';



COMMENT ON COLUMN "public"."weight_logs"."user_id" IS 'Usuário que registrou o peso';



COMMENT ON COLUMN "public"."weight_logs"."weight" IS 'Peso em kg, limite entre 0 e 500kg';



COMMENT ON COLUMN "public"."weight_logs"."log_date" IS 'Data do registro';



COMMENT ON COLUMN "public"."weight_logs"."log_time" IS 'Hora do registro (permite múltiplos por dia)';



COMMENT ON COLUMN "public"."weight_logs"."notes" IS 'Observações sobre o registro (opcional)';



ALTER TABLE ONLY "public"."taco_foods" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."taco_foods_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."body_measurements"
    ADD CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."body_measurements"
    ADD CONSTRAINT "body_measurements_user_id_measurement_date_measurement_time_key" UNIQUE ("user_id", "measurement_date", "measurement_time", "tenant_id");



ALTER TABLE ONLY "public"."bowel_movements"
    ADD CONSTRAINT "bowel_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_analyses"
    ADD CONSTRAINT "coach_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."food_bank"
    ADD CONSTRAINT "food_bank_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."food_items"
    ADD CONSTRAINT "food_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nutrition_data"
    ADD CONSTRAINT "nutrition_data_food_item_unique" UNIQUE ("food_item_id");



ALTER TABLE ONLY "public"."nutrition_data"
    ADD CONSTRAINT "nutrition_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."taco_foods"
    ADD CONSTRAINT "taco_foods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."taco_foods"
    ADD CONSTRAINT "taco_foods_taco_number_key" UNIQUE ("taco_number");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_dietary_restrictions"
    ADD CONSTRAINT "unique_user_restriction" UNIQUE ("user_id", "tenant_id", "restriction_type", "restriction_value");



ALTER TABLE ONLY "public"."usage_quotas"
    ADD CONSTRAINT "usage_quotas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_quotas"
    ADD CONSTRAINT "usage_quotas_user_id_month_key" UNIQUE ("user_id", "month");



ALTER TABLE ONLY "public"."user_dietary_restrictions"
    ADD CONSTRAINT "user_dietary_restrictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."water_intake"
    ADD CONSTRAINT "water_intake_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_event_id_key" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weight_logs"
    ADD CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weight_logs"
    ADD CONSTRAINT "weight_logs_user_id_log_date_log_time_tenant_id_key" UNIQUE ("user_id", "log_date", "log_time", "tenant_id");



CREATE INDEX "idx_body_measurements_date" ON "public"."body_measurements" USING "btree" ("measurement_date" DESC);



CREATE INDEX "idx_body_measurements_tenant" ON "public"."body_measurements" USING "btree" ("tenant_id");



CREATE INDEX "idx_body_measurements_tenant_id" ON "public"."body_measurements" USING "btree" ("tenant_id");



CREATE INDEX "idx_body_measurements_user" ON "public"."body_measurements" USING "btree" ("user_id", "measurement_date" DESC);



CREATE INDEX "idx_body_measurements_user_id" ON "public"."body_measurements" USING "btree" ("user_id");



CREATE INDEX "idx_bowel_movements_occurred_at" ON "public"."bowel_movements" USING "btree" ("occurred_at");



CREATE INDEX "idx_bowel_movements_tenant_id" ON "public"."bowel_movements" USING "btree" ("tenant_id");



CREATE INDEX "idx_bowel_movements_user_date" ON "public"."bowel_movements" USING "btree" ("user_id", "date"("occurred_at"));



CREATE INDEX "idx_bowel_movements_user_id" ON "public"."bowel_movements" USING "btree" ("user_id");



CREATE INDEX "idx_bowel_movements_user_occurred" ON "public"."bowel_movements" USING "btree" ("user_id", "occurred_at" DESC);



CREATE INDEX "idx_coach_analyses_context_gin" ON "public"."coach_analyses" USING "gin" ("context_data");



CREATE INDEX "idx_coach_analyses_date" ON "public"."coach_analyses" USING "btree" ("analysis_date" DESC);



CREATE INDEX "idx_coach_analyses_tenant_id" ON "public"."coach_analyses" USING "btree" ("tenant_id");



CREATE INDEX "idx_coach_analyses_user_id" ON "public"."coach_analyses" USING "btree" ("user_id");



CREATE INDEX "idx_dietary_restrictions_type" ON "public"."user_dietary_restrictions" USING "btree" ("restriction_type");



CREATE INDEX "idx_dietary_restrictions_user" ON "public"."user_dietary_restrictions" USING "btree" ("user_id", "tenant_id");



CREATE INDEX "idx_food_bank_category" ON "public"."food_bank" USING "btree" ("tenant_id", "user_id", "category");



CREATE INDEX "idx_food_bank_name" ON "public"."food_bank" USING "btree" ("name");



CREATE INDEX "idx_food_bank_purchasable" ON "public"."food_bank" USING "btree" ("tenant_id", "user_id", "purchasable");



CREATE INDEX "idx_food_bank_tenant_id" ON "public"."food_bank" USING "btree" ("tenant_id");



CREATE INDEX "idx_food_bank_usage_count" ON "public"."food_bank" USING "btree" ("usage_count" DESC);



CREATE INDEX "idx_food_bank_user_id" ON "public"."food_bank" USING "btree" ("user_id");



CREATE INDEX "idx_food_items_meal_id" ON "public"."food_items" USING "btree" ("meal_id");



CREATE INDEX "idx_food_items_tenant" ON "public"."food_items" USING "btree" ("tenant_id");



CREATE INDEX "idx_meals_consumed_date" ON "public"."meals" USING "btree" ("user_id", "date"("consumed_at"));



CREATE INDEX "idx_meals_location_type" ON "public"."meals" USING "btree" ("location_type");



CREATE INDEX "idx_meals_restaurant_id" ON "public"."meals" USING "btree" ("restaurant_id");



CREATE INDEX "idx_meals_tenant_consumed" ON "public"."meals" USING "btree" ("tenant_id", "consumed_at" DESC);



CREATE INDEX "idx_meals_user_consumed" ON "public"."meals" USING "btree" ("user_id", "consumed_at" DESC);



CREATE INDEX "idx_nutrition_data_food_item_id" ON "public"."nutrition_data" USING "btree" ("food_item_id");



CREATE INDEX "idx_nutrition_tenant" ON "public"."nutrition_data" USING "btree" ("tenant_id");



CREATE INDEX "idx_restaurants_name" ON "public"."restaurants" USING "btree" ("name");



CREATE INDEX "idx_restaurants_tenant_id" ON "public"."restaurants" USING "btree" ("tenant_id");



CREATE INDEX "idx_shopping_items_list" ON "public"."shopping_items" USING "btree" ("list_id");



CREATE INDEX "idx_shopping_items_purchased" ON "public"."shopping_items" USING "btree" ("list_id", "is_purchased");



CREATE INDEX "idx_shopping_lists_status" ON "public"."shopping_lists" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE INDEX "idx_shopping_lists_user" ON "public"."shopping_lists" USING "btree" ("user_id", "tenant_id");



CREATE INDEX "idx_stores_user" ON "public"."stores" USING "btree" ("user_id", "tenant_id");



CREATE INDEX "idx_taco_foods_category" ON "public"."taco_foods" USING "btree" ("category");



CREATE INDEX "idx_taco_foods_name" ON "public"."taco_foods" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", ("name")::"text"));



CREATE INDEX "idx_usage_quotas_month" ON "public"."usage_quotas" USING "btree" ("month");



CREATE INDEX "idx_usage_quotas_tenant" ON "public"."usage_quotas" USING "btree" ("tenant_id");



CREATE INDEX "idx_usage_quotas_user_month" ON "public"."usage_quotas" USING "btree" ("user_id", "month");



CREATE INDEX "idx_users_goal_type" ON "public"."users" USING "btree" ("goal_type");



CREATE INDEX "idx_users_lifetime_premium" ON "public"."users" USING "btree" ("is_lifetime_premium") WHERE ("is_lifetime_premium" = true);



CREATE INDEX "idx_users_plan" ON "public"."users" USING "btree" ("plan");



CREATE INDEX "idx_users_revenuecat" ON "public"."users" USING "btree" ("revenuecat_app_user_id");



CREATE INDEX "idx_users_subscription_expires" ON "public"."users" USING "btree" ("subscription_expires_at");



CREATE INDEX "idx_users_subscription_product" ON "public"."users" USING "btree" ("subscription_product_id");



CREATE INDEX "idx_users_tenant" ON "public"."users" USING "btree" ("tenant_id");



CREATE INDEX "idx_water_intake_consumed_at" ON "public"."water_intake" USING "btree" ("consumed_at");



CREATE INDEX "idx_water_intake_tenant_id" ON "public"."water_intake" USING "btree" ("tenant_id");



CREATE INDEX "idx_water_intake_user_consumed" ON "public"."water_intake" USING "btree" ("user_id", "consumed_at" DESC);



CREATE INDEX "idx_water_intake_user_date" ON "public"."water_intake" USING "btree" ("user_id", "date"("consumed_at"));



CREATE INDEX "idx_water_intake_user_id" ON "public"."water_intake" USING "btree" ("user_id");



CREATE INDEX "idx_webhook_events_app_user" ON "public"."webhook_events" USING "btree" ("app_user_id");



CREATE INDEX "idx_webhook_events_created" ON "public"."webhook_events" USING "btree" ("created_at");



CREATE INDEX "idx_webhook_events_type" ON "public"."webhook_events" USING "btree" ("event_type");



CREATE INDEX "idx_webhook_events_user" ON "public"."webhook_events" USING "btree" ("user_id");



CREATE INDEX "idx_weight_logs_date" ON "public"."weight_logs" USING "btree" ("log_date" DESC);



CREATE INDEX "idx_weight_logs_tenant_id" ON "public"."weight_logs" USING "btree" ("tenant_id");



CREATE INDEX "idx_weight_logs_user_id" ON "public"."weight_logs" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uniq_users_tenant_email" ON "public"."users" USING "btree" ("tenant_id", "email");



CREATE OR REPLACE TRIGGER "bowel_movements_updated_at" BEFORE UPDATE ON "public"."bowel_movements" FOR EACH ROW EXECUTE FUNCTION "public"."update_bowel_movements_updated_at"();



CREATE OR REPLACE TRIGGER "water_intake_updated_at" BEFORE UPDATE ON "public"."water_intake" FOR EACH ROW EXECUTE FUNCTION "public"."update_water_intake_updated_at"();



ALTER TABLE ONLY "public"."body_measurements"
    ADD CONSTRAINT "body_measurements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."body_measurements"
    ADD CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bowel_movements"
    ADD CONSTRAINT "bowel_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bowel_movements"
    ADD CONSTRAINT "bowel_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_analyses"
    ADD CONSTRAINT "coach_analyses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coach_analyses"
    ADD CONSTRAINT "coach_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."food_bank"
    ADD CONSTRAINT "food_bank_taco_id_fkey" FOREIGN KEY ("taco_id") REFERENCES "public"."taco_foods"("id");



ALTER TABLE ONLY "public"."food_bank"
    ADD CONSTRAINT "food_bank_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."food_bank"
    ADD CONSTRAINT "food_bank_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."food_items"
    ADD CONSTRAINT "food_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."food_items"
    ADD CONSTRAINT "food_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nutrition_data"
    ADD CONSTRAINT "nutrition_data_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nutrition_data"
    ADD CONSTRAINT "nutrition_data_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_items"
    ADD CONSTRAINT "shopping_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");



ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_lists"
    ADD CONSTRAINT "shopping_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."usage_quotas"
    ADD CONSTRAINT "usage_quotas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_quotas"
    ADD CONSTRAINT "usage_quotas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_dietary_restrictions"
    ADD CONSTRAINT "user_dietary_restrictions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_dietary_restrictions"
    ADD CONSTRAINT "user_dietary_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."water_intake"
    ADD CONSTRAINT "water_intake_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."water_intake"
    ADD CONSTRAINT "water_intake_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."weight_logs"
    ADD CONSTRAINT "weight_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weight_logs"
    ADD CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can manage own restrictions" ON "public"."user_dietary_restrictions" USING (("tenant_id" = ("current_setting"('app.tenant_id'::"text", true))::"uuid")) WITH CHECK (("tenant_id" = ("current_setting"('app.tenant_id'::"text", true))::"uuid"));



ALTER TABLE "public"."user_dietary_restrictions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_bowel_movements_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bowel_movements_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bowel_movements_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_water_intake_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_water_intake_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_water_intake_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."body_measurements" TO "anon";
GRANT ALL ON TABLE "public"."body_measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."body_measurements" TO "service_role";



GRANT ALL ON TABLE "public"."bowel_movements" TO "anon";
GRANT ALL ON TABLE "public"."bowel_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."bowel_movements" TO "service_role";



GRANT ALL ON TABLE "public"."coach_analyses" TO "anon";
GRANT ALL ON TABLE "public"."coach_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."food_bank" TO "anon";
GRANT ALL ON TABLE "public"."food_bank" TO "authenticated";
GRANT ALL ON TABLE "public"."food_bank" TO "service_role";



GRANT ALL ON TABLE "public"."food_items" TO "anon";
GRANT ALL ON TABLE "public"."food_items" TO "authenticated";
GRANT ALL ON TABLE "public"."food_items" TO "service_role";



GRANT ALL ON TABLE "public"."meals" TO "anon";
GRANT ALL ON TABLE "public"."meals" TO "authenticated";
GRANT ALL ON TABLE "public"."meals" TO "service_role";



GRANT ALL ON TABLE "public"."nutrition_data" TO "anon";
GRANT ALL ON TABLE "public"."nutrition_data" TO "authenticated";
GRANT ALL ON TABLE "public"."nutrition_data" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."schema_migrations" TO "anon";
GRANT ALL ON TABLE "public"."schema_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_items" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_lists" TO "anon";
GRANT ALL ON TABLE "public"."shopping_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_lists" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";



GRANT ALL ON TABLE "public"."taco_foods" TO "anon";
GRANT ALL ON TABLE "public"."taco_foods" TO "authenticated";
GRANT ALL ON TABLE "public"."taco_foods" TO "service_role";



GRANT ALL ON SEQUENCE "public"."taco_foods_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."taco_foods_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."taco_foods_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."usage_quotas" TO "anon";
GRANT ALL ON TABLE "public"."usage_quotas" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_quotas" TO "service_role";



GRANT ALL ON TABLE "public"."user_dietary_restrictions" TO "anon";
GRANT ALL ON TABLE "public"."user_dietary_restrictions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_dietary_restrictions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."water_intake" TO "anon";
GRANT ALL ON TABLE "public"."water_intake" TO "authenticated";
GRANT ALL ON TABLE "public"."water_intake" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."weight_logs" TO "anon";
GRANT ALL ON TABLE "public"."weight_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."weight_logs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























\unrestrict b0TdWcodBRFsMJETLyfbdMspMQN40qfaWYq4id7Fc4q8cf40UgWrxrTprWWb1g3

RESET ALL;
