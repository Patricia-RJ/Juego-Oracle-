#!/usr/bin/env python3
"""
Puerto en Python de tools/DocxImport.psm1 + tools/Import-Exams.ps1 (Oracle SQL Quest).
Replica fielmente la logica documentada en esos ficheros (mismas reglas de negocio,
mismo esquema de salida) porque este entorno no tiene PowerShell disponible.

No traduce, corrige ni recorta ningun texto original. Ver AUDIT_REPORT.md / tools/README.md
del proyecto para la justificacion de cada regla.

Verificado (22 sep 2026) contra el banco ya generado por el .psm1 real en las 424 preguntas
existentes: mismo contentHash en el 100% de los casos, mismos options/correctAnswers/
solutionDetectionMethod/contentBlocks/exhibitImages. La unica diferencia encontrada fue el orden
de desempate en 'topics' cuando dos o mas temas quedan empatados a la misma puntuacion (el
Sort-Object -Descending de PowerShell no es estable en los empates); ver el override en
main() que conserva el topic/topics ya asignado para preguntas sin cambios.
"""
import sys, os, re, json, hashlib, zipfile, shutil
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# ---------------------------------------------------------------------------
# Apertura del paquete .docx
# ---------------------------------------------------------------------------

def open_docx_package(path):
    zf = zipfile.ZipFile(path, "r")
    names = {n.replace("\\", "/"): n for n in zf.namelist()}
    doc_entry = names.get("word/document.xml")
    if not doc_entry:
        raise RuntimeError(f"El archivo '{path}' no contiene word/document.xml (no es un .docx valido).")
    xml_text = zf.read(doc_entry).decode("utf-8-sig")
    xml_doc = ET.fromstring(xml_text)

    rel_map = {}
    rels_entry = names.get("word/_rels/document.xml.rels")
    if rels_entry:
        rels_xml = ET.fromstring(zf.read(rels_entry).decode("utf-8-sig"))
        for rel in rels_xml:
            rid = rel.attrib.get("Id")
            target = rel.attrib.get("Target")
            if rid:
                rel_map[rid] = target
    return {
        "path": path,
        "filename": os.path.basename(path),
        "xml": xml_doc,
        "rel_map": rel_map,
        "zip_names": names,
    }


def resolve_opc_target(base_dir, target):
    if target.startswith("/"):
        return target.lstrip("/")
    parts = [p for p in base_dir.split("/") if p]
    for segment in target.split("/"):
        if segment in ("", "."):
            continue
        elif segment == "..":
            if parts:
                parts = parts[:-1]
        else:
            parts.append(segment)
    return "/".join(parts)


def export_docx_media(docx_path, rel_map, rids, out_dir):
    result = {}
    if not rids:
        return result
    os.makedirs(out_dir, exist_ok=True)
    zf = zipfile.ZipFile(docx_path, "r")
    names = {n.replace("\\", "/"): n for n in zf.namelist()}
    seen = []
    for rid in rids:
        if rid not in seen:
            seen.append(rid)
    for rid in seen:
        target = rel_map.get(rid)
        if not target:
            continue
        entry_name = resolve_opc_target("word", target)
        real_entry = names.get(entry_name)
        if not real_entry:
            continue
        dest_name = os.path.basename(entry_name)
        dest_path = os.path.join(out_dir, dest_name)
        with zf.open(real_entry) as src, open(dest_path, "wb") as dst:
            shutil.copyfileobj(src, dst)
        result[rid] = dest_path
    return result


# ---------------------------------------------------------------------------
# Modelo de parrafo
# ---------------------------------------------------------------------------

def convert_run_text(run_node):
    parts = []
    for child in run_node:
        tag = child.tag.split("}")[-1]
        if tag == "t":
            parts.append(child.text or "")
        elif tag == "br":
            parts.append("\n")
        elif tag == "tab":
            parts.append("\t")
    return "".join(parts)


def test_run_bold(run_node):
    rpr = run_node.find(f"{W}rPr")
    if rpr is None:
        return False
    b = rpr.find(f"{W}b")
    if b is None:
        return False
    val = b.attrib.get(f"{W}val")
    if val is None:
        return True
    return val not in ("0", "false", "off")


def get_run_highlight_color(run_node):
    rpr = run_node.find(f"{W}rPr")
    if rpr is None:
        return None
    hl = rpr.find(f"{W}highlight")
    if hl is None:
        return None
    return hl.attrib.get(f"{W}val")


class Run:
    __slots__ = ("text", "bold", "highlight")
    def __init__(self, text, bold, highlight):
        self.text = text; self.bold = bold; self.highlight = highlight


