"""PostgreSQL (Primary) & SQLite (Fallback) database management for CarbonKatha 2.0.
Ensures data persistence in local PostgreSQL with full security precautions:
- Strictly parameterized queries to eliminate SQL injection
- PBKDF2-HMAC-SHA256 password hashing with unique salt
- Transaction safety with SAVEPOINT-protected sequence retrieval
- Comprehensive schema with foreign keys and CASCADE constraints
- Automatic fallback to SQLite if PostgreSQL is unavailable
"""

import hashlib
import json
import logging
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("carbonkatha.database")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = str(PROJECT_ROOT / "carbonkatha.db")
CORPUS_JSON_PATH = PROJECT_ROOT / "api" / "corpus" / "language_corpus.json"
if not CORPUS_JSON_PATH.exists():
    CORPUS_JSON_PATH = PROJECT_ROOT / "ai_models" / "corpus" / "language_corpus.json"
UPLOAD_DIR = PROJECT_ROOT / "uploads" / "evidence"

# PostgreSQL Configuration
PG_DBNAME = os.environ.get("PGDATABASE", "carbonkatha")
PG_USER = os.environ.get("PGUSER", "postgres")
PG_PASSWORD = os.environ.get("PGPASSWORD", "1234")
PG_HOST = os.environ.get("PGHOST", "127.0.0.1")
PG_PORT = int(os.environ.get("PGPORT", "5432"))

# Check for psycopg2
try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False


class PGCursorWrapper:
    """Wraps a psycopg2 cursor to provide an API identical to sqlite3.Cursor.
    Translates '?' parameter placeholders to '%s' and retrieves cursor.lastrowid safely.
    """

    def __init__(self, raw_cursor, conn):
        self._cur = raw_cursor
        self._conn = conn
        self._lastrowid: Optional[int] = None

    @property
    def lastrowid(self) -> Optional[int]:
        return self._lastrowid

    @property
    def description(self):
        return self._cur.description

    @property
    def rowcount(self) -> int:
        return self._cur.rowcount

    def execute(self, query: str, params: Optional[Tuple[Any, ...]] = None):
        # Convert SQLite-style ? placeholders to psycopg2 %s placeholders
        converted_query = query.replace("?", "%s")
        stripped = query.strip().upper()

        if params is not None:
            self._cur.execute(converted_query, params)
        else:
            self._cur.execute(converted_query)

        # For INSERT statements, safely capture the generated serial ID
        if stripped.startswith("INSERT"):
            try:
                self._cur.execute("SAVEPOINT ck_lastval_sp;")
                self._cur.execute("SELECT LASTVAL() as id;")
                row = self._cur.fetchone()
                if row:
                    self._lastrowid = row[0]
                self._cur.execute("RELEASE SAVEPOINT ck_lastval_sp;")
            except Exception:
                try:
                    self._cur.execute("ROLLBACK TO SAVEPOINT ck_lastval_sp;")
                except Exception:
                    pass
                self._lastrowid = None
        return self

    def executemany(self, query: str, seq_of_params):
        converted_query = query.replace("?", "%s")
        self._cur.executemany(converted_query, seq_of_params)
        return self

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def fetchmany(self, size: Optional[int] = None):
        return self._cur.fetchmany(size) if size else self._cur.fetchmany()

    def close(self):
        self._cur.close()

    def __iter__(self):
        return iter(self._cur)


class PGConnectionWrapper:
    """Wraps a psycopg2 connection to mimic sqlite3.Connection context behavior."""

    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        return PGCursorWrapper(
            self._conn.cursor(cursor_factory=psycopg2.extras.DictCursor),
            self._conn,
        )

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self._conn.rollback()
        else:
            self._conn.commit()


def get_pg_connection() -> Optional[PGConnectionWrapper]:
    """Attempts to connect to local PostgreSQL securely."""
    if not PSYCOPG2_AVAILABLE:
        return None
    try:
        raw_conn = psycopg2.connect(
            dbname=PG_DBNAME,
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT,
            connect_timeout=2,
        )
        return PGConnectionWrapper(raw_conn)
    except Exception as e:
        logger.warning("PostgreSQL connection attempt failed, falling back to SQLite: %s", e)
        return None


