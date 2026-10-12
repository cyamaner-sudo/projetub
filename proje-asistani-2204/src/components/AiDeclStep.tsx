import type { Issue, ProjectState } from '../types.ts';
import { Card, Field, inputCls } from '../ui.tsx';
import { Checks } from './SectionEditor.tsx';

interface Props {
  project: ProjectState;
  issues: Issue[];
  update: (f: (p: ProjectState) => ProjectState) => void;
}

const FIELDS: { key: 'tools' | 'purpose' | 'scope' | 'human'; label: string; help: string; example: string }[] = [
  { key: 'tools', label: 'Kullanılan araçlar', help: 'Aracın adı, versiyonu ve erişim tarihi.', example: 'Gemini, Flash, Ekim 2026' },
  { key: 'purpose', label: 'Kullanım amacı', help: 'Aracın ne için kullanıldığı.', example: 'İngilizce çeviri, literatür taraması, hesaplama işlemleri vb.' },
  { key: 'scope', label: 'Kullanım kapsamı', help: 'Hangi bölümlerde, ne ölçüde destek alındığı.', example: 'Yöntem bölümünde literatür taraması amacıyla' },
  { key: 'human', label: 'İnsan müdahalesi', help: 'Çıktı üzerinde yapılan değişiklikler ve doğrulama.', example: 'Çıktıların %50’si düzenlenmiş, tüm kaynaklar bağımsız olarak doğrulanmıştır' },
];

export default function AiDeclStep({ project, issues, update }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Yapay Zeka Araçları Kullanım Beyanı</h2>
        <p className="text-sm text-slate-600">
          Proje kapsamında üretken yapay zekâ (ÜYZ) araçları kullandıysanız dört başlığa da açıklama yazmanız gerekir. Kullanmadıysanız bu bölümü boş bırakın, raporda yer almaz.
        </p>
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <textarea
              id={`aidecl-${f.key}`}
              className={inputCls}
              rows={2}
              value={project.aiDecl[f.key]}
              onChange={(e) => update((p) => ({ ...p, aiDecl: { ...p.aiDecl, [f.key]: e.target.value } }))}
              placeholder={`Örnek: ${f.example}`}
            />
            <span className="mt-0.5 block text-xs text-slate-500">{f.help}</span>
          </Field>
        ))}
      </div>
      <aside className="space-y-3">
        <Checks issues={issues} step="aidecl" />
        <Card title="Rehber">
          <p className="text-xs text-slate-600">
            Beyan dürüst ve ayrıntılı olmalı. Asistanın taslak özelliğini kullandıysanız kullanım amacını ve kapsamını yazın; çıktıyı hangi bölümlerde, ne kadar değiştirdiğinizi ve kaynakları kendiniz doğruladığınızı belirtin.
          </p>
        </Card>
      </aside>
    </div>
  );
}
