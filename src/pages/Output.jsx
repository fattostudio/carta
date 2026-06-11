import { useState } from 'react';
import { Section, Btn, PageShell, ToggleRow } from '../components/ui';

export default function Output() {
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState('Portrait');
  const [cover, setCover] = useState(true);
  const [images, setImages] = useState(true);
  const [pageNumbers, setPageNumbers] = useState(true);

  return (
    <PageShell
      title="Output"
      sub="Print and export settings"
      actions={
        <>
          <Btn>Discard</Btn>
          <Btn primary>Save changes</Btn>
        </>
      }
    >
      <Section title="Page setup">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: '#999' }}>Paper size</label>
            <select value={paperSize} onChange={e => setPaperSize(e.target.value)}
              style={{ fontSize: 12, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 3, color: '#111', padding: '7px 10px', outline: 'none' }}>
              <option>A4</option><option>Letter</option><option>A5</option><option>Tabloid</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: '#999' }}>Orientation</label>
            <select value={orientation} onChange={e => setOrientation(e.target.value)}
              style={{ fontSize: 12, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 3, color: '#111', padding: '7px 10px', outline: 'none' }}>
              <option>Portrait</option><option>Landscape</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Content">
        <ToggleRow label="Include cover page" on={cover} onChange={setCover} />
        <ToggleRow label="Include images" sub="Pull images from newsletter content" on={images} onChange={setImages} />
        <ToggleRow label="Page numbers" on={pageNumbers} onChange={setPageNumbers} />
      </Section>
    </PageShell>
  );
}