class Paragraph:
    __slots__ = ("text", "runs", "num_id", "image_rids")
    def __init__(self, text, runs, num_id, image_rids):
        self.text = text; self.runs = runs; self.num_id = num_id; self.image_rids = image_rids


def get_paragraph_model(p_node):
    ppr = p_node.find(f"{W}pPr")
    num_id = None
    if ppr is not None:
        num_pr = ppr.find(f"{W}numPr")
        if num_pr is not None:
            num_id_node = num_pr.find(f"{W}numId")
            if num_id_node is not None:
                num_id = num_id_node.attrib.get(f"{W}val")

    runs = []
    for run_node in p_node.findall(f"{W}r"):
        runs.append(Run(
            convert_run_text(run_node),
            test_run_bold(run_node),
            get_run_highlight_color(run_node),
        ))

    # blip vive en el namespace DrawingML (a:blip), no en w:, asi que se busca por
    # local-name igual que el local-name() de XPath en el .psm1 original.
    image_rids = []
    for el in p_node.iter():
        if el.tag.split("}")[-1] == "blip":
            embed = el.attrib.get(f"{R}embed")
            if embed:
                image_rids.append(embed)

    text = "".join(r.text for r in runs)
    return Paragraph(text, runs, num_id, image_rids)


def get_document_paragraphs(xml_doc):
    body = xml_doc.find(f"{W}body")
    if body is None:
        return []
    return [get_paragraph_model(p) for p in body.findall(f"{W}p")]


# ---------------------------------------------------------------------------
# Segmentacion en preguntas
# ---------------------------------------------------------------------------

MARKER_RE = re.compile(r"^\s*(\d+)\s*\.\s*(Question|Pregunta)\s*[:.]?\s*$")


class Block:
    def __init__(self, question_number):
        self.question_number = question_number
        self.paragraphs = []


def split_into_question_blocks(paragraphs):
    blocks = []
    current = None
    for p in paragraphs:
        trimmed = p.text.strip()
        m = MARKER_RE.match(trimmed)
        if m:
            if current:
                blocks.append(current)
            current = Block(int(m.group(1)))
            continue
        if current:
            current.paragraphs.append(p)
    if current:
        blocks.append(current)
    return blocks


# ---------------------------------------------------------------------------
# Clasificacion de tema y dificultad
# ---------------------------------------------------------------------------

TOPIC_KEYWORDS = [
    ("JOINS", ["JOIN", "INNER JOIN", "OUTER JOIN", "LEFT JOIN", "RIGHT JOIN", "CARTESIAN", "CROSS JOIN", "SELF JOIN"]),
    ("Subqueries", ["SUBQUERY", "NESTED", "(SELECT", "CORRELATED"]),
    ("GROUP BY", ["GROUP BY", "ROLLUP", "CUBE", "GROUPING SETS"]),
    ("HAVING", ["HAVING"]),
    ("Aggregate Functions", ["SUM(", "AVG(", "COUNT(", "MAX(", "MIN("]),
    ("Analytic Functions", ["OVER (", "OVER(", "PARTITION BY", "RANK(", "DENSE_RANK", "ROW_NUMBER", "LAG(", "LEAD("]),
    ("Set Operators", ["UNION", "INTERSECT", "MINUS"]),
    ("Constraints", ["CONSTRAINT", "PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK (", "NOT NULL", "REFERENCES"]),
    ("Views", ["CREATE VIEW", "CREATE OR REPLACE VIEW"]),
    ("Sequences", ["SEQUENCE", "NEXTVAL", "CURRVAL"]),
    ("Synonyms", ["SYNONYM"]),
    ("Indexes", ["CREATE INDEX", "INDEX"]),
    ("Data Dictionary", ["USER_TABLES", "ALL_TABLES", "DBA_", "USER_TAB_COLUMNS", "DATA DICTIONARY"]),
    ("DDL", ["CREATE TABLE", "ALTER TABLE", "DROP TABLE", "TRUNCATE"]),
    ("DML", ["INSERT INTO", "UPDATE ", "DELETE FROM", "MERGE INTO"]),
    ("Transactions", ["COMMIT", "ROLLBACK", "SAVEPOINT"]),
    ("Privileges", ["GRANT ", "REVOKE ", "PRIVILEGE"]),
    ("Roles", ["ROLE "]),
    ("Date Functions", ["SYSDATE", "TO_DATE", "MONTHS_BETWEEN", "ADD_MONTHS", "LAST_DAY", "NEXT_DAY"]),
    ("Character Functions", ["SUBSTR(", "CONCAT(", "INITCAP(", "UPPER(", "LOWER(", "LPAD(", "RPAD(", "TRIM(", "REPLACE("]),
    ("Numeric Functions", ["ROUND(", "TRUNC(", "MOD(", "CEIL(", "FLOOR(", "POWER("]),
    ("Conversion Functions", ["TO_CHAR(", "TO_NUMBER(", "TO_DATE(", "CAST("]),
    ("NULL Handling", ["NVL(", "NVL2(", "COALESCE(", "NULLIF(", "IS NULL", "IS NOT NULL"]),
    ("Conditional Expressions", ["CASE WHEN", "DECODE("]),
    ("ORDER BY", ["ORDER BY"]),
    ("WHERE", ["WHERE "]),
    ("Functions", ["LENGTH(", "INSTR(", "GREATEST(", "LEAST(", "USERENV(", "SYS_CONTEXT("]),
    ("SELECT", ["SELECT "]),
]


