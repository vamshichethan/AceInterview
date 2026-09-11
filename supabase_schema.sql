-- =========================================================
-- AI Placement Lab - Supabase PostgreSQL Schema
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    branch TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Interviews Table
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    project_title TEXT NOT NULL,
    tech_stack TEXT NOT NULL,
    transcript JSONB DEFAULT '[]'::jsonb NOT NULL,
    duration_seconds INTEGER DEFAULT 0 NOT NULL,
    status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Feedback Reports Table
CREATE TABLE IF NOT EXISTS public.feedback_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
    technical_score INTEGER NOT NULL CHECK (technical_score >= 1 AND technical_score <= 10),
    communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 10),
    strengths TEXT[] DEFAULT '{}'::text[] NOT NULL,
    improvements TEXT[] DEFAULT '{}'::text[] NOT NULL,
    practice_plan TEXT[] DEFAULT '{}'::text[] NOT NULL,
    topic_tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for efficient queries in Placement Dashboard
CREATE INDEX IF NOT EXISTS idx_interviews_student_id ON public.interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_feedback_interview_id ON public.feedback_reports(interview_id);

-- 4. Sample Seed Data for Instant Placement Officer Dashboard Demo
-- Adds a cohort of students, completed interviews, and diagnostic feedback reports.

INSERT INTO public.students (id, name, branch, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Aarav Sharma', 'Computer Science & Engineering', NOW() - INTERVAL '3 days'),
    ('22222222-2222-2222-2222-222222222222', 'Priya Patel', 'Information Technology', NOW() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333333', 'Rohan Verma', 'Computer Science & Engineering', NOW() - INTERVAL '2 days'),
    ('44444444-4444-4444-4444-444444444444', 'Ananya Gupta', 'Data Science & AI', NOW() - INTERVAL '1 day'),
    ('55555555-5555-5555-5555-555555555555', 'Karthik Rao', 'Electronics & Communication', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.interviews (id, student_id, project_title, tech_stack, transcript, duration_seconds, status, created_at)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Distributed E-Commerce Microservices',
        'React, Node.js, PostgreSQL, Redis, Docker',
        '[
            {"sender": "ai", "text": "Welcome Aarav. Could you walk me through the high-level architecture of your distributed e-commerce system and how services communicate?"},
            {"sender": "user", "text": "We used an API gateway with separate auth, inventory, and order services communicating via gRPC and Redis Pub/Sub for notifications."},
            {"sender": "ai", "text": "Interesting. How do you handle distributed transaction failures between the order service and the payment processor?"}
        ]'::jsonb,
        540,
        'completed',
        NOW() - INTERVAL '3 days'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '22222222-2222-2222-2222-222222222222',
        'Real-Time Healthcare Patient Telemetry',
        'Next.js, FastAPI, PostgreSQL, WebSockets',
        '[
            {"sender": "ai", "text": "Welcome Priya. What made you choose WebSockets over Server-Sent Events for streaming patient telemetry data?"},
            {"sender": "user", "text": "WebSockets allowed bidirectional heartbeats and alert acknowledgments directly from doctor terminals with lower latency."}
        ]'::jsonb,
        610,
        'completed',
        NOW() - INTERVAL '2 days'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '33333333-3333-3333-3333-333333333333',
        'Algorithmic Crypto Arbitrage Engine',
        'Python, Go, Redis, TimescaleDB',
        '[]'::jsonb,
        480,
        'completed',
        NOW() - INTERVAL '2 days'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '44444444-4444-4444-4444-444444444444',
        'Campus Placement Automation Portal',
        'React, Express, MongoDB, AWS S3',
        '[]'::jsonb,
        520,
        'completed',
        NOW() - INTERVAL '1 day'
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        '55555555-5555-5555-5555-555555555555',
        'Smart Agriculture IoT Crop Monitoring',
        'Flutter, Node.js, MQTT, InfluxDB',
        '[]'::jsonb,
        390,
        'completed',
        NOW() - INTERVAL '12 hours'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.feedback_reports (id, interview_id, technical_score, communication_score, strengths, improvements, practice_plan, topic_tags, created_at)
VALUES
    (
        'faaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        7,
        8,
        ARRAY['Clear explanation of service boundaries and gRPC contracts', 'Articulate breakdown of cache invalidation with Redis'],
        ARRAY['Struggled to articulate Saga pattern vs 2-Phase Commit when asked about distributed transactions', 'Fumbled when asked how auth tokens are invalidated on immediate logout'],
        ARRAY['Review JWT blacklist pattern using Redis TTLs', 'Study Saga orchestration vs choreography for distributed microservice rollback', 'Practice 60-second STAR response on debugging Redis connection leaks'],
        ARRAY['Distributed Transactions', 'Authentication & JWT', 'Cache Invalidation'],
        NOW() - INTERVAL '3 days'
    ),
    (
        'fbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        8,
        7,
        ARRAY['Strong grasp of WebSocket backpressure and connection reconnection strategies', 'Good reasoning regarding relational integrity in PostgreSQL for patient vitals'],
        ARRAY['Could not explain composite B-Tree database indexing when queried on timeseries query latency', 'Used frequent filler words when describing socket connection drops'],
        ARRAY['Deep dive into PostgreSQL EXPLAIN ANALYZE and composite indexes', 'Practice concise vocal delivery when answering fallback failure scenarios'],
        ARRAY['Database Indexing', 'Concurrency', 'Error Handling'],
        NOW() - INTERVAL '2 days'
    ),
    (
        'fccccccc-cccc-cccc-cccc-cccccccccccc',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        6,
        6,
        ARRAY['Good understanding of order book data structures and Go goroutines'],
        ARRAY['Severe gap in thread safety and race conditions under high throughput', 'Hesitant when asked to calculate memory footprint of in-memory queues'],
        ARRAY['Study Go sync.Mutex vs atomic operations and race detector', 'Prepare concrete memory calculation examples for interview questions'],
        ARRAY['Concurrency', 'System Design', 'Memory Management'],
        NOW() - INTERVAL '2 days'
    ),
    (
        'fddddddd-dddd-dddd-dddd-dddddddddddd',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        5,
        7,
        ARRAY['Pleasant communication pace and structured walk-through of the student workflow'],
        ARRAY['Used textbook answers for MongoDB schema design without justifying why NoSQL was better than relational', 'Could not explain how S3 presigned URLs prevent unauthorized resume access'],
        ARRAY['Study NoSQL vs SQL trade-offs with concrete access pattern analysis', 'Implement and explain presigned S3 upload security in a mock repo'],
        ARRAY['Database Indexing', 'API Security', 'System Design'],
        NOW() - INTERVAL '1 day'
    ),
    (
        'feeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        7,
        6,
        ARRAY['Solid understanding of MQTT broker QoS levels and sensor battery constraints'],
        ARRAY['Lacked clarity on time-series database retention policies and aggregation rollups', 'Stumbled when asked how sensor payloads are sanitized before ingestion'],
        ARRAY['Review InfluxDB continuous queries and downsampling', 'Study API input validation and MQTT payload encryption with TLS'],
        ARRAY['API Security', 'System Design', 'Time-series Storage'],
        NOW() - INTERVAL '12 hours'
    )
ON CONFLICT (id) DO NOTHING;
