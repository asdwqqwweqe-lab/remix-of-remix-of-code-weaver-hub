CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: quiz_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    roadmap_title text NOT NULL,
    topics text NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: saved_explanations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_explanations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    roadmap_title text NOT NULL,
    language_name text NOT NULL,
    topics text NOT NULL,
    explanation text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_results quiz_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_pkey PRIMARY KEY (id);


--
-- Name: saved_explanations saved_explanations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_explanations
    ADD CONSTRAINT saved_explanations_pkey PRIMARY KEY (id);


--
-- Name: saved_explanations Allow public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete" ON public.saved_explanations FOR DELETE USING (true);


--
-- Name: quiz_results Allow public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert" ON public.quiz_results FOR INSERT WITH CHECK (true);


--
-- Name: saved_explanations Allow public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert" ON public.saved_explanations FOR INSERT WITH CHECK (true);


--
-- Name: quiz_results Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.quiz_results FOR SELECT USING (true);


--
-- Name: saved_explanations Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.saved_explanations FOR SELECT USING (true);


--
-- Name: quiz_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_explanations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_explanations ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;