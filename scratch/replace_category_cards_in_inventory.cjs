const fs = require('fs');

const file = 'C:\\Users\\sutha\\OneDrive\\Desktop\\kp pakse pos\\src\\components\\Inventory.jsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Inject CategoryIcons and getCategoryIconSvg near importAnchor
  const importAnchor = "import AmuletImageEditor from './AmuletImageEditor';";
  const categoryIconDefs = `
const CategoryIcons = {
  amulet_frames: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
  ),
  necklaces: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M6 10a8 8 0 0 0 12 0"/><path d="M12 18v4"/><circle cx="12" cy="18" r="2"/></svg>
  ),
  services: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  gold: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  default: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  )
};

function getCategoryIconSvg(catId, catIcon) {
  if (catId === 'amulet_frames' || catIcon === '🪙') {
    return <CategoryIcons.amulet_frames />;
  }
  if (catId === 'necklaces' || catIcon === '⛓️') {
    return <CategoryIcons.necklaces />;
  }
  if (catId === 'services' || catIcon === '🛠️') {
    return <CategoryIcons.services />;
  }
  if (catId === 'cat_1783182208187' || catIcon === '👑') {
    return <CategoryIcons.gold />;
  }
  if (catIcon && (catIcon.startsWith('http') || catIcon.startsWith('data:image/'))) {
    return <img src={catIcon} style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '3px' }} alt="" />;
  }
  return <CategoryIcons.default />;
}
`;

  if (!content.includes('CategoryIcons')) {
    content = content.replace(importAnchor, importAnchor + categoryIconDefs);
    console.log("✅ CategoryIcons injected!");
  }

  // 2. Locate and replace Shop Stock category icon render block
  // We look for:
  // {cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
  //   <img src={cat.icon} style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '3px' }} alt="" />
  // ) : (
  //   <span style={{ fontSize: '1rem' }}>{cat.icon || '📦'}</span>
  // )}
  // <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.name}</span>
  
  const shopIconSearch = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
                        <img src={cat.icon} style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '3px' }} alt="" />
                      ) : (
                        <span style={{ fontSize: '1rem' }}>{cat.icon || '📦'}</span>
                      )}
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.name}</span>
                    </div>`;
                    
  const shopIconReplace = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: selectedCatFilter === cat.id ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                      {getCategoryIconSvg(cat.id, cat.icon)}
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', lineHeight: 1.3 }}>{cat.name}</span>
                    </div>`;

  if (content.includes(shopIconSearch)) {
    content = content.replace(shopIconSearch, shopIconReplace);
    console.log("✅ Shop Category icons replaced!");
  } else {
    console.log("❌ Shop Category icons block not found.");
  }

  // 3. Locate and replace Warehouse category icon render block
  const whIconSearch = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {cat.icon && (cat.icon.startsWith('data:image/') || cat.icon.startsWith('http')) ? (
                        <img src={cat.icon} style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '3px' }} alt="" />
                      ) : (
                        <span style={{ fontSize: '1rem' }}>{cat.icon || '📦'}</span>
                      )}
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.name}</span>
                    </div>`;

  const whIconReplace = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: selectedWarehouseCatFilter === cat.id ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                      {getCategoryIconSvg(cat.id, cat.icon)}
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', lineHeight: 1.3 }}>{cat.name}</span>
                    </div>`;

  // Since we replaced the shop one, if we search for the exact same string again, it will find the warehouse one!
  if (content.includes(whIconSearch)) {
    content = content.replace(whIconSearch, whIconReplace);
    console.log("✅ Warehouse Category icons replaced!");
  } else {
    console.log("❌ Warehouse Category icons block not found.");
  }

  fs.writeFileSync(file, content, 'utf8');
}