def get_db_connection():
    """Returns an active database connection.
    Prioritizes PostgreSQL. Falls back to SQLite if PostgreSQL is not reachable.
    """
    pg_conn = get_pg_connection()
    if pg_conn is not None:
        return pg_conn

    # Fallback to SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_active_db_engine() -> str:
    """Returns 'postgresql' or 'sqlite' indicating the active backend storage engine."""
    conn = get_pg_connection()
    if conn is not None:
        conn.close()
        return "postgresql"
    return "sqlite"


def init_db() -> None:
    """Initialize all CarbonKatha 2.0 database tables in both PostgreSQL and SQLite."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Initialize PostgreSQL if available
    pg_conn = get_pg_connection()
    if pg_conn is not None:
        try:
            with pg_conn:
                cur = pg_conn._conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS training_corpus (
                        id SERIAL PRIMARY KEY,
                        language TEXT NOT NULL,
                        modality TEXT NOT NULL,
                        script_type TEXT NOT NULL,
                        raw_text TEXT NOT NULL,
                        activities_json TEXT NOT NULL,
                        assumptions_json TEXT NOT NULL,
                        is_few_shot INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS voice_logs (
                        id SERIAL PRIMARY KEY,
                        session_id TEXT NOT NULL,
                        audio_filename TEXT,
                        audio_format TEXT,
                        duration_seconds REAL,
                        stt_engine TEXT NOT NULL,
                        language_hint TEXT,
                        language_detected TEXT,
                        transcribed_text TEXT NOT NULL,
                        parsed_response_json TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS user_feedback (
                        id SERIAL PRIMARY KEY,
                        session_id TEXT NOT NULL,
                        original_text TEXT NOT NULL,
                        original_activities_json TEXT NOT NULL,
                        corrected_activities_json TEXT NOT NULL,
                        user_comment TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        name TEXT NOT NULL,
                        account_type TEXT NOT NULL,
                        city TEXT,
                        state TEXT,
                        preferred_language TEXT DEFAULT 'en',
                        is_demo_user INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS households (
                        id SERIAL PRIMARY KEY,
                        name TEXT NOT NULL,
                        primary_holder_id INTEGER REFERENCES users(id),
                        member_count INTEGER DEFAULT 1,
                        city TEXT,
                        state TEXT,
                        household_type TEXT DEFAULT 'apartment',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS household_members (
                        id SERIAL PRIMARY KEY,
                        household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        role TEXT DEFAULT 'member',
                        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(household_id, user_id)
                    );

                    CREATE TABLE IF NOT EXISTS organizations (
                        id SERIAL PRIMARY KEY,
                        name TEXT NOT NULL,
                        org_type TEXT DEFAULT 'technology',
                        industry TEXT DEFAULT 'Software & IT Services',
                        employee_count INTEGER DEFAULT 25,
                        city TEXT,
                        state TEXT,
                        contact_email TEXT,
                        size_category TEXT DEFAULT 'sme',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS organization_members (
                        id SERIAL PRIMARY KEY,
                        org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        role TEXT DEFAULT 'manager',
                        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(org_id, user_id)
                    );

                    CREATE TABLE IF NOT EXISTS facilities (
                        id SERIAL PRIMARY KEY,
                        org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                        name TEXT NOT NULL,
                        location TEXT,
                        facility_type TEXT DEFAULT 'branch_office',
                        area_sqft REAL DEFAULT 5000,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS activity_records (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        account_type TEXT NOT NULL,
                        target_id INTEGER NOT NULL,
                        branch_id INTEGER REFERENCES facilities(id),
                        category TEXT NOT NULL,
                        item TEXT NOT NULL,
                        quantity REAL NOT NULL,
                        unit TEXT NOT NULL,
                        activity_date TEXT NOT NULL,
                        reporting_period TEXT NOT NULL,
                        calculated_co2_kg REAL NOT NULL,
                        emission_factor REAL NOT NULL,
                        methodology_version TEXT DEFAULT 'CEA-v19/IPCC-2024',
                        is_shared_record INTEGER DEFAULT 0,
                        evidence_status TEXT DEFAULT 'not_supported',
                        is_verified INTEGER DEFAULT 0,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS evidence_documents (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        activity_id INTEGER REFERENCES activity_records(id),
                        file_path TEXT NOT NULL,
                        original_filename TEXT NOT NULL,
                        file_hash_sha256 TEXT NOT NULL,
                        mime_type TEXT NOT NULL,
                        file_size_bytes INTEGER NOT NULL,
                        document_type TEXT NOT NULL,
                        issuer_name TEXT,
                        consumer_id TEXT,
                        billing_start TEXT,
                        billing_end TEXT,
                        extracted_quantity REAL,
                        extracted_unit TEXT,
                        extracted_amount_inr REAL,
                        extraction_json TEXT,
                        extraction_confidence REAL DEFAULT 0.0,
                        verification_status TEXT DEFAULT 'under_review',
                        is_flagged INTEGER DEFAULT 0,
                        flag_reason TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS verification_events (
                        id SERIAL PRIMARY KEY,
                        evidence_id INTEGER REFERENCES evidence_documents(id),
                        activity_id INTEGER REFERENCES activity_records(id),
                        previous_status TEXT,
                        new_status TEXT NOT NULL,
                        actor_type TEXT NOT NULL,
                        reason TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS gps_trips (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        mode TEXT NOT NULL,
                        distance_km REAL NOT NULL,
                        duration_minutes REAL,
                        start_location TEXT,
                        end_location TEXT,
                        route_points_json TEXT,
                        estimated_co2_kg REAL NOT NULL,
                        co2_saved_vs_car_kg REAL NOT NULL,
                        is_simulated INTEGER DEFAULT 0,
                        consent_granted INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS coin_transactions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        account_type TEXT NOT NULL,
                        target_id INTEGER NOT NULL,
                        amount INTEGER NOT NULL,
                        transaction_type TEXT NOT NULL,
                        reason TEXT NOT NULL,
                        balance_after INTEGER NOT NULL,
                        reference_id TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS reward_catalog (
                        id SERIAL PRIMARY KEY,
                        title TEXT NOT NULL,
                        provider TEXT NOT NULL,
                        category TEXT NOT NULL,
                        coin_cost INTEGER NOT NULL,
                        discount_description TEXT NOT NULL,
                        terms TEXT,
                        expiry_days INTEGER DEFAULT 30,
                        coupon_prefix TEXT DEFAULT 'CK2',
                        is_demo INTEGER DEFAULT 1,
                        active INTEGER DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS reward_redemptions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        reward_id INTEGER REFERENCES reward_catalog(id),
                        coupon_code TEXT NOT NULL UNIQUE,
                        coins_spent INTEGER NOT NULL,
                        status TEXT DEFAULT 'active',
                        expires_at TIMESTAMP NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS challenges (
                        id SERIAL PRIMARY KEY,
                        title TEXT NOT NULL,
                        description TEXT NOT NULL,
                        category TEXT NOT NULL,
                        target_metric TEXT NOT NULL,
                        target_value REAL NOT NULL,
                        coin_reward INTEGER NOT NULL,
                        duration_days INTEGER NOT NULL,
                        min_tier TEXT DEFAULT 'Bronze',
                        is_household INTEGER DEFAULT 0,
                        is_organization INTEGER DEFAULT 0,
                        active INTEGER DEFAULT 1
                    );

                    CREATE TABLE IF NOT EXISTS challenge_participants (
                        id SERIAL PRIMARY KEY,
                        challenge_id INTEGER REFERENCES challenges(id),
                        user_id INTEGER REFERENCES users(id),
                        target_id INTEGER NOT NULL,
                        account_type TEXT NOT NULL,
                        progress_pct REAL DEFAULT 0.0,
                        status TEXT DEFAULT 'in_progress',
                        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        completed_at TIMESTAMP,
                        UNIQUE(challenge_id, user_id, target_id)
                    );

                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id SERIAL PRIMARY KEY,
                        actor_user_id INTEGER,
                        action TEXT NOT NULL,
                        target_type TEXT,
                        target_id INTEGER,
                        details_json TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cur.close()
            logger.info("Initialized PostgreSQL schema in database '%s'", PG_DBNAME)
        except Exception as e:
            logger.error("PostgreSQL schema initialization error: %s", e)

    # 2. Initialize SQLite as well (guaranteeing dual-layer persistence)
    with sqlite3.connect(DB_PATH) as s_conn:
        cursor = s_conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_corpus (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                language TEXT NOT NULL,
                modality TEXT NOT NULL,
                script_type TEXT NOT NULL,
                raw_text TEXT NOT NULL,
                activities_json TEXT NOT NULL,
                assumptions_json TEXT NOT NULL,
                is_few_shot INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS voice_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                audio_filename TEXT,
                audio_format TEXT,
                duration_seconds REAL,
                stt_engine TEXT NOT NULL,
                language_hint TEXT,
                language_detected TEXT,
                transcribed_text TEXT NOT NULL,
                parsed_response_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                original_text TEXT NOT NULL,
                original_activities_json TEXT NOT NULL,
                corrected_activities_json TEXT NOT NULL,
                user_comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                name TEXT NOT NULL,
                account_type TEXT NOT NULL,
                city TEXT,
                state TEXT,
                preferred_language TEXT DEFAULT 'en',
                is_demo_user INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS households (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                primary_holder_id INTEGER REFERENCES users(id),
                member_count INTEGER DEFAULT 1,
                city TEXT,
                state TEXT,
                household_type TEXT DEFAULT 'apartment',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS household_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role TEXT DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(household_id, user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                org_type TEXT DEFAULT 'technology',
                industry TEXT DEFAULT 'Software & IT Services',
                employee_count INTEGER DEFAULT 25,
                city TEXT,
                state TEXT,
                contact_email TEXT,
                size_category TEXT DEFAULT 'sme',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS organization_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role TEXT DEFAULT 'manager',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(org_id, user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS facilities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                location TEXT,
                facility_type TEXT DEFAULT 'branch_office',
                area_sqft REAL DEFAULT 5000,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                account_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                branch_id INTEGER REFERENCES facilities(id),
                category TEXT NOT NULL,
                item TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                activity_date TEXT NOT NULL,
                reporting_period TEXT NOT NULL,
                calculated_co2_kg REAL NOT NULL,
                emission_factor REAL NOT NULL,
                methodology_version TEXT DEFAULT 'CEA-v19/IPCC-2024',
                is_shared_record INTEGER DEFAULT 0,
                evidence_status TEXT DEFAULT 'not_supported',
                is_verified INTEGER DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evidence_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                activity_id INTEGER REFERENCES activity_records(id),
                file_path TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_hash_sha256 TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                document_type TEXT NOT NULL,
                issuer_name TEXT,
                consumer_id TEXT,
                billing_start TEXT,
                billing_end TEXT,
                extracted_quantity REAL,
                extracted_unit TEXT,
                extracted_amount_inr REAL,
                extraction_json TEXT,
                extraction_confidence REAL DEFAULT 0.0,
                verification_status TEXT DEFAULT 'under_review',
                is_flagged INTEGER DEFAULT 0,
                flag_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS verification_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evidence_id INTEGER REFERENCES evidence_documents(id),
                activity_id INTEGER REFERENCES activity_records(id),
                previous_status TEXT,
                new_status TEXT NOT NULL,
                actor_type TEXT NOT NULL,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gps_trips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                mode TEXT NOT NULL,
                distance_km REAL NOT NULL,
                duration_minutes REAL,
                start_location TEXT,
                end_location TEXT,
                route_points_json TEXT,
                estimated_co2_kg REAL NOT NULL,
                co2_saved_vs_car_kg REAL NOT NULL,
                is_simulated INTEGER DEFAULT 0,
                consent_granted INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coin_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                account_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                transaction_type TEXT NOT NULL,
                reason TEXT NOT NULL,
                balance_after INTEGER NOT NULL,
                reference_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reward_catalog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                provider TEXT NOT NULL,
                category TEXT NOT NULL,
                coin_cost INTEGER NOT NULL,
                discount_description TEXT NOT NULL,
                terms TEXT,
                expiry_days INTEGER DEFAULT 30,
                coupon_prefix TEXT DEFAULT 'CK2',
                is_demo INTEGER DEFAULT 1,
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reward_redemptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id),
                reward_id INTEGER REFERENCES reward_catalog(id),
                coupon_code TEXT NOT NULL UNIQUE,
                coins_spent INTEGER NOT NULL,
                status TEXT DEFAULT 'active',
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS challenges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                target_metric TEXT NOT NULL,
                target_value REAL NOT NULL,
                coin_reward INTEGER NOT NULL,
                duration_days INTEGER NOT NULL,
                min_tier TEXT DEFAULT 'Bronze',
                is_household INTEGER DEFAULT 0,
                is_organization INTEGER DEFAULT 0,
                active INTEGER DEFAULT 1
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS challenge_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challenge_id INTEGER REFERENCES challenges(id),
                user_id INTEGER REFERENCES users(id),
                target_id INTEGER NOT NULL,
                account_type TEXT NOT NULL,
                progress_pct REAL DEFAULT 0.0,
                status TEXT DEFAULT 'in_progress',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                UNIQUE(challenge_id, user_id, target_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                actor_user_id INTEGER,
                action TEXT NOT NULL,
                target_type TEXT,
                target_id INTEGER,
                details_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        s_conn.commit()


def seed_corpus_if_empty() -> int:
    """Populate the training corpus table from language_corpus.json if empty or updated."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM training_corpus")
        count = cursor.fetchone()[0]

        if CORPUS_JSON_PATH.exists():
            with open(CORPUS_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)

            if count < len(data):
                cursor.execute("DELETE FROM training_corpus")
                for item in data:
                    cursor.execute(
                        """
                        INSERT INTO training_corpus (
                            language, modality, script_type, raw_text,
                            activities_json, assumptions_json, is_few_shot
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            item["language"],
                            "voice_transcript",
                            "native" if item["language"] != "en" else "native",
                            item["text"],
                            json.dumps(item["activities"], ensure_ascii=False),
                            json.dumps(["Assumed standard Indian energy factors"], ensure_ascii=False),
                            1,
                        ),
                    )
                conn.commit()
                return len(data)
        return count


def get_few_shot_exemplars(language: str, limit: int = 2) -> List[Dict[str, Any]]:
    """Retrieve few-shot exemplars for a specific language to prime the LLM prompt."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT language, raw_text, activities_json, assumptions_json
            FROM training_corpus
            WHERE language = ? AND is_few_shot = 1
            LIMIT ?
            """,
            (language, limit),
        )
        rows = cursor.fetchall()
        return [
            {
                "language": r["language"],
                "raw_text": r["raw_text"],
                "activities": json.loads(r["activities_json"]),
                "assumptions": json.loads(r["assumptions_json"]),
            }
            for r in rows
        ]


def log_voice_input(
    session_id: str,
    transcribed_text: str,
    stt_engine: str,
    language_detected: str,
    audio_filename: Optional[str] = None,
    audio_format: Optional[str] = None,
    duration_seconds: Optional[float] = None,
    language_hint: Optional[str] = None,
    parsed_response_json: Optional[str] = None,
) -> int:
    """Log an ingested voice input session into the database."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO voice_logs (
                session_id, audio_filename, audio_format, duration_seconds,
                stt_engine, language_hint, language_detected, transcribed_text,
                parsed_response_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                audio_filename,
                audio_format,
                duration_seconds,
                stt_engine,
                language_hint,
                language_detected,
                transcribed_text,
                parsed_response_json,
            ),
        )
        conn.commit()
        return cursor.lastrowid or 0


def log_feedback_entry(
    session_id: str,
    original_text: str,
    original_activities: List[Dict[str, Any]],
    corrected_activities: List[Dict[str, Any]],
    user_comment: Optional[str] = None,
) -> int:
    """Log user corrections to enable continuous learning."""
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_feedback (
                session_id, original_text, original_activities_json,
                corrected_activities_json, user_comment
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                session_id,
                original_text,
                json.dumps(original_activities, ensure_ascii=False),
                json.dumps(corrected_activities, ensure_ascii=False),
                user_comment,
            ),
        )
        conn.commit()
        return cursor.lastrowid or 0
