-- Esquema de la base de datos (copia legible).
-- NO hace falta ejecutarlo: la aplicación crea las tablas sola en la primera visita
-- (src/lib/schema.ts). Sirve como referencia o para crear la base a mano.

CREATE TABLE IF NOT EXISTS participants (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code             text UNIQUE NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    is_test          boolean NOT NULL DEFAULT false,
    source           text,
    current_step     text NOT NULL DEFAULT 'consent',
    consent          boolean,
    consent_at       timestamptz,
    age              int,
    gender           text,
    education        text,
    occupation       text,
    estrato          text,
    residence        text,
    spanish_fluent   text,
    psych_student    text,
    device_self      text,
    eligible         boolean,
    condition        text CHECK (condition IN ('control','humano','ia')),
    cb_set           text CHECK (cb_set IN ('A','B')),
    human_gender     text CHECK (human_gender IN ('hombre','mujer')),
    seed             bigint,
    trial_plan       jsonb,
    assigned_at      timestamptz,
    trials_started_at timestamptz,
    manip_check      text,
    rec_considered   int,
    rec_trust        int,
    ai_ever          text,
    ai_freq          text,
    ai_training      text,
    prior_studies    text,
    knew_design      text,
    guess_purpose    text,
    finished_at      timestamptz,
    user_agent       text,
    device           jsonb
  );

CREATE TABLE IF NOT EXISTS trials (
    id                  bigserial PRIMARY KEY,
    participant_id      uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    created_at          timestamptz NOT NULL DEFAULT now(),
    block               text NOT NULL CHECK (block IN ('practice','main')),
    trial_index         int NOT NULL,
    item_id             text NOT NULL,
    condition           text,
    cb_set              text,
    target_option       text,
    target_side         text,
    left_option         text NOT NULL,
    right_option        text NOT NULL,
    slider_value        int NOT NULL,
    choice_option       text NOT NULL,
    choice_side         text NOT NULL,
    congruent           smallint,
    toward_target       int,
    strength            int NOT NULL,
    rt_ms               int,
    first_move_ms       int,
    onset_to_confirm_ms int,
    lock_ms             int,
    moves               int,
    switches            int,
    max_toward_target   int,
    min_toward_target   int,
    trajectory          jsonb,
    pointer_type        text,
    away_ms             int,
    img_error           boolean,
    img_px              int,
    viewport_w          int,
    viewport_h          int,
    UNIQUE (participant_id, block, item_id)
  );

ALTER TABLE trials ADD COLUMN IF NOT EXISTS img_px int;

ALTER TABLE participants ADD COLUMN IF NOT EXISTS human_gender text;

CREATE INDEX IF NOT EXISTS trials_participant_idx ON trials (participant_id);

CREATE INDEX IF NOT EXISTS participants_balance_idx ON participants (is_test, condition, cb_set);