def get_question_topics(full_text):
    # Nota de fidelidad: Sort-Object -Descending en PowerShell, sobre empates de Score,
    # produce el orden INVERSO al de insercion original (confirmado comparando contra el
    # banco ya importado por el .psm1 real: p.ej. con SELECT/NULL Handling/Conversion
    # Functions empatados a score=1, el original devuelve SELECT primero pese a que
    # "SELECT" es la ULTIMA entrada de $script:TopicKeywords). Se replica ordenando los
    # empates por indice original descendente, no por la orden estable de insercion.
    upper = full_text.upper()
    scored = []
    for idx, (topic, kws) in enumerate(TOPIC_KEYWORDS):
        score = sum(1 for kw in kws if kw in upper)
        if score > 0:
            scored.append((topic, score, idx))
    if not scored:
        return ["Otros"]
    scored.sort(key=lambda t: (-t[1], -t[2]))
    return [t for t, _, _ in scored[:5]]


NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}


def get_expected_answer_count(stem_text):
    m = re.search(r"(?i)choose\s+(one|two|three|four|five|\d+)", stem_text)
    if m:
        word = m.group(1).lower()
        return NUMBER_WORDS.get(word, int(word) if word.isdigit() else 1)
    m = re.search(r"(?i)select\s+(one|two|three|four|five|\d+)\s+(option|answer|statement)", stem_text)
    if m:
        word = m.group(1).lower()
        return NUMBER_WORDS.get(word, int(word) if word.isdigit() else 1)
    return 1


def get_initial_difficulty(stem_text, option_texts, expected_answer_count):
    score = 0
    reasons = []
    if len(stem_text) > 400:
        score += 1; reasons.append("enunciado largo")
    if len(option_texts) >= 5:
        score += 1; reasons.append("5+ opciones")
    if expected_answer_count > 1:
        score += 2; reasons.append(f"requiere {expected_answer_count} respuestas (Choose {expected_answer_count})")

    sql_indicators = ["SELECT ", "FROM ", "WHERE ", "JOIN", "GROUP BY", "ORDER BY", "UPDATE ", "DELETE ", "INSERT "]
    combined = (stem_text + " " + " ".join(option_texts)).upper()
    sql_hits = sum(1 for s in sql_indicators if s in combined)
    if sql_hits >= 1:
        score += 1; reasons.append("contiene codigo SQL")
    if sql_hits >= 3:
        score += 1; reasons.append("combina varias clausulas SQL")

    if len(option_texts) >= 2:
        prefix_len = 12
        prefixes = [t[:prefix_len] if len(t) >= prefix_len else t for t in option_texts]
        if len(set(prefixes)) < len(option_texts):
            score += 1; reasons.append("distractores muy similares entre si")

    level = 1 + min(4, score)
    level = max(1, min(5, level))
    return level, "; ".join(reasons)


# ---------------------------------------------------------------------------
# Deteccion de respuestas correctas
# ---------------------------------------------------------------------------

def get_option_signal(option_paragraph):
    total_chars = 0
    highlight_chars = 0
    bold_chars = 0
    for run in option_paragraph.runs:
        length = len(re.sub(r"\s", "", run.text))
        if length == 0:
            continue
        total_chars += length
        if run.highlight and run.highlight.lower() == "yellow":
            highlight_chars += length
        if run.bold:
            bold_chars += length
    highlight_ratio = (highlight_chars / total_chars) if total_chars > 0 else 0
    bold_ratio = (bold_chars / total_chars) if total_chars > 0 else 0
    return {
        "highlight_ratio": highlight_ratio,
        "bold_ratio": bold_ratio,
        "is_highlighted": highlight_ratio >= 0.6,
        "is_bold": bold_ratio >= 0.6,
    }


