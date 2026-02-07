import { useRef, useEffect, useState } from 'react';

export default function ReceiptIframe({ html, width = '300px' }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    // Reset height when html changes so iframe can recalculate
    setHeight(300);
  }, [html]);

  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    const h = iframe.contentDocument.body.scrollHeight;
    if (h > 0) setHeight(h + 20);
  };

  return (
    <div className="bg-white mx-auto shadow-sm" style={{ maxWidth: width }}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        onLoad={handleLoad}
        style={{
          width: '100%',
          height: `${height}px`,
          border: 'none',
          display: 'block',
        }}
        title="Receipt Preview"
      />
    </div>
  );
}
