import { useState } from 'react';
import { Section, Field, Input, ToggleRow, Btn, PageShell, Tag } from '../components/ui';

export default function General() {
  const [label, setLabel] = useState('Carta');
  const [autoFetch, setAutoFetch] = useState(true);

  return (
    <PageShell
      title="General"
      sub="Core settings and Gmail connection"
      actions={
        <>
          <Btn>Discard</Btn>
          <Btn primary>Save changes</Btn>
        </>
      }
    >
      <Section title="Gmail" action={<Tag>Connected</Tag>}>
        <Field label="Gmail label to watch">
          <Input value={label} onChange={e => setLabel(e.target.value)} />
        </Field>
        <ToggleRow
          label="Auto-fetch on schedule"
          sub="Fetch automatically when trigger conditions are met"
          on={autoFetch}
          onChange={setAutoFetch}
        />
      </Section>

      <Section title="Trigger" action="Edit →">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f9f9f9', border: '1px solid #ebebeb', borderRadius: 3, fontSize: 12, color: '#999', flexWrap: 'wrap' }}>
          Fetch when <strong style={{ color: '#333', fontWeight: 500 }}>10 newsletters</strong> accumulate
          <span style={{ color: '#ddd' }}>—</span>
          or after <strong style={{ color: '#333', fontWeight: 500 }}>7 days</strong>, whichever comes first
        </div>
      </Section>

      <Section title="Sources" action="Manage →">
        {[
          { name: 'Sour Milk', author: 'Peter Maguire', count: 23 },
          { name: 'Blood in the Machine', author: 'Brian Merchant', count: 61 },
          { name: 'Good News', author: 'Mike Monteiro', count: 44 },
          { name: 'Trespassers on the Dragon Moon', author: 'Robin Sloan', count: 16 },
        ].map((src, i) => (
          <ToggleRow key={i} label={src.name} sub={`${src.author} · ${src.count} issues`} on={true} onChange={() => {}} />
        ))}
      </Section>

      <Section title="Design" action="Open editor →">
        <div style={{ height: 72, background: '#f9f9f9', border: '1px solid #ebebeb', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, cursor: 'pointer' }}>
          {[['#fff', 'Paper'], ['#111', 'Ink'], ['#888', 'Accent']].map(([color, lbl]) => (
            <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 24, height: 24, borderRadius: 2, background: color, border: '1px solid #e0e0e0' }} />
              <span style={{ fontSize: 9, color: '#ccc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{lbl}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 32, background: '#e8e8e8' }} />
          {[['Aa', 18, 600, 'Display'], ['Aa', 13, 400, 'Body']].map(([text, size, weight, lbl]) => (
            <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: size, fontWeight: weight, color: '#111', letterSpacing: '-0.02em' }}>{text}</span>
              <span style={{ fontSize: 9, color: '#ccc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{lbl}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Output">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <Field label="Paper size">
            <select style={{ fontSize: 12, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 3, color: '#111', padding: '7px 10px', outline: 'none' }}>
              <option>A4</option><option>Letter</option><option>A5</option>
            </select>
          </Field>
          <Field label="Orientation">
            <select style={{ fontSize: 12, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 3, color: '#111', padding: '7px 10px', outline: 'none' }}>
              <option>Portrait</option><option>Landscape</option>
            </select>
          </Field>
        </div>
        <ToggleRow label="Include cover page" on={true} onChange={() => {}} />
        <ToggleRow label="Include images" sub="Pull images from newsletter content" on={true} onChange={() => {}} />
      </Section>
    </PageShell>
  );
}