def resolve_correct_answers(option_signals):
    any_highlight = [i for i, s in enumerate(option_signals) if s["is_highlighted"]]
    if any_highlight:
        method = ["yellow-highlight"]
        any_bold_too = any(s["is_highlighted"] and s["is_bold"] for s in option_signals)
        if any_bold_too:
            method.append("bold")
        return {"correct_indexes": any_highlight, "method": method, "bold_only": False}

    any_bold = [i for i, s in enumerate(option_signals) if s["is_bold"]]
    if any_bold:
        return {"correct_indexes": any_bold, "method": ["bold"], "bold_only": True}

    return {"correct_indexes": [], "method": [], "bold_only": False}


EXPLICIT_MARKER_RE1 = re.compile(r"(?i)^(?:[o•\-]\s*)?respuestas?\s+correctas?\s*[:=]\s*(.+)$")
EXPLICIT_MARKER_RE2 = re.compile(r"(?i)^(?:[o•\-]\s*)?correctas?\s*[:=]\s*(.+)$")


def get_explicit_answer_marker(text):
    t = text.strip()
    m = EXPLICIT_MARKER_RE1.match(t)
    if not m:
        m = EXPLICIT_MARKER_RE2.match(t)
    if not m:
        return None
    raw_value = m.group(1)
    tokens = re.split(r"[,;/]+|\s+y\s+|\s+and\s+", raw_value)
    letters = []
    seen = set()
    for tok in tokens:
        cleaned = re.sub(r"[^A-Za-z]", "", tok)
        if len(cleaned) == 1:
            up = cleaned.upper()
            if up not in seen:
                seen.add(up)
                letters.append(up)
    return letters


def get_content_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def get_normalized_text(text):
    return re.sub(r"\s+", " ", text.strip()).lower()


# ---------------------------------------------------------------------------
# contentBlocks
# ---------------------------------------------------------------------------

def test_looks_like_sql(text):
    trimmed_upper = text.strip().upper()
    starters = ["SELECT ", "INSERT ", "UPDATE ", "DELETE ", "CREATE ", "ALTER ", "DROP ", "MERGE ", "GRANT ", "REVOKE ", "TRUNCATE "]
    for s in starters:
        if trimmed_upper.startswith(s):
            return True
    if re.search(r"SELECT\b.*\bFROM\b", trimmed_upper):
        return True
    unambiguous = ["GROUP BY", "ORDER BY", "INSERT INTO", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "MERGE INTO"]
    for kw in unambiguous:
        if kw in trimmed_upper:
            return True
    return False


def get_stem_content_blocks(stem_paragraphs, exported_image_map):
    blocks = []
    for p in stem_paragraphs:
        text = p.text.strip()
        if len(text) > 0:
            btype = "sql" if test_looks_like_sql(text) else "text"
            blocks.append({"type": btype, "text": text})
        if p.image_rids and exported_image_map:
            for rid in p.image_rids:
                if rid in exported_image_map:
                    blocks.append({
                        "type": "image",
                        "path": exported_image_map[rid],
                        "note": "Captura original del documento (posible tabla/exhibit). No se ha reconstruido como tabla estructurada; ver AUDIT_REPORT.md.",
                    })
    return blocks


LETTER_OPTION_RE = re.compile(r"(?s)^([A-Za-z])[\.\)]\s*(.+)$")


def get_fallback_letter_options(paragraphs):
    non_blank = [p for p in paragraphs if p.text.strip()]
    matched = []
    for p in non_blank:
        t = p.text.strip()
        m = LETTER_OPTION_RE.match(t)
        if m:
            matched.append({"paragraph": p, "letter": m.group(1).upper(), "rest": m.group(2).strip()})
        else:
            matched.append({"paragraph": p, "letter": None, "rest": None})

    tail_count = 0
    for item in reversed(matched):
        if item["letter"]:
            tail_count += 1
        else:
            break
    if tail_count < 2:
        return [], paragraphs

    tail = matched[len(matched) - tail_count:]
    for i, item in enumerate(tail):
        if item["letter"] != chr(65 + i):
            return [], paragraphs

    used_paragraphs = [item["paragraph"] for item in tail]
    remaining = [p for p in paragraphs if p not in used_paragraphs]
    options = [Paragraph(item["rest"], item["paragraph"].runs, "fallback-letter", item["paragraph"].image_rids) for item in tail]
    return options, remaining


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------

