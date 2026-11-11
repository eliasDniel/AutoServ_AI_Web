function escapar(valor: string | number) {
  const texto = String(valor ?? '');
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function aCsv(headers: string[], rows: (string | number)[][]) {
  const lineas = [
    headers.map(escapar).join(','),
    ...rows.map((row) => row.map(escapar).join(',')),
  ];
  return `\uFEFF${lineas.join('\n')}`;
}

export function descargarCsv(nombre: string, contenido: string) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

function partirLinea(linea: string): string[] {
  const out: string[] = [];
  let actual = '';
  let enComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const ch = linea[i];
    if (enComillas) {
      if (ch === '"' && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else if (ch === '"') {
        enComillas = false;
      } else {
        actual += ch;
      }
      continue;
    }
    if (ch === '"') {
      enComillas = true;
    } else if (ch === ',') {
      out.push(actual.trim());
      actual = '';
    } else {
      actual += ch;
    }
  }
  out.push(actual.trim());
  return out;
}

export function parsearCsv(texto: string): Record<string, string>[] {
  const limpio = texto.replace(/^\uFEFF/, '').trim();
  if (!limpio) return [];
  const lineas = limpio.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return [];
  const headers = partirLinea(lineas[0]).map((h) => h.trim().toLowerCase());
  return lineas.slice(1).map((linea) => {
    const cols = partirLinea(linea);
    const fila: Record<string, string> = {};
    headers.forEach((h, i) => {
      fila[h] = (cols[i] ?? '').trim();
    });
    return fila;
  });
}
