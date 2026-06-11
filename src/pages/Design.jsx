import { useState } from 'react';
import { PageShell, Section, ToggleRow, Btn, FieldLabel, Select } from '../components/ui';
import { getDesign, saveDesign, getTemplate, saveTemplate } from '../store';

const FONTS = ['Helvetica Neue', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Garamond'];
const LAYOUTS = ['One article per page', 'Two column', 'Newspaper grid', 'Full bleed'];
const PAPER_SIZES = ['A4', 'Letter', 'A5', 'Tabloid'];

const TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Full contrast. Bold black headers, solid rules, maximum legibility.',
    ink: 'High ink',
    preview: { headerBg: '#000', headerFg: '#fff', bodyFg: '#222', rule: '#000', border: '2px solid #000' },
  },
  {
    id: 'eco',
    name: 'Eco',
    description: 'Minimum ink. Light greys, thin rules, no filled areas. Uses Ecofont Vera Sans — small holes in each character save ~20% ink.',
    ink: 'Low ink ♻',
    preview: { headerBg: '#fff', headerFg: '#333', bodyFg: '#555', rule: '#ccc', border: '1px solid #ccc' },
  },
];

export default function Design() {
  const [template, setTemplate] = useState(getTemplate);
  const [design, setDesign] = useState(getDesign);

  function update(key, value) {
    setDesign(d => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    saveTemplate(template);
    saveDesign(design);
  }

  // When a template is selected, snap design values to its defaults
  function selectTemplate(id) {
    setTemplate(id);
    if (id === 'eco') {
      setDesign(d => ({ ...d, paper: '#ffffff', ink: '#333333', accent: '#999999', bodyFont: 'Courier New' }));
    } else {
      setDesign(d => ({ ...d, paper: '#ffffff', ink: '#111111', accent: '#888888', bodyFont: 'Georgia' }));
    }
  }

  return (
    <PageShell
      title="Design"
      sub="Visual style and output settings for all digests"
      actions={<Btn primary confirm onClick={handleSave}>Save</Btn>}
    >
      {/* Templates */}
      <Section label="Templates">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {TEMPLATES.map(tmpl => {
            const isActive = template === tmpl.id;
            const p = tmpl.preview;
            return (
              <div key={tmpl.id} onClick={() => selectTemplate(tmpl.id)} style={{
                border: isActive ? '2px solid var(--black)' : '1px solid var(--grey-rule)',
                cursor: 'pointer', transition: 'border 0.1s',
                background: isActive ? 'var(--grey-bg)' : 'var(--white)',
              }}>
                {/* Mini preview */}
                <div style={{ borderBottom: isActive ? '2px solid var(--black)' : '1px solid var(--grey-rule)', padding: 12 }}>
                  <div style={{ background: p.headerBg, color: p.headerFg, padding: '5px 8px', marginBottom: 8, fontFamily: 'var(--font-sign)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: p.border }}>
                    The Weekend Digest
                  </div>
                  <div style={{ borderTop: p.border, paddingTop: 6, marginBottom: 6 }}>
                    <div style={{ fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: p.bodyFg, letterSpacing: '-0.01em', lineHeight: 1 }}>Article Title</div>
                  </div>
                  {[100, 90, 95, 85].map((w, i) => (
                    <div key={i} style={{ height: 2, background: '#ddd', marginBottom: 3, width: `${w}%` }} />
                  ))}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isActive ? 'var(--black)' : 'var(--grey-mid)' }}>
                      {tmpl.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: tmpl.id === 'eco' ? '#2a7a4a' : 'var(--grey-light)', letterSpacing: '0.08em' }}>
                      {tmpl.ink}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--grey-mid)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
                    {tmpl.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Colour */}
      <Section label="Colour">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Paper', key: 'paper' },
            { label: 'Ink', key: 'ink' },
            { label: 'Accent', key: 'accent' },
          ].map(({ label, key }) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--grey-rule)', background: 'var(--white)' }}>
                <input type="color" value={design[key]} onChange={e => update(key, e.target.value)}
                  style={{ width: 20, height: 20, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--grey-mid)', letterSpacing: '0.06em' }}>{design[key]}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section label="Typography">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <FieldLabel>Display font</FieldLabel>
            <Select value={design.displayFont} onChange={e => update('displayFont', e.target.value)}>
              {FONTS.map(f => <option key={f}>{f}</option>)}
            </Select>
            <div style={{ marginTop: 10, fontFamily: design.displayFont, fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
              The Weekend Digest
            </div>
          </div>
          <div>
            <FieldLabel>Body font</FieldLabel>
            <Select value={design.bodyFont} onChange={e => update('bodyFont', e.target.value)}>
              {FONTS.map(f => <option key={f}>{f}</option>)}
            </Select>
            <div style={{ marginTop: 10, fontFamily: design.bodyFont, fontSize: 13, lineHeight: 1.65, color: 'var(--grey-heavy)' }}>
              The quick brown fox jumps over the lazy dog.
            </div>
          </div>
        </div>
      </Section>

      {/* Layout */}
      <Section label="Layout">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {LAYOUTS.map(l => (
            <div key={l} onClick={() => update('layout', l)} style={{
              padding: '10px 12px',
              border: `2px solid ${design.layout === l ? 'var(--black)' : 'var(--grey-rule)'}`,
              cursor: 'pointer',
              fontFamily: 'var(--font-sign)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: design.layout === l ? 'var(--black)' : 'var(--grey-light)',
              background: design.layout === l ? 'var(--grey-bg)' : 'var(--white)',
              transition: 'all 0.1s',
            }}>
              {l}
            </div>
          ))}
        </div>
      </Section>

      {/* Output */}
      <Section label="Output">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <FieldLabel>Paper size</FieldLabel>
            <Select value={design.paperSize} onChange={e => update('paperSize', e.target.value)}>
              {PAPER_SIZES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel>Orientation</FieldLabel>
            <Select value={design.orientation} onChange={e => update('orientation', e.target.value)}>
              <option>Portrait</option><option>Landscape</option>
            </Select>
          </div>
        </div>
        <ToggleRow label="Cover page" on={design.coverPage} onChange={v => update('coverPage', v)} />
        <ToggleRow label="Images" sub="Pull images from newsletter content" on={design.images} onChange={v => update('images', v)} />
        <ToggleRow label="Page numbers" on={design.pageNums} onChange={v => update('pageNums', v)} last />
      </Section>

      {/* Live preview — reflects current settings */}
      <Section label="Preview">
        <div style={{ background: design.paper, border: '1px solid var(--grey-rule)', padding: 24, minHeight: 180 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: design.accent, marginBottom: 10 }}>
            The Weekend Digest · Carta
          </div>
          <div style={{ fontFamily: design.displayFont, fontSize: 28, fontWeight: 700, color: design.ink, lineHeight: 1.05, marginBottom: 10 }}>
            AI's aesthetics of failure
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: design.accent, marginBottom: 14 }}>
            Brian Merchant · Blood in the Machine · March 27
          </div>
          <p style={{ fontFamily: design.bodyFont, fontSize: 13, lineHeight: 1.75, color: design.ink, opacity: 0.75 }}>
            One of the great ironies of the AI age is that it wound up looking like such shit. Even its biggest boosters have been forced to disavow the chief aesthetic sensibility of their technology.
          </p>
        </div>
      </Section>
    </PageShell>
  );
}
