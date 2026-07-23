export function Scanlines() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        maxWidth: 430,
        margin: '0 auto',
        pointerEvents: 'none',
        zIndex: 60,
        background:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.22) 3px, rgba(0,0,0,0) 4px)',
        opacity: 0.5,
        mixBlendMode: 'multiply',
      }}
    />
  );
}
