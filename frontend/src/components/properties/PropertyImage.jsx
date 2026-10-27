import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { resolvePropertyImage } from '../../utils/propertyImage';

export default function PropertyImage({ src, alt = '', className = '', ...props }) {
  const source = resolvePropertyImage(src);
  const [failedSource, setFailedSource] = useState(null);
  if (!source || failedSource === source) {
    return <span role="img" aria-label={alt ? `Chưa có ảnh: ${alt}` : 'Ảnh đang cập nhật'} className={'inline-flex items-center justify-center bg-slate-100 text-slate-400 ' + className}><ImageOff aria-hidden="true" className="h-7 w-7 shrink-0" /></span>;
  }
  return <img {...props} src={source} alt={alt} className={className} onError={() => setFailedSource(source)} />;
}
