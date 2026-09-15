// Lê o .xlsx/.xls mais recente em data/source/ (export do Sankhya) e gera
// src/data/rnc.json no mesmo formato colunar do relatório HTML original.
// Uso: pnpm importar-rnc
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  RESULTADOS_ORDEM,
  compararCodigosRnc,
  descricaoDoCodigo,
  familiaDoProduto,
} from "../src/domain/rnc-glossario";
import type { RncData, RncRow } from "../src/domain/rnc-tipos";

const SOURCE_DIR = path.join(process.cwd(), "data/source");
const OUTPUT_PATH = path.join(process.cwd(), "src/data/rnc.json");

// Nomes de coluna exatos do export do Sankhya (confirmados no arquivo de
// exemplo "Reclamações jan -Agosto.xls" em data/source/). Se um export
// futuro renomear uma coluna, o script falha alto (erro claro), em vez de
// silenciosamente ignorar a coluna.
const COLUNAS = {
  resultado: "Procedente/Improcedente",
  dataHora: "Data/Hora Chamada",
  nroUnico: "Nro. Único",
  produto: "Descrição (Produto)",
  codigoRnc: "Problema RNC",
  qtd: "Qtd. c/ problema",
} as const;

interface RegistroParcial {
  resultado: string;
  mes: string; // "aaaa-mm"
  data: string; // "dd/mm/aaaa"
  nro: number;
  produto: string;
  codigo: string;
  qtd: number;
  familia: string;
}

function arquivoMaisRecente(): string {
  const arquivos = readdirSync(SOURCE_DIR).filter((f) => /\.xlsx?$/i.test(f));
  if (!arquivos.length) {
    throw new Error(`Nenhum .xlsx/.xls encontrado em ${SOURCE_DIR}`);
  }
  return arquivos
    .map((f) => ({ f, mtime: statSync(path.join(SOURCE_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].f;
}

function indiceColuna(cabecalho: string[], nome: string): number {
  const i = cabecalho.map((h) => h.trim()).indexOf(nome);
  if (i === -1) {
    throw new Error(
      `Coluna "${nome}" não encontrada. Cabeçalho do arquivo: ${cabecalho.join(" | ")}`,
    );
  }
  return i;
}

// Datas do Sankhya vêm como número de série do Excel (dias desde
// 1899-12-30). NÃO usar `cellDates:true` do SheetJS aqui — confirmado nesta
// planilha (.xls legado/BIFF) que ele aplica um deslocamento de +3h na
// conversão, o que só é visível quando o horário cruza a meia-noite (10 dos
// 1.160 registros do arquivo de exemplo mudavam de dia por causa disso,
// achado ao comparar contra o HTML original). Conversão manual do serial —
// fórmula padrão documentada pelo próprio SheetJS — em UTC puro, sem
// depender de fuso horário do ambiente onde o script roda.
function serialParaDataUtc(serial: number): Date {
  const dias = Math.floor(serial - 25569);
  return new Date(dias * 86400 * 1000);
}

function celulaParaDataUtc(valor: unknown): Date {
  if (typeof valor === "number") return serialParaDataUtc(valor);
  if (valor instanceof Date) return valor;
  throw new Error(`Valor de data inesperado (nem serial numérico nem Date): ${JSON.stringify(valor)}`);
}

function formatarData(d: Date): string {
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

function chaveMes(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function lerRegistros(): RegistroParcial[] {
  const arquivo = arquivoMaisRecente();
  console.log(`Lendo ${arquivo}...`);
  const buf = readFileSync(path.join(SOURCE_DIR, arquivo));
  // cellDates:false (padrão) de propósito — ver comentário de
  // serialParaDataUtc acima.
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
  }) as unknown[][];

  const cabecalho = (linhas[0] as unknown[]).map((h) => String(h));
  const cResultado = indiceColuna(cabecalho, COLUNAS.resultado);
  const cData = indiceColuna(cabecalho, COLUNAS.dataHora);
  const cNro = indiceColuna(cabecalho, COLUNAS.nroUnico);
  const cProduto = indiceColuna(cabecalho, COLUNAS.produto);
  const cCodigo = indiceColuna(cabecalho, COLUNAS.codigoRnc);
  const cQtd = indiceColuna(cabecalho, COLUNAS.qtd);

  const registros: RegistroParcial[] = [];
  let excluidasSemNro = 0;

  for (let i = 1; i < linhas.length; i++) {
    const r = linhas[i];
    const nro = r[cNro];
    // A linha de total da planilha (e qualquer linha residual) não tem
    // Nro. Único — mesmo critério de exclusão do relatório original.
    if (nro === "" || nro === undefined || nro === null) {
      excluidasSemNro++;
      continue;
    }
    let dataCelula: Date;
    try {
      dataCelula = celulaParaDataUtc(r[cData]);
    } catch (e) {
      throw new Error(
        `Linha ${i + 1} (nro ${nro}): "${COLUNAS.dataHora}" inválida — ${(e as Error).message}`,
      );
    }
    const produto = String(r[cProduto]).trim();
    const resultadoBruto = String(r[cResultado]).trim();
    const resultado = resultadoBruto === "" ? "Não classificado" : resultadoBruto;
    if (!(RESULTADOS_ORDEM as readonly string[]).includes(resultado)) {
      throw new Error(
        `Linha ${i + 1} (nro ${nro}): resultado "${resultado}" fora do conjunto conhecido ` +
          `(${RESULTADOS_ORDEM.join(", ")}). Se o Sankhya passou a usar um valor novo, ` +
          `atualizar RESULTADOS_ORDEM em src/domain/rnc-glossario.ts.`,
      );
    }
    const codigoBruto = r[cCodigo];
    const codigo =
      codigoBruto === "" || codigoBruto === undefined || codigoBruto === null
        ? "S/C"
        : String(codigoBruto).trim();

    registros.push({
      resultado,
      mes: chaveMes(dataCelula),
      data: formatarData(dataCelula),
      nro: Number(nro),
      produto,
      codigo,
      qtd: Number(r[cQtd]) || 0,
      familia: familiaDoProduto(produto),
    });
  }

  console.log(
    `${registros.length} registro(s) válido(s), ${excluidasSemNro} linha(s) sem Nro. Único ` +
      `ignorada(s) (linha de total, normalmente).`,
  );
  return registros;
}

function montarData(registros: RegistroParcial[]): RncData {
  const prods = [...new Set(registros.map((r) => r.produto))].sort();
  const fams = [...new Set(registros.map((r) => r.familia))].sort();
  const rncs = [...new Set(registros.map((r) => r.codigo))].sort(compararCodigosRnc);
  const rncdesc = rncs.map(descricaoDoCodigo);
  const ress: string[] = [...RESULTADOS_ORDEM];
  const meses = [...new Set(registros.map((r) => r.mes))].sort();

  const rows: RncRow[] = registros.map((r) => [
    ress.indexOf(r.resultado),
    meses.indexOf(r.mes),
    r.data,
    r.nro,
    prods.indexOf(r.produto),
    rncs.indexOf(r.codigo),
    r.qtd,
    fams.indexOf(r.familia),
  ]);

  return { prods, fams, rncs, rncdesc, ress, meses, rows };
}

function main() {
  const registros = lerRegistros();
  const data = montarData(registros);
  writeFileSync(OUTPUT_PATH, JSON.stringify(data));
  console.log(
    `Gravado em ${OUTPUT_PATH} — ${data.rows.length} registros, ${data.prods.length} produtos, ` +
      `${data.rncs.length} motivos de RNC, ${data.meses.length} meses (${data.meses[0]} a ${data.meses.at(-1)}).`,
  );
}

main();
