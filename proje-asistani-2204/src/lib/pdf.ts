/** Tarayıcıda PDF/TXT dosyasından sayfa sayfa metin çıkarır. Dosya hiçbir sunucuya gönderilmez. */

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number;
      getPage(n: number): Promise<{ getTextContent(): Promise<{ items: { str?: string; hasEOL?: boolean }[] }> }>;
      getMetadata(): Promise<{ info?: Record<string, unknown> }>;
    }>;
  };
};

let loading: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  const w = globalThis as unknown as { pdfjsLib?: PdfJs };
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (!loading) {
    loading = new Promise<PdfJs>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFJS;
      s.onload = () => {
        const lib = (globalThis as unknown as { pdfjsLib?: PdfJs }).pdfjsLib;
        if (!lib) return reject(new Error('PDF okuyucu yüklenemedi.'));
        lib.GlobalWorkerOptions.workerSrc = WORKER;
        resolve(lib);
      };
      s.onerror = () => {
        loading = null;
        reject(new Error('PDF okuyucu indirilemedi. İnternet bağlantınızı kontrol edin.'));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export interface ExtractedDoc {
  name: string;
  pages: string[];
  metaTitle: string;
  metaAuthor: string;
}

export async function extractFile(file: File): Promise<ExtractedDoc> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.txt')) {
    const text = await file.text();
    // Metni yaklaşık 3000 karakterlik sanal sayfalara böl
    const pages: string[] = [];
    for (let i = 0; i < text.length; i += 3000) pages.push(text.slice(i, i + 3000));
    return { name: file.name, pages, metaTitle: '', metaAuthor: '' };
  }
  if (!lower.endsWith('.pdf')) throw new Error('Yalnızca PDF veya TXT dosyaları desteklenir.');
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    let text = '';
    for (const it of content.items) text += (it.str ?? '') + (it.hasEOL ? '\n' : ' ');
    pages.push(text.replace(/[ \t]+/g, ' ').trim());
  }
  const info = (await doc.getMetadata().catch(() => null))?.info ?? {};
  const total = pages.reduce((n, p) => n + p.length, 0);
  if (total < 200) throw new Error('Bu PDF\'den metin okunamadı (taranmış görüntü olabilir). Metni seçilebilen bir PDF kullanın.');
  return {
    name: file.name,
    pages,
    metaTitle: typeof info.Title === 'string' ? info.Title : '',
    metaAuthor: typeof info.Author === 'string' ? info.Author : '',
  };
}