def convert_to_question_object(block, source_file, source_position, docx_path, rel_map, media_out_dir):
    stem_paragraphs_raw = [p for p in block.paragraphs if not p.num_id]
    option_paragraphs = [p for p in block.paragraphs if p.num_id and p.text.strip()]

    explicit_letters = []
    found_explicit_marker = False
    stem_paragraphs = []
    for p in stem_paragraphs_raw:
        marker = get_explicit_answer_marker(p.text)
        if marker is not None:
            found_explicit_marker = True
            explicit_letters.extend(marker)
        else:
            stem_paragraphs.append(p)

    used_fallback_options = False
    if not option_paragraphs:
        fb_options, fb_remaining = get_fallback_letter_options(stem_paragraphs)
        if fb_options:
            option_paragraphs = fb_options
            stem_paragraphs = fb_remaining
            used_fallback_options = True

    stem_text = "\n".join(p.text for p in stem_paragraphs).strip()
    option_texts = [p.text.strip() for p in option_paragraphs]

    warnings = []
    letters = [chr(65 + i) for i in range(len(option_texts))]

    option_signals = [get_option_signal(p) for p in option_paragraphs]
    format_resolution = resolve_correct_answers(option_signals)

    expected_count = get_expected_answer_count(stem_text)

    # dedup explicit_letters preserving order (Select-Object -Unique)
    seen_el = []
    for l in explicit_letters:
        if l not in seen_el:
            seen_el.append(l)
    explicit_indexes = sorted(set(letters.index(l) for l in seen_el if l in letters))

    explicit_mismatch = False
    if found_explicit_marker and explicit_indexes:
        format_sorted = sorted(set(format_resolution["correct_indexes"]))
        if format_sorted and format_sorted != explicit_indexes:
            explicit_mismatch = True
        method = ["explicit-marker"] + [m for m in format_resolution["method"] if m != "explicit-marker"]
        # dedup preserving order
        seen_m = []
        for m in method:
            if m not in seen_m:
                seen_m.append(m)
        resolution = {"correct_indexes": explicit_indexes, "method": seen_m, "bold_only": False}
    else:
        resolution = format_resolution

    explicit_marker_unparsed = found_explicit_marker and not explicit_indexes

    correct_letters = [letters[i] for i in sorted(resolution["correct_indexes"])]

    options = []
    for i, text in enumerate(option_texts):
        options.append({"id": letters[i], "text": text, "isCorrect": i in resolution["correct_indexes"]})

    confidence = 0.98
    review_reasons = []

    if not option_texts:
        confidence = 0.05
        review_reasons.append("no se detectaron opciones con formato de lista (posible pregunta basada solo en imagen/exhibit)")
    elif not resolution["correct_indexes"]:
        confidence = 0.05
        review_reasons.append("no se detecto ninguna marca de solucion (ni resaltado amarillo ni negrita)")
    else:
        if used_fallback_options:
            confidence -= 0.15
            review_reasons.append('las opciones no estaban en formato de lista de Word: se reconstruyeron a partir de texto plano "A. "/"B. "...; verificar que la deteccion fue correcta')
        if "explicit-marker" in resolution["method"]:
            if explicit_mismatch:
                confidence -= 0.4
                review_reasons.append("el marcador explicito de respuesta correcta del documento no coincide con el resaltado/negrita detectado; revisar manualmente")
        elif resolution["bold_only"]:
            confidence -= 0.35
            review_reasons.append("la unica senal de solucion es negrita, sin resaltado amarillo (confianza reducida)")
        if len(resolution["correct_indexes"]) != expected_count:
            confidence -= 0.25
            review_reasons.append(f"el enunciado indica {expected_count} respuesta(s) pero se detectaron {len(resolution['correct_indexes'])}")
        if len(option_texts) < 2 or len(option_texts) > 8:
            confidence -= 0.2
            review_reasons.append(f"numero de opciones inusual ({len(option_texts)})")
        if explicit_marker_unparsed:
            confidence -= 0.1
            review_reasons.append("el documento tiene una linea de marcador de respuesta pero no se pudo leer ninguna letra valida de ella")

    image_rids = [rid for p in block.paragraphs for rid in p.image_rids]
    exported = {}
    if image_rids:
        review_reasons.append("la pregunta incluye una imagen (tabla/exhibit); verificar manualmente que el contenido visual es correcto")
        confidence -= 0.1
        if docx_path and rel_map and media_out_dir:
            exported = export_docx_media(docx_path, rel_map, image_rids, media_out_dir)

    content_blocks = get_stem_content_blocks(stem_paragraphs, exported)
    exhibit_images = [b["path"] for b in content_blocks if b["type"] == "image"]
    for opt_para in option_paragraphs:
        for rid in opt_para.image_rids:
            if rid in exported and exported[rid] not in exhibit_images:
                exhibit_images.append(exported[rid])

    confidence = max(0, round(confidence, 2))

    question_type = "single-choice"
    if expected_count > 1:
        question_type = "multiple-choice"
    elif len(option_texts) == 2 and {t.lower() for t in option_texts} == {"true", "false"}:
        question_type = "true-false"
    elif not option_texts:
        question_type = "unclassified"
        warnings.append("sin opciones detectables: posible pregunta de tipo output-prediction/exhibit no representable como opcion multiple")

    topics = get_question_topics(stem_text + " " + " ".join(option_texts))
    difficulty_level, difficulty_rationale = get_initial_difficulty(stem_text, option_texts, expected_count)

    review_status = "validated" if (confidence >= 0.75 and not review_reasons) else "pending_review"

    file_slug = re.sub(r"[^a-zA-Z0-9]+", "-", re.sub(r"\.docx$", "", source_file, flags=re.I)).strip("-").lower()
    qid = f"{file_slug}-q{source_position}"

    normalized_for_hash = get_normalized_text(stem_text) + "||" + "||".join(get_normalized_text(t) for t in option_texts)

    return {
        "id": qid,
        "sourceFile": source_file,
        "sourcePosition": source_position,
        "questionNumber": block.question_number,
        "questionText": stem_text,
        "contentBlocks": content_blocks,
        "options": options,
        "correctAnswers": correct_letters,
        "solutionDetectionMethod": resolution["method"],
        "expectedAnswerCount": expected_count,
        "extractionConfidence": confidence,
        "questionType": question_type,
        "topic": topics[0],
        "topics": topics,
        "initialDifficulty": difficulty_level,
        "dynamicDifficulty": difficulty_level,
        "difficultyRationale": difficulty_rationale,
        "reviewStatus": review_status,
        "reviewReasons": review_reasons,
        "warnings": warnings,
        "exhibitImages": exhibit_images,
        "contentHash": get_content_hash(normalized_for_hash),
        "importedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "duplicateOf": None,
    }


