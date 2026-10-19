"""Three columns out of the already built drivers workbook: name, phone, Telegram link. Rows without a contact are dropped.
Usage: rida_uch_ustun.py <drivers xlsx> <three-column xlsx>"""
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

from rida_xlsx import write

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
HEAD = ["Имя", "Телефон", "Telegram"]
WIDTHS = [28, 32, 36]


def sheet_rows(path):
    """Every row as {column letter: text}, whatever the cell type (inline string, formula result, number)."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    for row in root.iterfind(".//m:sheetData/m:row", NS):
        cells = {}
        for c in row.iterfind("m:c", NS):
            letter = re.match(r"[A-Z]+", c.get("r")).group(0)
            t = c.find("m:is/m:t", NS)
            v = c.find("m:v", NS)
            cells[letter] = (t.text if t is not None else v.text if v is not None else "") or ""
        yield cells


def main():
    out = []
    for i, r in enumerate(sheet_rows(sys.argv[1])):
        if i == 0:
            continue  # header
        phone, by_phone, by_id = r.get("B", ""), r.get("C", ""), r.get("E", "")
        label = by_id or by_phone
        if not (phone or label):
            continue
        out.append([r.get("A", ""), phone, (f"https://{label}", label) if label else ""])
    write(sys.argv[2], [("Haydovchilar", HEAD, WIDTHS, out)])
    print(f"строк: {len(out)}, с номером: {sum(1 for r in out if r[1])}, только Telegram: {sum(1 for r in out if not r[1])}")


if __name__ == "__main__":
    main()
