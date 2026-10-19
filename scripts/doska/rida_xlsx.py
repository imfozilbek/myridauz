"""Minimal .xlsx writer (standard library only): several sheets, bold header, frozen first row, links."""
import re
import zipfile
from xml.sax.saxutils import escape

NS = "http://schemas.openxmlformats.org"
BAD_XML = re.compile(r"[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\U00010000-\U0010FFFF]")


def col(i):
    s = ""
    while i >= 0:
        s, i = chr(65 + i % 26) + s, i // 26 - 1
    return s


def cell(ref, v, bold=False):
    if v is None or v == "":
        return ""
    if isinstance(v, bool):
        v = "да" if v else ""
        if not v:
            return ""
    if isinstance(v, (int, float)):
        return f'<c r="{ref}"><v>{v}</v></c>'
    if isinstance(v, tuple):  # (url, label): a link that shows its own address
        url, label = (escape(x).replace('"', "&quot;") for x in v)
        return f'<c r="{ref}" t="str"><f>HYPERLINK("{url}","{label}")</f><v>{label}</v></c>'
    if isinstance(v, str) and v.startswith("https://"):
        url = escape(v).replace('"', "&quot;")
        return f'<c r="{ref}" t="str"><f>HYPERLINK("{url}","открыть")</f><v>открыть</v></c>'
    s = ' s="1"' if bold else ""
    return f'<c r="{ref}" t="inlineStr"{s}><is><t xml:space="preserve">{escape(BAD_XML.sub("", str(v)))}</t></is></c>'


def sheet_xml(head, widths, rows):
    cols = "".join(f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>' for i, w in enumerate(widths, 1))
    body = "".join(f'<row r="{r}">' + "".join(cell(f"{col(c)}{r}", v, r == 1) for c, v in enumerate(row)) + "</row>"
                   for r, row in enumerate([head] + rows, 1))
    pane = '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews>'
    return (f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="{NS}/spreadsheetml/2006/main">'
            f"{pane}<cols>{cols}</cols><sheetData>{body}</sheetData></worksheet>")


def write(path, sheets):
    """sheets: list of (name, head, widths, rows)."""
    n = len(sheets)
    ct = "".join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1, n + 1))
    rels = "".join(f'<Relationship Id="rId{i}" Type="{NS}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1, n + 1))
    names = "".join(f'<sheet name="{escape(s[0])}" sheetId="{i}" r:id="rId{i}"/>' for i, s in enumerate(sheets, 1))
    styles = ('<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
              '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
              '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
              '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
              '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
              '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
              '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>')
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", f'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="{NS}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>{ct}</Types>')
        z.writestr("_rels/.rels", f'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="{NS}/package/2006/relationships"><Relationship Id="rId1" Type="{NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr("xl/workbook.xml", f'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="{NS}/spreadsheetml/2006/main" xmlns:r="{NS}/officeDocument/2006/relationships"><sheets>{names}</sheets></workbook>')
        z.writestr("xl/_rels/workbook.xml.rels", f'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="{NS}/package/2006/relationships">{rels}<Relationship Id="rId999" Type="{NS}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr("xl/styles.xml", f'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="{NS}/spreadsheetml/2006/main">{styles}</styleSheet>')
        for i, (_, head, widths, rows) in enumerate(sheets, 1):
            z.writestr(f"xl/worksheets/sheet{i}.xml", sheet_xml(head, widths, rows))