def mark_duplicates(questions):
    seen = {}
    for q in questions:
        if q["contentHash"] in seen:
            q["reviewStatus"] = "duplicate"
            q["duplicateOf"] = seen[q["contentHash"]]
            q["reviewReasons"].append(f"duplicado de '{seen[q['contentHash']]}' (mismo texto normalizado)")
        else:
            seen[q["contentHash"]] = q["id"]
    return questions


def import_exam_docx(path, media_out_dir):
    pkg = open_docx_package(path)
    paragraphs = get_document_paragraphs(pkg["xml"])
    blocks = split_into_question_blocks(paragraphs)

    file_media_dir = None
    if media_out_dir:
        file_slug = re.sub(r"[^a-zA-Z0-9]+", "-", re.sub(r"\.docx$", "", pkg["filename"], flags=re.I)).strip("-").lower()
        file_media_dir = os.path.join(media_out_dir, file_slug)

    questions = []
    pos = 0
    for block in blocks:
        pos += 1
        questions.append(convert_to_question_object(block, pkg["filename"], pos, pkg["path"], pkg["rel_map"], file_media_dir))

    return {"filename": pkg["filename"], "path": pkg["path"], "question_count": len(questions), "questions": questions}


# ---------------------------------------------------------------------------
# Orquestador (equivalente a Import-Exams.ps1)
# ---------------------------------------------------------------------------

def to_web_path(abs_path, project_root):
    full = os.path.abspath(abs_path)
    root_full = os.path.abspath(project_root)
    if full.lower().startswith(root_full.lower()):
        rel = full[len(root_full):].lstrip("/\\")
        return rel.replace("\\", "/")
    return full.replace("\\", "/")


