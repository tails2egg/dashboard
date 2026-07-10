#!/usr/bin/env python3
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

CELL_REF = re.compile(r"([A-Z]+)([0-9]+)")


def column_index(cell_ref):
    letters = CELL_REF.match(cell_ref).group(1)
    index = 0
    for char in letters:
        index = index * 26 + ord(char) - 64
    return index - 1


def cell_value(cell, shared_strings):
    inline = cell.find("a:is/a:t", NS)
    if inline is not None:
        return inline.text or ""

    value = cell.find("a:v", NS)
    text = "" if value is None else value.text or ""

    if cell.attrib.get("t") == "s" and text:
        return shared_strings[int(text)]

    return text


def read_sheet(zip_file, path, shared_strings):
    root = ET.fromstring(zip_file.read(path))
    rows = []

    for row in root.findall(".//a:sheetData/a:row", NS):
        values = []
        for cell in row.findall("a:c", NS):
            index = column_index(cell.attrib["r"])
            while len(values) <= index:
                values.append("")
            values[index] = cell_value(cell, shared_strings)
        rows.append(values)

    return rows


def normalize_records(rows):
    if not rows:
        return []

    headers = [str(header).strip() for header in rows[0]]
    records = []

    for row in rows[1:]:
        record = {
            headers[index]: (row[index] if index < len(row) else "")
            for index in range(len(headers))
            if headers[index]
        }
        if any(str(value).strip() for value in record.values()):
            records.append(record)

    return records


def workbook_to_json(source):
    with zipfile.ZipFile(source) as zip_file:
        names = zip_file.namelist()
        shared_strings = []

        if "xl/sharedStrings.xml" in names:
            root = ET.fromstring(zip_file.read("xl/sharedStrings.xml"))
            for item in root.findall("a:si", NS):
                shared_strings.append(
                    "".join(text.text or "" for text in item.findall(".//a:t", NS))
                )

        workbook = ET.fromstring(zip_file.read("xl/workbook.xml"))
        relations = ET.fromstring(zip_file.read("xl/_rels/workbook.xml.rels"))
        relation_paths = {
            relation.attrib["Id"]: relation.attrib["Target"] for relation in relations
        }

        sheets = {}
        for sheet in workbook.find("a:sheets", NS):
            name = sheet.attrib["name"]
            relation_id = sheet.attrib[
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
            ]
            target = relation_paths[relation_id]
            if not target.startswith("xl/"):
                target = f"xl/{target}"

            rows = read_sheet(zip_file, target, shared_strings)
            if name == "Dashboard":
                sheets[name] = rows
            else:
                sheets[name] = normalize_records(rows)

        return sheets


def main():
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "sample_data.xlsx")
    output = Path(sys.argv[2] if len(sys.argv) > 2 else "dashboard-data.js")
    data = workbook_to_json(source)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    output.write_text(f"window.DASHBOARD_DATA = {payload};\n", encoding="utf-8")
    print(f"Wrote {output} from {source}")


if __name__ == "__main__":
    main()