def main():
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    project_root = os.path.abspath(project_root)
    source_dir = None
    for name in os.listdir(project_root):
        if re.match(r"^Ex.menes$", name) and os.path.isdir(os.path.join(project_root, name)):
            source_dir = os.path.join(project_root, name)
            break
    if not source_dir:
        source_dir = os.path.join(project_root, "Examenes")

    out_dir = os.path.join(project_root, "data", "certification-bank")
    raw_dir = os.path.join(out_dir, "raw")
    media_dir = os.path.join(out_dir, "media")
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(media_dir, exist_ok=True)

    previous_hashes = {}
    previous_topics = {}
    previous_bank_path = os.path.join(out_dir, "certification-bank.json")
    if os.path.exists(previous_bank_path):
        try:
            with open(previous_bank_path, encoding="utf-8-sig") as f:
                prev = json.load(f)
            for q in prev:
                previous_hashes[q["id"]] = q["contentHash"]
                if q.get("contentHash") and q.get("topic"):
                    previous_topics[q["id"]] = (q["contentHash"], q["topic"], q["topics"])
        except Exception as e:
            print(f"WARN: no se pudo leer la importacion previa: {e}", file=sys.stderr)

    docx_files = sorted(
        f for f in os.listdir(source_dir)
        if f.lower().endswith(".docx") and not f.startswith("~$")
    )
    print("== Archivos encontrados ==")
    for f in docx_files:
        print(f" - {f}")

    all_questions = []
    file_errors = []
    file_results = []

    for fname in docx_files:
        fpath = os.path.join(source_dir, fname)
        print(f"\n== Procesando {fname} ==")
        try:
            result = import_exam_docx(fpath, media_dir)
            for q in result["questions"]:
                q["exhibitImages"] = [to_web_path(p, project_root) for p in q["exhibitImages"]]
                for block in q["contentBlocks"]:
                    if block["type"] == "image":
                        block["path"] = to_web_path(block["path"], project_root)
            file_results.append(result)
            all_questions.extend(result["questions"])
            print(f" -> {result['question_count']} preguntas detectadas")

            raw_name = re.sub(r"[^a-zA-Z0-9\- ]", "_", fname[:-5]) + ".json"
            raw_path = os.path.join(raw_dir, raw_name)
            with open(raw_path, "w", encoding="utf-8") as f:
                json.dump(result["questions"], f, ensure_ascii=False, indent=2)
        except Exception as e:
            import traceback
            print(f" -> ERROR: {e}")
            traceback.print_exc()
            file_errors.append({"file": fname, "error": str(e)})

    # PowerShell's Sort-Object -Descending no es estable en los empates de "Score" (se
    # confirmo comparando la salida de este puerto contra el banco ya generado por el
    # .psm1 real: mismo contentHash en el 100% de las 424 preguntas previas, pero orden de
    # 'topics' distinto en ~70 con empate). Como topic/topics es una heuristica secundaria
    # (no afecta al contenido ni a la respuesta correcta), para las preguntas YA importadas
    # anteriormente se conserva el topic/topics ya asignado en vez de recalcularlo, para no
    # tocar clasificaciones ya revisadas. Solo se conserva si el contentHash coincide (si el
    # texto cambio de verdad, se recalcula desde cero como cualquier pregunta nueva).
    reused_topics = 0
    for q in all_questions:
        prev = previous_topics.get(q["id"])
        if prev and prev[0] == q["contentHash"]:
            q["topic"], q["topics"] = prev[1], prev[2]
            reused_topics += 1
    if reused_topics:
        print(f"\n(conservado topic/topics de {reused_topics} preguntas sin cambios respecto a la importacion anterior)")

    print("\n== Deteccion de duplicados ==")
    all_questions = mark_duplicates(all_questions)
    dup_count = sum(1 for q in all_questions if q["reviewStatus"] == "duplicate")
    print(f" -> {dup_count} preguntas marcadas como duplicadas")

    new_count = unchanged_count = changed_count = 0
    for q in all_questions:
        if q["id"] not in previous_hashes:
            new_count += 1
        elif previous_hashes[q["id"]] == q["contentHash"]:
            unchanged_count += 1
        else:
            changed_count += 1

    print("\n== Guardando banco combinado ==")
    bank_path = os.path.join(out_dir, "certification-bank.json")
    with open(bank_path, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    print(f" -> {bank_path}")

    with_yellow = sum(1 for q in all_questions if "yellow-highlight" in q["solutionDetectionMethod"])
    with_bold = sum(1 for q in all_questions if "bold" in q["solutionDetectionMethod"])
    with_both = sum(1 for q in all_questions if "yellow-highlight" in q["solutionDetectionMethod"] and "bold" in q["solutionDetectionMethod"])
    multi_answer = sum(1 for q in all_questions if len(q["correctAnswers"]) > 1)
    pending_review = sum(1 for q in all_questions if q["reviewStatus"] == "pending_review")
    no_solution = sum(1 for q in all_questions if len(q["correctAnswers"]) == 0)

    from collections import Counter, OrderedDict
    by_diff = Counter(q["initialDifficulty"] for q in all_questions)
    by_difficulty = [{"level": k, "count": by_diff[k]} for k in sorted(by_diff)]
    by_topic_c = Counter(q["topic"] for q in all_questions)
    by_topic = [{"topic": t, "count": c} for t, c in sorted(by_topic_c.items(), key=lambda kv: -kv[1])]

    no_options = [q["id"] for q in all_questions if not q["options"]]
    no_content_blocks = [q["id"] for q in all_questions if not q["contentBlocks"]]
    missing_images = []
    for q in all_questions:
        for img in q["exhibitImages"]:
            if not os.path.exists(os.path.join(project_root, img)):
                missing_images.append({"id": q["id"], "path": img})
    count_mismatch = [q["id"] for q in all_questions if q["correctAnswers"] and len(q["correctAnswers"]) != q["expectedAnswerCount"]]

    report = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "filesFound": len(docx_files),
        "filesProcessedOk": len(file_results),
        "filesWithErrors": len(file_errors),
        "totalQuestions": len(all_questions),
        "withYellowHighlight": with_yellow,
        "withBold": with_bold,
        "withBothMethods": with_both,
        "multiAnswerQuestions": multi_answer,
        "duplicateQuestions": dup_count,
        "pendingReview": pending_review,
        "withoutSolution": no_solution,
        "newSinceLastImport": new_count,
        "unchangedSinceLastImport": unchanged_count,
        "changedSinceLastImport": changed_count,
        "byDifficulty": by_difficulty,
        "byTopic": by_topic,
        "errors": file_errors,
        "validation": {
            "questionsWithoutOptions": no_options,
            "questionsWithoutContentBlocks": no_content_blocks,
            "missingImages": missing_images,
            "answerCountMismatch": count_mismatch,
        },
    }

    with open(os.path.join(out_dir, "import-report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    md = []
    md.append("# Informe de importacion de examenes Oracle\n")
    md.append(f"Generado: {report['generatedAt']}\n")
    md.append("| Metrica | Valor |")
    md.append("|---|---|")
    md.append(f"| Archivos encontrados | {report['filesFound']} |")
    md.append(f"| Archivos procesados sin error | {report['filesProcessedOk']} |")
    md.append(f"| Archivos con error | {report['filesWithErrors']} |")
    md.append(f"| Total de preguntas | {report['totalQuestions']} |")
    md.append(f"| Con resaltado amarillo | {report['withYellowHighlight']} |")
    md.append(f"| Con negrita | {report['withBold']} |")
    md.append(f"| Con ambos metodos | {report['withBothMethods']} |")
    md.append(f"| Con varias respuestas correctas | {report['multiAnswerQuestions']} |")
    md.append(f"| Duplicadas | {report['duplicateQuestions']} |")
    md.append(f"| Pendientes de revision | {report['pendingReview']} |")
    md.append(f"| Sin solucion detectada | {report['withoutSolution']} |")
    md.append(f"| Nuevas desde la ultima importacion | {report['newSinceLastImport']} |")
    md.append(f"| Sin cambios desde la ultima importacion | {report['unchangedSinceLastImport']} |")
    md.append(f"| Cambiadas desde la ultima importacion | {report['changedSinceLastImport']} |")
    md.append("")
    md.append("## Distribucion por dificultad\n")
    for d in by_difficulty:
        md.append(f"- Nivel {d['level']}: {d['count']} preguntas")
    md.append("")
    md.append("## Distribucion por tema\n")
    for t in by_topic:
        md.append(f"- {t['topic']}: {t['count']} preguntas")
    if file_errors:
        md.append("")
        md.append("## Errores\n")
        for e in file_errors:
            md.append(f"- **{e['file']}**: {e['error']}")
    md.append("")
    md.append("## Validaciones\n")
    md.append(f"- Preguntas sin opciones: {len(no_options)}")
    md.append(f"- Preguntas sin contentBlocks: {len(no_content_blocks)}")
    md.append(f"- Imagenes referenciadas que no existen en disco: {len(missing_images)}")
    md.append(f"- Preguntas donde el numero de respuestas detectadas no coincide con 'Choose N': {len(count_mismatch)}")
    with open(os.path.join(out_dir, "import-report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")

    print("\n== Generando espejos .js ==")
    bank_json = json.dumps(all_questions, ensure_ascii=False, indent=2)
    with open(os.path.join(out_dir, "certification-bank.js"), "w", encoding="utf-8") as f:
        f.write(f"const CERTIFICATION_BANK = {bank_json};\n")

    report_json = json.dumps(report, ensure_ascii=False, indent=2)
    with open(os.path.join(out_dir, "import-report.js"), "w", encoding="utf-8") as f:
        f.write(f"const CERTIFICATION_IMPORT_REPORT = {report_json};\n")

    print("\n== Resumen ==")
    print(f" Preguntas totales:        {report['totalQuestions']}")
    print(f" Con resaltado amarillo:   {report['withYellowHighlight']}")
    print(f" Con negrita:              {report['withBold']}")
    print(f" Con varias respuestas:    {report['multiAnswerQuestions']}")
    print(f" Duplicadas:               {report['duplicateQuestions']}")
    print(f" Pendientes de revision:   {report['pendingReview']}")
    print(f" Sin solucion detectada:   {report['withoutSolution']}")


if __name__ == "__main__":
    main()
